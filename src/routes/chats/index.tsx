import { createFileRoute, Link } from '@tanstack/react-router';
import { useAllChats } from '@/features/chat/hooks/useAllChats';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export const Route = createFileRoute('/chats/')({
  component: ChatsList,
});

function ChatsList() {
  const { data: sessions, isLoading } = useAllChats();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Chats</h1>
        <Link to="/chats/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="text-gray-500">Loading chats...</div>
      )}

      {!isLoading && sessions && sessions.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No chats yet</p>
          <Link to="/chats/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Start a new chat
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to="/chats/$sessionId"
              params={{ sessionId: session.id }}
              className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Chat {session.id.slice(0, 8)}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
