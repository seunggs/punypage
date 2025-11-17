import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Query } from '@anthropic-ai/claude-agent-sdk';

export interface CreateChatStreamOptions {
  sdkSessionId?: string;
}

/**
 * Creates a streaming chat session using Claude Agent SDK
 *
 * @param message - The user message to send
 * @param options - Session configuration with optional sdkSessionId for resume
 * @returns Query async generator yielding SDK messages
 */
export function createChatStream(
  message: string,
  options: CreateChatStreamOptions = {}
): Query {
  const { sdkSessionId } = options;

  // Create async generator for streaming input mode
  async function* messageGenerator() {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: message,
      },
      parent_tool_use_id: null,
    } as any; // SDK accepts this structure but type definition is stricter
  }

  // Call query() with streaming input configuration
  return query({
    prompt: messageGenerator() as any,
    options: {
      permissionMode: 'bypassPermissions',
      settingSources: [],
      resume: sdkSessionId || undefined,
      includePartialMessages: true, // Enable real-time streaming chunks
    },
  });
}
