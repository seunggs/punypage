import { redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';

export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({
      to: '/sign-in',
      search: {
        redirect: window.location.pathname,
      },
    });
  }

  return { session };
}

export async function redirectIfAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    throw redirect({
      to: '/',
    });
  }

  return {};
}
