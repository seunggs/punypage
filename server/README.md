# Punypage Backend Server

Fastify-based backend server for Punypage application.

## Getting Started

### Development

Run both frontend and backend servers concurrently:

```bash
bun dev
```

This will start both servers with color-coded output:
- **Frontend** dev server on `http://localhost:3000` (cyan)
- **Backend** server on `http://localhost:3002` (magenta)

### Running Servers Individually

Run only the frontend:
```bash
bun run dev:frontend
```

Run only the backend:
```bash
bun run dev:server
```

## API Endpoints

### Health Check

**GET** `/api/health`

Returns the health status of the server.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T05:34:06.388Z",
  "uptime": 6.737671916,
  "environment": "development"
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3002)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/warn/error)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Main server entry point
│   └── routes/
│       └── health.ts      # Health check endpoint
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Building for Production

Build the server:

```bash
bun run build:server
```

Run the production server:

```bash
bun run start:server
```
