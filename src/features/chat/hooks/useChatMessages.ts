import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export function useSaveChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: ChatMessageInsert) => {
      const { data, error} = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries for this session
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', variables.session_id],
      });
    },
  });
}
