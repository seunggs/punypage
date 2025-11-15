import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UpdateDocumentInput, Document } from '../types';

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDocumentInput) => {
      const { data, error } = await supabase
        .from('documents')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
    },
  });
}
