# AI-Powered Chat Assistant

An intelligent conversational AI assistant built on Cloudflare's platform, leveraging Llama 3.3 for natural language understanding and Cloudflare Workers AI for edge-based inference. The application demonstrates a complete AI-powered system with persistent memory, tool calling, and task scheduling capabilities.

## Live Demo

**Deployed Application:** https://agents-starter.bhaveshvuyyuru.workers.dev/

## Features

### Core Capabilities

-  Powered by Llama 3.3-70B model via Cloudflare Workers AI
- Persistent conversation history using Durable Objects with embedded SQLite for state management
- Built-in task scheduling system 
- WebSocket-based real-time chat interface
- State synchronization via Cloudflare Agents SDK and Durable Objects

### Available Tools

The assistant can use the following tools when appropriate:

1. **Weather Information** (`getWeatherInformation`)

   - Fetches real-time weather data for any city using the wttr.in API
   - Returns temperature, conditions, and humidity

2. **Local Time** (`getLocalTime`)

   - Retrieves current time for major cities worldwide
   - Uses WorldTimeAPI for accurate timezone-based time information

3. **Task Scheduling** (`scheduleTask`, `getScheduledTasks`, `cancelScheduledTask`)
   - Schedule tasks with cron expressions, delays, or specific dates
   - List and manage all scheduled tasks
   - Tasks execute automatically at scheduled times

## Project Structure

```
agents-starter/
├── src/
│   ├── server.ts          # Core agent logic with Llama 3.3 integration
│   │                      # - Chat class extending AIChatAgent
│   │                      # - Conditional tool passing logic
│   │                      # - Task execution handler
│   ├── tools.ts           # Tool definitions (weather, time, scheduling)
│   │                      # - Real API integrations
│   │                      # - Automatic execution
│   ├── app.tsx            # React chat interface component
│   │                      # - WebSocket connection via useAgent
│   │                      # - Streaming UI updates
│   │                      # - Theme support (light/dark)
│   └── utils.ts           # Helper functions for message processing
├── wrangler.jsonc         # Cloudflare Workers configuration
│                          # - Durable Object bindings
│                          # - Workers AI binding
│                          # - SQLite migrations
└── package.json           # Dependencies and scripts
```



## External API Integrations

- **Weather Data**: wttr.in (free weather API)
- **Time Information**: WorldTimeAPI.org (free timezone API)

All external integrations are free-tier services and do not require API keys.
