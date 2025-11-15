import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Document } from '../types';

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Document;
    },
    enabled: !!id,
  });
}
