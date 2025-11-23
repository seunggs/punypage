import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatSession } from '../types';

export function useLoadSession(sessionId: string) {
  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    enabled: !!sessionId,
  });
}
