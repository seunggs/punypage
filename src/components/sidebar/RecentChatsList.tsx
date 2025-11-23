import { useAllChats } from '@/features/chat/hooks/useAllChats';
import { ChatListItem } from './ChatListItem';
import { useParams } from '@tanstack/react-router';

export function RecentChatsList() {
  const { data: sessions, isLoading } = useAllChats();
  const params = useParams({ strict: false });
  const currentSessionId = 'sessionId' in params ? params.sessionId : undefined;

  if (isLoading) {
    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse mb-0.5" />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <p className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
        No chats yet
      </p>
    );
  }

  return (
    <div>
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
