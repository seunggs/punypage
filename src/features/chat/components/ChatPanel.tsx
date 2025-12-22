import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { sendMessage, interruptChat } from '@/lib/api/chat';
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
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCallDisplay {
  id: string;
  tool_name: string;
  input: Record<string, any>;
  result?: any;
  is_error?: boolean;
}

type ChatEvent =
  | { type: 'message'; data: Message }
  | { type: 'tool_call'; data: ToolCallDisplay };

interface ChatPanelProps {
  session: ChatSession;
}

export function ChatPanel({ session }: ChatPanelProps) {
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastDocumentHashRef = useRef<string | null>(null);
  const abortFnRef = useRef<(() => void) | null>(null);
  const isIntentionalInterruptRef = useRef<boolean>(false);

  const { data: loadedMessages, isLoading: messagesLoading } = useLoadMessages(session.id);
  const { data: document } = useDocument(session.document_id || '');
  const updateSession = useUpdateChatSession();
  const saveMessage = useSaveChatMessage();
  const queryClient = useQueryClient();

  // Load messages from database - ONLY on initial load
  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0) {
      setEvents((prevEvents) => {
        // If we already have events, don't overwrite them (preserves tool calls during streaming)
        if (prevEvents.length > 0) {
          return prevEvents;
        }

        // Only load messages on initial mount when events array is empty
        return loadedMessages.map((msg) => ({
          type: 'message' as const,
          data: {
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          },
        }));
      });
    }
  }, [loadedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events, streamingContent]);

  // Reset document hash and events when session changes (switching chats)
  useEffect(() => {
    lastDocumentHashRef.current = null;
    setEvents([]); // Clear events so messages can be reloaded for new session
  }, [session.id]);

  const handleInterrupt = async () => {
    // Capture requestId immediately to avoid race condition
    const requestId = currentRequestId;
    if (!requestId) return;

    setIsInterrupting(true);
    isIntentionalInterruptRef.current = true;

    try {
      // Call backend interrupt
      await interruptChat(requestId);

      // Abort SSE stream
      abortFnRef.current?.();

      // Save partial response if any content was streamed
      if (streamingContent) {
        // Add both assistant message and interrupted marker in single update
        setEvents((prev) => [
          ...prev,
          { type: 'message', data: { role: 'assistant', content: streamingContent } },
          { type: 'message', data: { role: 'user', content: 'Interrupted' } },
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
        setEvents((prev) => [
          ...prev,
          { type: 'message', data: { role: 'user', content: 'Interrupted' } },
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
      setCurrentRequestId(null);
      abortFnRef.current = null;
      // Don't reset isIntentionalInterruptRef here - let onError callback handle it
    }
  };

  const handleSendMessage = async (message: string) => {
    // Reset interrupt flag for new message
    isIntentionalInterruptRef.current = false;

    // Get current user ID for MCP server
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Add user message to state
    setEvents((prev) => [
      ...prev,
      { type: 'message', data: { role: 'user', content: message } },
    ]);

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

    // 🔍 DEBUG: Log the actual message being sent to backend (development only)
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

    let accumulatedContent = '';

    // Use sdk_session_id from session for resume
    const sdkSessionId = session.sdk_session_id || undefined;

    // Start streaming (with document context if changed)
    const abortFn = await sendMessage(messageToSend, sdkSessionId, userId, {
      onRequestId: (requestId) => {
        setCurrentRequestId(requestId);
      },
      onMessage: (msg) => {
        accumulatedContent += msg.content;
        setStreamingContent(accumulatedContent);
      },
      onToolUse: (toolUse) => {
        setEvents((prev) => [
          ...prev,
          {
            type: 'tool_call' as const,
            data: {
              id: toolUse.tool_use_id,
              tool_name: toolUse.tool_name,
              input: toolUse.input,
            },
          },
        ]);
      },
      onCacheInvalidate: (cacheEvent) => {
        console.log('[CHAT PANEL] ✓ onCacheInvalidate called with:', cacheEvent);
        const toolName = cacheEvent.tool_name;
        console.log('[CHAT PANEL] Tool name:', toolName);
        console.log('[CHAT PANEL] Session document_id:', session.document_id);

        // Handle document cache invalidation based on tool type
        if (toolName === 'mcp__punypage_internal__update_document' && session.document_id) {
          console.log('[CHAT PANEL] ✓ Invalidating cache for update_document');
          console.log('[CHAT PANEL] ✓ Invalidating key: ["documents", "' + session.document_id + '"]');
          queryClient.invalidateQueries({ queryKey: ['documents', session.document_id] });
          console.log('[CHAT PANEL] ✓ Invalidating key: ["documents"]');
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          console.log('[CHAT PANEL] ✓ Cache invalidation completed');
        } else if (toolName === 'mcp__punypage_internal__update_document' && !session.document_id) {
          console.error('[CHAT PANEL] ✗ update_document tool called but session.document_id is missing!');
        }

        if (toolName === 'mcp__punypage_internal__create_document') {
          console.log('[CHAT PANEL] ✓ Invalidating cache for create_document');
          console.log('[CHAT PANEL] ✓ Invalidating key: ["documents"]');
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          console.log('[CHAT PANEL] ✓ Cache invalidation completed');
        }
      },
      onToolResult: (toolResult) => {
        // Update tool call with result
        setEvents((prev) =>
          prev.map((event) => {
            if (event.type === 'tool_call' && event.data.id === toolResult.tool_use_id) {
              return {
                ...event,
                data: {
                  ...event.data,
                  result: toolResult.content,
                  is_error: toolResult.is_error,
                },
              };
            }
            return event;
          })
        );
      },
      onDone: (data) => {
        if (accumulatedContent) {
          // Add assistant message to state
          setEvents((prev) => [
            ...prev,
            { type: 'message' as const, data: { role: 'assistant' as const, content: accumulatedContent } },
          ]);

          // Save assistant message to Supabase
          saveMessage.mutate(
            {
              session_id: session.id,
              role: 'assistant',
              content: accumulatedContent,
            },
            {
              onError: (error) => {
                console.error('Failed to save assistant message:', error);
              },
            }
          );
        }

        // Update session with sdk_session_id if received
        if (data.sdkSessionId) {
          updateSession.mutate(
            {
              id: session.id,
              sdk_session_id: data.sdkSessionId,
            },
            {
              onError: (error) => {
                console.error('Failed to update session SDK ID:', error);
              },
            }
          );
        }

        setStreamingContent('');
        setIsStreaming(false);
        setCurrentRequestId(null);
        abortFnRef.current = null;
        isIntentionalInterruptRef.current = false;
      },
      onError: (error) => {
        // Skip showing error if this was an intentional interrupt
        if (isIntentionalInterruptRef.current) {
          isIntentionalInterruptRef.current = false;
          return;
        }

        console.error('Error:', error);
        setEvents((prev) => [
          ...prev,
          {
            type: 'message',
            data: {
              role: 'assistant',
              content: `Error: ${error}`,
            },
          },
        ]);
        setStreamingContent('');
        setIsStreaming(false);
        setCurrentRequestId(null);
        abortFnRef.current = null;
      },
    });

    abortFnRef.current = abortFn;
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
        {events.length === 0 && !streamingContent && (
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

        {/* Render events in chronological order */}
        {events.map((event, index) => {
          if (event.type === 'message') {
            return <ChatMessage key={index} role={event.data.role} content={event.data.content} />;
          } else if (event.type === 'tool_call') {
            const toolCall = event.data;
            return (
              <div
                key={toolCall.id}
                className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-xs"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🔧 {toolCall.tool_name}
                  </span>
                  {toolCall.result && !toolCall.is_error && (
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Completed</span>
                  )}
                  {toolCall.is_error && (
                    <span className="text-xs text-red-600 dark:text-red-400">✗ Error</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {JSON.stringify(toolCall.input, null, 2)}
                </div>
                {toolCall.result && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Result:</span> {String(toolCall.result)}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

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
