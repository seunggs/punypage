import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { createChatWebSocket, interruptChat, type ChatWebSocket } from '@/lib/api/chat';
import { useUpdateChatSession } from '../hooks/useChatSession';
import { useSaveChatMessage } from '../hooks/useChatMessages';
import { useLoadMessages } from '../hooks/useLoadMessages';
import type { ChatSession } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useDocument } from '@/features/documents/hooks/useDocument';
import { formatDocumentContext } from '@/features/documents/utils/formatDocumentContext';
import { hashDocument } from '@/features/documents/utils/hashDocument';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  session: ChatSession;
}

export function ChatPanel({ session }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isInterrupting, setIsInterrupting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastDocumentHashRef = useRef<string | null>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const isIntentionalInterruptRef = useRef<boolean>(false);
  const streamingContentRef = useRef<string>('');

  const { data: loadedMessages, isLoading: messagesLoading } = useLoadMessages(session.id);
  const { data: document } = useDocument(session.document_id || '');
  const updateSession = useUpdateChatSession();
  const saveMessage = useSaveChatMessage();
  const queryClient = useQueryClient();

  // Load messages from database
  useEffect(() => {
    if (loadedMessages) {
      setMessages(
        loadedMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      );
    }
  }, [loadedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Reset refs when switching sessions
  useEffect(() => {
    lastDocumentHashRef.current = null;
    streamingContentRef.current = '';
  }, [session.id]);

  // WebSocket connection
  useEffect(() => {
    // Close any existing connection first (handles React Strict Mode cleanup)
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Create WebSocket connection
    const ws = createChatWebSocket(session.id, session.sdk_session_id || undefined, {
      onJoined: (roomId) => {
        // Room joined successfully
      },
      onSdkSessionId: (sdkSessionId) => {
        // Save SDK session ID to database (sent after first message)
        if (!session.sdk_session_id) {
          updateSession.mutate({
            id: session.id,
            sdk_session_id: sdkSessionId,
          });
        }
      },
      onMessage: (msg) => {
        // Accumulate streaming content in both ref and state
        streamingContentRef.current += msg.content;
        setStreamingContent((prev) => prev + msg.content);
      },
      onToolUse: (toolUse) => {
        // Tool usage events (optional - for displaying tool calls in UI)
        // Can be implemented later if needed
      },
      onToolResult: (toolResult) => {
        // Tool result events (optional - for displaying tool results in UI)
        // Can be implemented later if needed
      },
      onCacheInvalidate: (cacheEvent) => {
        // Invalidate React Query cache when document is created/updated
        const toolName = cacheEvent.tool_name;

        if (toolName === 'mcp__punypage_internal__update_document' && session.document_id) {
          queryClient.invalidateQueries({ queryKey: ['documents', session.document_id] });
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }

        if (toolName === 'mcp__punypage_internal__create_document') {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
      },
      onDone: () => {
        // onDone is called once when WebSocket receives stop event
        const content = streamingContentRef.current;

        if (content) {
          // Add to messages
          setMessages((prev) => [...prev, { role: 'assistant', content }]);

          // Save to database - only runs once because onDone fires once
          saveMessage.mutate({
            session_id: session.id,
            role: 'assistant',
            content,
          });
        }

        // Clear
        streamingContentRef.current = '';
        setStreamingContent('');
        setIsStreaming(false);
      },
      onError: (error) => {
        // Skip showing error if this was an intentional interrupt
        if (isIntentionalInterruptRef.current) {
          isIntentionalInterruptRef.current = false;
          return;
        }

        console.error('WebSocket error:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${error}`,
          },
        ]);
        setStreamingContent('');
        setIsStreaming(false);
      },
      onConnected: () => {
        // WebSocket connected
      },
      onDisconnected: () => {
        // WebSocket disconnected
      },
    });

    wsRef.current = ws;

    // Cleanup: close WebSocket when unmounting or session changes
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [session.id]);

  const handleInterrupt = async () => {
    if (!isStreaming) return;

    setIsInterrupting(true);
    isIntentionalInterruptRef.current = true;

    try {
      // Call backend interrupt with room_id (session.id)
      await interruptChat(session.id);

      // Save partial response if any content was streamed
      if (streamingContent) {
        // Add both assistant message and interrupted marker in single update
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: streamingContent },
          { role: 'user', content: 'Interrupted' },
        ]);

        // Save assistant message to Supabase
        saveMessage.mutate(
          {
            session_id: session.id,
            role: 'assistant',
            content: streamingContent,
          },
          {
            onError: (error) => {
              console.error('Failed to save interrupted message:', error);
            },
          }
        );
      } else {
        // No content streamed yet, just add interrupted message
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: 'Interrupted' },
        ]);
      }

      // Save interrupted message to Supabase
      saveMessage.mutate(
        {
          session_id: session.id,
          role: 'user',
          content: 'Interrupted',
        },
        {
          onError: (error) => {
            console.error('Failed to save interrupted marker:', error);
          },
        }
      );
    } catch (error) {
      console.error('Interrupt failed:', error);
    } finally {
      setIsStreaming(false);
      setIsInterrupting(false);
      setStreamingContent('');
      // Don't reset isIntentionalInterruptRef here - let onError callback handle it
    }
  };

  const handleSendMessage = async (message: string) => {
    // Reset interrupt flag for new message
    isIntentionalInterruptRef.current = false;

    // Check WebSocket connection and join status
    if (!wsRef.current || !wsRef.current.isConnected()) {
      console.error('WebSocket not connected');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Not connected to chat server',
        },
      ]);
      return;
    }

    if (!wsRef.current.isJoined()) {
      console.error('WebSocket not joined to session yet');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Joining session, please wait...',
        },
      ]);
      return;
    }

    // Add user message to state
    const userMessage: Message = {
      role: 'user',
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save ONLY user message to Supabase (not document context)
    saveMessage.mutate(
      {
        session_id: session.id,
        role: 'user',
        content: message,
      },
      {
        onError: (error) => {
          console.error('Failed to save user message:', error);
        },
      }
    );

    // Prepare message with document context for AI
    let messageToSend = message;
    let documentIncluded = false;

    if (document) {
      // Hash the current document
      const currentHash = hashDocument(document.content, document.title);

      // Only include document if it changed since last message
      if (currentHash !== lastDocumentHashRef.current) {
        const documentContext = formatDocumentContext(document.id, document.content, document.title);
        messageToSend = `${documentContext}\n\n${message}`;
        lastDocumentHashRef.current = currentHash;
        documentIncluded = true;
      }
    }

    // 🔍 DEBUG: Log the actual message being sent to agent (development only)
    if (import.meta.env.DEV) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 MESSAGE SENT TO AGENT SDK:');
      console.log(`📄 Document context included: ${documentIncluded}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(messageToSend);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    setIsStreaming(true);
    setStreamingContent('');

    // Send message over persistent WebSocket connection
    wsRef.current.send(messageToSend);
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b bg-white dark:bg-gray-800">
        <h1 className="text-base font-normal text-gray-900 dark:text-gray-100">
          Chat with Claude
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex items-center justify-center h-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquare />
                </EmptyMedia>
                <EmptyTitle>No Messages Yet</EmptyTitle>
                <EmptyDescription>
                  Start a conversation by typing a message below
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}

        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Agent is working...</span>
          </div>
        )}

        {streamingContent && (
          <ChatMessage role="assistant" content={streamingContent} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        isStreaming={isStreaming}
        isInterrupting={isInterrupting}
        onInterrupt={handleInterrupt}
      />
    </div>
  );
}
