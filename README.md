# AI-Powered Chat Assistant

An AI-powered conversational assistant built on Cloudflare's platform.

## Live Demo

**Deployed Application:** https://agents-starter.bhaveshvuyyuru.workers.dev/

## Some features of this project include:

- **LLM Integration**: Uses Llama 3.3-70B via Cloudflare Workers AI
- **Conversational Memory**: Persistent conversation history using Durable Objects with SQLite
- **State Management**: Built-in state management via Cloudflare Agents SDK

## Architecture

This application meets Cloudflare's AI application requirements:

## Project Structure

```
agents-starter/
├── src/
│   ├── server.ts          # Agent logic with Llama 3.3 integration
│   ├── tools.ts           # Tool definitions (weather, time, scheduling)
│   ├── app.tsx            # React chat interface
│   └── utils.ts           # Helper functions
├── wrangler.jsonc         # Cloudflare Workers configuration
└── package.json           # Dependencies and scripts
```

- Weather and time tools use free APIs (wttr.in and WorldTimeAPI)
