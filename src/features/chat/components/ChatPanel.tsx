import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { sendMessage } from '@/lib/api/chat';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (message: string) => {
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
    await sendMessage(message, sdkSessionId, {
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
      },
      onError: (error) => {
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
      },
    });
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
          <div className="flex justify-start mb-4">
            <div className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Agent is working...</span>
            </div>
          </div>
        )}

        {streamingContent && (
          <ChatMessage role="assistant" content={streamingContent} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}
