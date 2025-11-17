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
 */
export async function sendMessage(
  message: string,
  sdkSessionId: string | undefined,
  callbacks: SendMessageCallbacks
): Promise<void> {
  const { onMessage, onDone, onError } = callbacks;

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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
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
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

