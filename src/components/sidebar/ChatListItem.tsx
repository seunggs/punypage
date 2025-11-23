import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/features/chat/types';
import { MessageSquare } from 'lucide-react';

interface ChatListItemProps {
  session: ChatSession;
  isActive?: boolean;
}

export function ChatListItem({ session, isActive }: ChatListItemProps) {
  // Generate a title from the session (we'll use first 50 chars or a default)
  const title = session.id.slice(0, 8);

  return (
    <Link
      to="/chats/$sessionId"
      params={{ sessionId: session.id }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isActive && 'bg-gray-100 dark:bg-gray-800'
      )}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500" />
      <span className="truncate">{title}</span>
    </Link>
  );
}
