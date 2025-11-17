# Claude Agent SDK Chat Setup

This guide covers setting up the minimal streaming chat interface powered by Claude Agent SDK.

## Prerequisites

1. **Anthropic API Key**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. **Supabase Project**: Create a free project at [Supabase](https://supabase.com/)

## Setup Steps

### 1. Install Dependencies (Already Done)

```bash
bun install
```

### 2. Configure Environment Variables

#### Backend (.env)
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update `.env`:
```env
PORT=3002
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:3000

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### Frontend (.env.local)
Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

The default values should work:
```env
VITE_API_URL=http://localhost:3002
```

### 3. Set Up Supabase Database

Run the migration in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250114000000_create_chat_tables.sql`
4. Run the query

This creates:
- `chat_sessions` table (stores session metadata)
- `chat_messages` table (stores chat history)
- Necessary indexes and triggers

### 4. Start the Application

#### Development Mode (Recommended)

Run both frontend and backend concurrently:

```bash
bun run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3002

#### Separate Processes (Alternative)

Terminal 1 - Backend:
```bash
bun run dev:server
```

Terminal 2 - Frontend:
```bash
bun run dev:frontend
```

## Usage

1. Navigate to **http://localhost:3000/chat**
2. Type a message and press Enter or click Send
3. Watch Claude respond in real-time via streaming

## Architecture Overview

### Backend Structure
```
server/src/
├── agents/
│   └── chat.ts           # Claude Agent SDK wrapper
├── db/
│   └── supabase.ts       # Supabase client
├── routes/
│   ├── chat.ts           # SSE streaming endpoint
│   └── health.ts         # Health check
└── index.ts              # Fastify server
```

### Frontend Structure
```
src/
├── components/chat/
│   ├── ChatMessage.tsx   # Message bubble component
│   └── ChatInput.tsx     # Input with send button
├── lib/api/
│   └── chat.ts           # SSE client
└── routes/
    └── chat.tsx          # Chat page
```

### Key Features

✅ **Streaming Input Mode**: Messages stream in real-time
✅ **Persistent History**: All messages saved to Supabase
✅ **Session Resume**: Interrupted sessions can be resumed via SDK session ID
✅ **Minimal Setup**: No WebSockets, custom tools, or MCP servers
✅ **Type-Safe**: Full TypeScript support

## API Endpoints

### POST `/api/chat/:sessionId/stream`
Stream chat messages via Server-Sent Events (SSE)

**Request:**
```json
{
  "message": "Hello, Claude!"
}
```

**Response:** SSE stream with events:
- `message`: Incremental assistant response chunks
- `done`: Session complete with session IDs
- `error`: Error occurred during processing

### GET `/api/chat/:sessionId/messages`
Get all messages for a session

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "role": "user",
      "content": "Hello",
      "created_at": "2025-01-14T..."
    },
    // ...
  ]
}
```

## Configuration

### Agent Options (server/src/agents/chat.ts)

```typescript
{
  permissionMode: 'bypassPermissions',  // No permission prompts
  settingSources: [],                    // No filesystem settings
  resume: sdkSessionId || undefined      // Resume capability
}
```

### Customization

To modify agent behavior, edit `server/src/agents/chat.ts`:

- Change `permissionMode` to `'default'` for permission prompts
- Add `settingSources: ['project']` to load `.claude/settings.json`
- Add `maxTurns` to limit conversation length
- Add custom tools via `mcpServers` option

## Troubleshooting

### "Missing Supabase environment variables"
Ensure `.env` file exists with `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### "Missing Anthropic API key"
Set `ANTHROPIC_API_KEY` in your `.env` file

### CORS errors
Verify `FRONTEND_URL` in `.env` matches your frontend URL

### SSE connection issues
Check that both frontend and backend are running and ports match

## Next Steps

- Add user authentication
- Implement message editing/deletion
- Add support for images and files
- Integrate custom MCP tools
- Deploy to production (Vercel frontend + Fly.io/Railway backend)
