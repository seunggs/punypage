import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useCreateChatSession } from '@/features/chat/hooks/useChatSession';

export const Route = createFileRoute('/chats/new')({
  component: NewChat,
});

function NewChat() {
  const navigate = useNavigate();
  const createSession = useCreateChatSession();
  const hasCreated = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasCreated.current) return;
    hasCreated.current = true;

    const sessionId = crypto.randomUUID();

    createSession.mutate(
      { id: sessionId },
      {
        onSuccess: () => {
          // Redirect to the new chat session
          navigate({ to: '/chats/$sessionId', params: { sessionId } });
        },
        onError: (error) => {
          console.error('Failed to create session:', error);
          // Still redirect even on error (might be duplicate key)
          navigate({ to: '/chats/$sessionId', params: { sessionId } });
        },
      }
    );
  }, [navigate, createSession]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">Creating new chat...</div>
    </div>
  );
}
