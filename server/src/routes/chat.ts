import { type FastifyInstance } from 'fastify';
import { createChatStream } from '../agents/chat.js';

export async function chatRoutes(fastify: FastifyInstance) {
  // SSE endpoint for streaming chat - using GET (idiomatic SSE pattern)
  fastify.get<{
    Querystring: { message: string; sdkSessionId?: string };
  }>(
    '/chat/stream',
    { sse: true }, // Enable SSE plugin
    async (request, reply) => {
      const { message, sdkSessionId } = request.query;

      if (!message) {
        return reply.code(400).send({ error: 'Message is required' });
      }

      let newSdkSessionId: string | undefined;

      // Keep connection alive (prevents auto-close)
      reply.sse.keepAlive();

      // Clean up on client disconnect
      reply.sse.onClose(() => {
        fastify.log.info('SSE connection closed');
      });

      try {
        // Stream from agent
        const stream = createChatStream(message, {
          sdkSessionId: sdkSessionId || undefined,
        });

        for await (const msg of stream) {
          // Handle streaming chunks (real-time partial messages)
          if (msg.type === 'stream_event') {
            const event = msg.event;

            // Extract text delta from content_block_delta events
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              await reply.sse.send({
                event: 'message',
                data: {
                  role: 'assistant',
                  content: event.delta.text,
                },
              });
            }
          }

          // Handle complete assistant messages (for non-streaming fallback)
          if (msg.type === 'assistant') {
            const content = msg.message.content;
            for (const block of content) {
              if (block.type === 'text') {
                // Only send if we haven't already streamed this content
                // (This is a fallback in case streaming didn't work)
                fastify.log.debug('Received complete assistant message');
              }
            }
          }

          // Handle result message (contains session_id)
          if (msg.type === 'result') {
            newSdkSessionId = msg.session_id;
          }
        }

        // Send done event with sdk_session_id for client to persist
        await reply.sse.send({
          event: 'done',
          data: {
            sdkSessionId: newSdkSessionId,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        await reply.sse.send({
          event: 'error',
          data: {
            error: 'An error occurred while processing your message',
          },
        });
      } finally {
        // Close the connection
        reply.sse.close();
      }
    }
  );
}
