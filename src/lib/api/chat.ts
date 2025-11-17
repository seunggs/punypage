const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageCallbacks {
  onMessage: (message: ChatMessage) => void;
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
  callbacks: SendMessageCallbacks
): Promise<() => void> {
  const { onMessage, onDone, onError } = callbacks;
  const abortController = new AbortController();

  // Start the fetch in the background
  (async () => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      // Build query parameters - idiomatic SSE uses GET
      const params = new URLSearchParams({ message });
      if (sdkSessionId) {
        params.append('sdkSessionId', sdkSessionId);
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

          if (event === 'message') {
            onMessage(data);
          } else if (event === 'done') {
            onDone({ sdkSessionId: data.sdkSessionId });
          } else if (event === 'error') {
            onError(data.error);
          }
        }
      }
    } catch (error) {
      // Only call onError if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        onError(error.message);
      } else if (error && typeof error === 'object') {
        // Handle non-Error objects
        onError(JSON.stringify(error));
      } else if (error) {
        // Handle primitives
        onError(String(error));
      }
    } finally {
      // Clean up reader
      if (reader) {
        try {
          reader.cancel();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  })();

  // Return abort function for cleanup
  return () => {
    abortController.abort();
  };
}

