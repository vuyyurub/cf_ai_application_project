import { routeAgentRequest, type Schedule } from "agents";

import { getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";

export class Chat extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    let mcpTools = {};
    try {
      mcpTools = this.mcp.getAITools();
    } catch (error) {
    }

    const allTools = {
      ...tools,
      ...mcpTools
    };

    const workersai = createWorkersAI({ binding: this.env.AI });
    const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const cleanedMessages = cleanupMessages(this.messages);

        const lastUserMessage = cleanedMessages
          .filter(m => m.role === "user")
          .slice(-1)[0];
        const lastMessageText = lastUserMessage?.parts
          ?.filter(p => p.type === "text")
          .map(p => (p as { text: string }).text)
          .join("")
          .toLowerCase() || "";

        const needsTools = 
          lastMessageText.includes("weather") ||
          lastMessageText.includes("time") ||
          lastMessageText.includes("schedule") ||
          lastMessageText.includes("remind") ||
          lastMessageText.includes("task");

        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: needsTools ? allTools : {},
          executions
        });

        const systemPrompt = `You are a helpful AI assistant. Answer user questions using your knowledge about topics, concepts, companies, animals, technology, and general information.

${needsTools ? `Available tools:
- getWeatherInformation: for weather queries
- getLocalTime: for time queries  
- scheduleTask/getScheduledTasks/cancelScheduledTask: for scheduling

Use tools only when explicitly needed. Answer all other questions directly from your knowledge.` : `Answer questions directly from your knowledge.`}

${getSchedulePrompt({ date: new Date() })}
`;

        const modelMessages = await convertToModelMessages(processedMessages);
        
        console.log("=== LLAMA 3.3 REQUEST ===");
        console.log("System Prompt:", systemPrompt);
        console.log("Last message:", lastMessageText);
        console.log("Needs tools:", needsTools);
        console.log("Messages:", JSON.stringify(modelMessages, null, 2));
        console.log("Available Tools:", needsTools ? Object.keys(allTools) : "none");
        console.log("========================");

        const result = streamText({
          system: systemPrompt,
          messages: modelMessages,
          model,
          tools: needsTools ? allTools : undefined,
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        result.text.then(text => {
          console.log("=== LLAMA 3.3 RESPONSE ===");
          console.log("Response Text:", text);
          console.log("==========================");
        }).catch(err => {
          console.error("Error getting response text:", err);
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;

