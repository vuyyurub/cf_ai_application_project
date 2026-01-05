/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";

const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    try {
      const response = await fetch(
        `https://wttr.in/${encodeURIComponent(city)}?format=j1`
      );
      
      if (!response.ok) {
        return `Sorry, I couldn't fetch weather for ${city}. Please try again.`;
      }
      
      const data = await response.json() as {
        current_condition: Array<{
          weatherDesc: Array<{ value: string }>;
          temp_F: string;
          humidity: string;
        }>;
      };
      const current = data.current_condition[0];
      const condition = current.weatherDesc[0].value;
      const temp = current.temp_F;
      const humidity = current.humidity;
      
      return `The weather in ${city} is ${condition}, ${temp}°F with ${humidity}% humidity.`;
    } catch (error) {
      console.error("Weather API error:", error);
      const message = error instanceof Error ? error.message : String(error);
      return `Error fetching weather for ${city}: ${message}`;
    }
  }
});

const getLocalTime = tool({
  description: "get the local time for a specified location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    try {
      const timezoneMap: Record<string, string> = {
        "new york": "America/New_York",
        "london": "Europe/London",
        "tokyo": "Asia/Tokyo",
        "los angeles": "America/Los_Angeles",
        "chicago": "America/Chicago",
        "paris": "Europe/Paris",
        "sydney": "Australia/Sydney",
        "mumbai": "Asia/Kolkata",
        "beijing": "Asia/Shanghai",
        "moscow": "Europe/Moscow"
      };
      
      const normalizedLocation = location.toLowerCase();
      const timezone = timezoneMap[normalizedLocation] || "UTC";
      
      const response = await fetch(
        `https://worldtimeapi.org/api/timezone/${timezone}`
      );
      
      if (!response.ok) {
        const now = new Date();
        return `The current time in ${location} is approximately ${now.toLocaleTimeString()} (timezone lookup failed, showing UTC)`;
      }
      
      const data = await response.json() as { datetime: string };
      const dateTime = new Date(data.datetime);
      const timeString = dateTime.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      
      return `The current time in ${location} is ${timeString}`;
    } catch (error) {
      console.error("Time API error:", error);
      const now = new Date();
      const message = error instanceof Error ? error.message : String(error);
      return `The current time in ${location} is approximately ${now.toLocaleTimeString()} (error: ${message})`;
    }
  }
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
      const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
      const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
      const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask
} satisfies ToolSet;

export const executions = {
};
