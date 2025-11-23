import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatSession } from '../types';

/**
 * Hook to get or create a chat session for a document
 * Enforces 1:1 relationship between document and chat session
 */
export function useDocumentChat(documentId: string) {

  // Query to get existing chat session for document
  const query = useQuery({
    queryKey: ['document-chat', documentId],
    queryFn: async () => {
      // Try to find existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // If session exists, return it
      if (existingSession) {
        return existingSession as ChatSession;
      }

      // Otherwise create a new session
      const { data: { user } } = await supabase.auth.getUser();

      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          document_id: documentId,
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      return newSession as ChatSession;
    },
  });

  return query;
}
