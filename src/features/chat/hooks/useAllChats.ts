import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatSession } from '@/types/database.types';

export function useAllChats() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
  });
}
