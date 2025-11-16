import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SignInCredentials } from '../types';

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: SignInCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
  });
}
