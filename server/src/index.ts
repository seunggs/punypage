import Fastify from 'fastify';
import cors from '@fastify/cors';
import sse from '@fastify/sse';
import healthRoutes from './routes/health';
import { chatRoutes } from './routes/chat.js';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function start() {
  try {
    // Register SSE plugin first
    await server.register(sse);

    // Then register CORS
    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5500',
      credentials: true,
    });

    // Register routes
    await server.register(healthRoutes, { prefix: '/api' });
    await server.register(chatRoutes, { prefix: '/api' });

    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
