import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NewChatButton() {
  return (
    <Link to="/chats/new">
      <Button className="w-full" variant="default">
        <Plus className="mr-2 h-4 w-4" />
        New Chat
      </Button>
    </Link>
  );
}
