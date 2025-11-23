import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '../types';

export function useLoadMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!sessionId,
  });
}
