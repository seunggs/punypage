import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ResetPasswordCredentials } from '../types';

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ email }: ResetPasswordCredentials) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      return data;
    },
  });
}
