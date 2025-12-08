import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { sendMessage, interruptChat } from '@/lib/api/chat';
import { useUpdateChatSession } from '../hooks/useChatSession';
import { useSaveChatMessage } from '../hooks/useChatMessages';
import { useLoadMessages } from '../hooks/useLoadMessages';
import type { ChatSession } from '../types';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { MessageSquare, Loader2 } from 'lucide-react';

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
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortFnRef = useRef<(() => void) | null>(null);
  const isIntentionalInterruptRef = useRef<boolean>(false);

  const { data: loadedMessages, isLoading: messagesLoading } = useLoadMessages(session.id);
  const updateSession = useUpdateChatSession();
  const saveMessage = useSaveChatMessage();

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

  const handleInterrupt = async () => {
    if (!currentRequestId) return;

    setIsInterrupting(true);
    isIntentionalInterruptRef.current = true;

    try {
      // Call backend interrupt
      await interruptChat(currentRequestId);

      // Abort SSE stream
      abortFnRef.current?.();

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
      setCurrentRequestId(null);
      abortFnRef.current = null;
      // Don't reset isIntentionalInterruptRef here - let onError callback handle it
    }
  };

  const handleSendMessage = async (message: string) => {
    // Reset interrupt flag for new message
    isIntentionalInterruptRef.current = false;

    // Add user message to state
    const userMessage: Message = {
      role: 'user',
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to Supabase
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

    setIsStreaming(true);
    setStreamingContent('');

    let accumulatedContent = '';

    // Use sdk_session_id from session for resume
    const sdkSessionId = session.sdk_session_id || undefined;

    // Start streaming
    const abortFn = await sendMessage(message, sdkSessionId, {
      onRequestId: (requestId) => {
        setCurrentRequestId(requestId);
      },
      onMessage: (msg) => {
        accumulatedContent += msg.content;
        setStreamingContent(accumulatedContent);
      },
      onDone: (data) => {
        if (accumulatedContent) {
          // Add assistant message to state
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: accumulatedContent },
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
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${error}`,
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
      <ChatInput onSend={handleSendMessage} isStreaming={isStreaming} onInterrupt={handleInterrupt} />
    </div>
  );
}
