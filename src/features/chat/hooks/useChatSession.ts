import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: ChatSessionInsert) => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useUpdateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      sdk_session_id,
    }: {
      id: string;
      sdk_session_id: string;
    }) => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ sdk_session_id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
