# Punypage Backend Server

FastAPI-based backend server for Punypage application.

## Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager

## Getting Started

### Development

Run both frontend and backend servers:

```bash
bun dev
```

This starts:
- **Frontend** dev server on `http://localhost:5500` (cyan)
- **Backend** server on `http://localhost:4000` (magenta)

Multiple worktrees automatically get sequential ports (5501/4001, 5502/4002, etc.)

### First-time Setup

1. Install dependencies:
```bash
cd server
uv sync
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run development server:
```bash
bun dev:server
```

## API Endpoints

### Health Check
**GET** `/api/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T16:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### Chat Stream
**GET** `/api/chat/stream?message=...&session_id=...`

Streams chat responses via Server-Sent Events (SSE).

**Query Parameters:**
- `message` (required): User message (1-50000 characters)
- `session_id` (optional): Session ID to resume previous conversation

**Response Events:**
- `message`: Partial text chunks as they arrive
  ```
  event: message
  data: {"role": "assistant", "content": "partial text"}
  ```
- `done`: Completion event with session ID for persistence
  ```
  event: done
  data: {"sessionId": "sdk_session_abc123"}
  ```
- `error`: Error information
  ```
  event: error
  data: {"error": "error message"}
  ```

## Project Structure

```
server/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings management
│   ├── core/
│   │   ├── middleware.py    # Request logging middleware
│   │   └── dependencies.py  # Auth dependencies
│   ├── agents/
│   │   └── chat_agent.py    # Claude Agent SDK integration
│   ├── routes/
│   │   ├── health.py        # Health check endpoint
│   │   └── chat.py          # Chat streaming endpoint
│   ├── schemas/
│   │   └── chat.py          # Pydantic models
│   └── utils/
│       └── sse.py           # SSE formatting helpers
├── pyproject.toml           # uv dependencies
└── .env.example             # Environment template
```

## Environment Variables

See `.env.example` for full list. Key variables:

- `PORT` - Server port (auto-set from worktree)
- `HOST` - Server host (default: 0.0.0.0)
- `ENVIRONMENT` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/warn/error)
- `FRONTEND_URL` - Frontend URL for CORS (auto-set from worktree)
- `ANTHROPIC_API_KEY` - Anthropic API key (required)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - JWT secret for auth (optional)

## Technologies

- **FastAPI** - Modern, fast web framework
- **uvicorn** - ASGI server
- **Claude Agent SDK** - Anthropic's official Python SDK
- **Pydantic** - Data validation and settings management
- **Supabase** - Backend as a Service (auth, database)
- **uv** - Fast Python package manager

## Development

### Running Tests

```bash
cd server
uv run pytest
```

### Adding Dependencies

```bash
cd server
uv add <package-name>
```

### Running Production Server

```bash
bun run start:server
# or
cd server && PORT=4000 uv run uvicorn app.main:app --host 0.0.0.0 --port 4000
```

## Architecture

The server uses a per-request `ClaudeSDKClient` pattern for chat streaming:

1. Client sends message via SSE endpoint
2. Server creates new `ClaudeSDKClient` instance
3. Client connects to Claude with optional session resume
4. Messages stream back as SSE events
5. Session ID returned for future resume

This architecture is ready for future RAG integration with LlamaIndex and vector storage.
