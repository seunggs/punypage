const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatWebSocketCallbacks {
  onJoined?: (roomId: string) => void;
  onSdkSessionId?: (sdkSessionId: string) => void;
  onMessage: (message: ChatMessage) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface ChatWebSocket {
  send: (message: string) => void;
  close: () => void;
  isConnected: () => boolean;
  isJoined: () => boolean;
}

/**
 * Create a persistent WebSocket connection for chat using join room pattern.
 *
 * Pattern:
 *   1. Connect to WebSocket
 *   2. Send join message with room ID (chat session ID) and optional SDK session ID
 *   3. Wait for joined confirmation
 *   4. Send messages over same connection
 *   5. Receive SDK session ID after first message (save to database)
 *   6. On disconnect, session stays alive on server for reconnection
 *
 * @param roomId - Chat session ID (our UUID) for the WebSocket room
 * @param sdkSessionId - Optional Claude SDK session ID for resuming conversations
 * @param callbacks - Event handlers for WebSocket events
 * @returns WebSocket control object
 */
export function createChatWebSocket(
  roomId: string,
  sdkSessionId: string | undefined,
  callbacks: ChatWebSocketCallbacks
): ChatWebSocket {
  // Convert HTTP URL to WebSocket URL
  const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
  const ws = new WebSocket(`${wsUrl}/api/chat/ws`);

  let connected = false;
  let joined = false;

  ws.onopen = () => {
    connected = true;
    callbacks.onConnected?.();

    // Send join message immediately after connection
    // room_id: WebSocket room identifier (our chat session ID)
    // sdk_session_id: If provided, backend will resume Claude SDK session
    const joinMessage: any = {
      type: 'join',
      room_id: roomId,
    };
    if (sdkSessionId) {
      joinMessage.sdk_session_id = sdkSessionId;
    }

    ws.send(JSON.stringify(joinMessage));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'joined') {
        joined = true;
        callbacks.onJoined?.(data.room_id);
      } else if (data.type === 'sdk_session_id') {
        callbacks.onSdkSessionId?.(data.sdk_session_id);
      } else if (data.type === 'message') {
        callbacks.onMessage({
          role: data.role,
          content: data.content,
        });
      } else if (data.type === 'done') {
        callbacks.onDone();
      } else if (data.type === 'error') {
        callbacks.onError(data.error);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      callbacks.onError('Failed to parse server message');
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    callbacks.onError('WebSocket connection error');
  };

  ws.onclose = () => {
    connected = false;
    joined = false;
    callbacks.onDisconnected?.();
  };

  return {
    send: (message: string) => {
      if (!joined) {
        callbacks.onError('Not joined to session yet. Please wait.');
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'message',
            content: message,
          })
        );
      } else {
        callbacks.onError('WebSocket not connected');
      }
    },
    close: () => {
      // Optionally send leave message before closing
      if (joined && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave' }));
      }
      ws.close();
    },
    isConnected: () => connected && ws.readyState === WebSocket.OPEN,
    isJoined: () => joined,
  };
}

/**
 * Interrupt an active chat stream
 */
export async function interruptChat(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/api/chat/interrupt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
}
