import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/sign-in' });
  };

  if (!user) {
    return (
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: '/sign-in' })}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 px-2 py-1">
        <User className="h-4 w-4 text-gray-500" />
        <span className="text-sm truncate">{user.email}</span>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
