import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UpdatePasswordCredentials } from '../types';

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ password }: UpdatePasswordCredentials) => {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
      return data;
    },
  });
}
