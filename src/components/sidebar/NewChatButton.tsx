import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

export function NewChatButton() {
  return (
    <Link to="/chats/new" className="block w-full">
      <Button className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
        <MessageSquarePlus className="h-4 w-4" />
        New Chat
      </Button>
    </Link>
  );
}
