const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolUse {
  tool_use_id: string;
  tool_name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  tool_use_id: string;
  content: any;
  is_error: boolean;
}

export interface CacheInvalidateEvent {
  tool_name: string;
  tool_response: Record<string, any>;
}

export interface SendMessageCallbacks {
  onRequestId: (requestId: string) => void;
  onMessage: (message: ChatMessage) => void;
  onToolUse?: (toolUse: ToolUse) => void;
  onToolResult?: (toolResult: ToolResult) => void;
  onCacheInvalidate?: (cacheEvent: CacheInvalidateEvent) => void;
  onDone: (data: { sdkSessionId?: string }) => void;
  onError: (error: string) => void;
}

/**
 * Send a message and stream the response via SSE
 * Returns an abort function to cancel the request
 */
export async function sendMessage(
  message: string,
  sdkSessionId: string | undefined,
  userId: string | undefined,
  callbacks: SendMessageCallbacks
): Promise<() => void> {
  const { onRequestId, onMessage, onToolUse, onToolResult, onCacheInvalidate, onDone, onError } = callbacks;
  const abortController = new AbortController();
  let isAborted = false;

  // Start the fetch in the background
  (async () => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null | undefined = null;

    try {
      // Build query parameters - idiomatic SSE uses GET
      const params = new URLSearchParams({ message });
      if (sdkSessionId) {
        params.append('sdkSessionId', sdkSessionId);
      }
      if (userId) {
        params.append('user_id', userId);
      }

      const response = await fetch(`${API_URL}/api/chat/stream?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (event === 'requestId') {
            onRequestId(data.requestId);
          } else if (event === 'message') {
            onMessage(data);
          } else if (event === 'tool_use') {
            onToolUse?.(data);
          } else if (event === 'tool_result') {
            onToolResult?.(data);
          } else if (event === 'cache_invalidate') {
            console.log('[SSE CLIENT] ✓ Received cache_invalidate event:', data);
            if (onCacheInvalidate) {
              console.log('[SSE CLIENT] ✓ Calling onCacheInvalidate callback');
              onCacheInvalidate(data);
              console.log('[SSE CLIENT] ✓ onCacheInvalidate callback completed');
            } else {
              console.warn('[SSE CLIENT] ✗ onCacheInvalidate callback is undefined!');
            }
          } else if (event === 'done') {
            onDone({ sdkSessionId: data.sdkSessionId });
          } else if (event === 'error') {
            onError(data.error);
          }
        }
      }
    } catch (error) {
      // Skip error handling if aborted (intentional interruption)
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently ignore abort errors
        isAborted = true;
        return;
      }

      // Only call onError for actual errors
      if (error instanceof Error) {
        onError(error.message);
      } else if (error && typeof error === 'object') {
        // Check if it's an abort-related error
        const errObj = error as any;
        if (errObj.name === 'AbortError' || errObj.code === 20) {
          return; // Silently ignore
        }
        onError(JSON.stringify(error));
      } else if (error) {
        onError(String(error));
      }
    } finally {
      // Clean up reader (skip if already aborted to avoid errors)
      if (reader && !isAborted) {
        try {
          await reader.cancel();
        } catch (e) {
          // Ignore cleanup errors (e.g., AbortError)
        }
      }
    }
  })().catch((err) => {
    // Catch any unhandled promise rejections (e.g., AbortError)
    // These are already handled in the try-catch above or are intentional aborts
    if (err?.name !== 'AbortError') {
      console.error('Unhandled error in sendMessage:', err);
    }
  });

  // Return abort function for cleanup
  return () => {
    isAborted = true;
    abortController.abort();
  };
}

/**
 * Interrupt an active chat stream
 */
export async function interruptChat(requestId: string): Promise<void> {
  await fetch(`${API_URL}/api/chat/interrupt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId }),
  });
}

