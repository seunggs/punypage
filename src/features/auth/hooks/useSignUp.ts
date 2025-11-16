import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SignUpCredentials } from '../types';

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password, full_name }: SignUpCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || '',
          },
        },
      });

      if (error) throw error;
      return data;
    },
  });
}
