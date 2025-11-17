import { useAllChats } from '@/features/chat/hooks/useAllChats';
import { ChatListItem } from './ChatListItem';
import { useParams } from '@tanstack/react-router';

export function RecentChatsList() {
  const { data: sessions, isLoading } = useAllChats();
  const params = useParams({ strict: false });
  const currentSessionId = 'sessionId' in params ? params.sessionId : undefined;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-gray-500">
        No chats yet. Start a new conversation!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <ChatListItem
          key={session.id}
          session={session}
          isActive={session.id === currentSessionId}
        />
      ))}
    </div>
  );
}
