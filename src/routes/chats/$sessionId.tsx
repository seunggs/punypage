import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendMessage } from '@/lib/api/chat';
import { useUpdateChatSession } from '@/features/chat/hooks/useChatSession';
import { useSaveChatMessage } from '@/features/chat/hooks/useChatMessages';
import { useLoadSession } from '@/features/chat/hooks/useLoadSession';
import { useLoadMessages } from '@/features/chat/hooks/useLoadMessages';

export const Route = createFileRoute('/chats/$sessionId')({
  component: Chat,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function Chat() {
  const { sessionId } = Route.useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useLoadSession(sessionId);
  const { data: loadedMessages, isLoading: messagesLoading } = useLoadMessages(sessionId);
  const updateSession = useUpdateChatSession();
  const saveMessage = useSaveChatMessage();

  // Load messages from database on mount
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
    saveMessage.mutate({
      session_id: sessionId,
      role: 'user',
      content: message,
    });

    setIsStreaming(true);
    setStreamingContent('');

    let accumulatedContent = '';

    // Use sdk_session_id from loaded session for resume
    const sdkSessionId = session?.sdk_session_id || undefined;

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
          saveMessage.mutate({
            session_id: sessionId,
            role: 'assistant',
            content: accumulatedContent,
          });
        }

        // Update session with sdk_session_id if received
        if (data.sdkSessionId) {
          updateSession.mutate({
            id: sessionId,
            sdk_session_id: data.sdkSessionId,
          });
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

  if (sessionLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Chat with Claude
        </h1>
        <div className="text-xs text-gray-500">Session: {sessionId.slice(0, 8)}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a conversation by typing a message below
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-200 text-gray-900">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">●</div>
                <div className="animate-pulse animation-delay-200">●</div>
                <div className="animate-pulse animation-delay-400">●</div>
              </div>
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
