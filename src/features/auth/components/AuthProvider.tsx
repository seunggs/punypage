import { createContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthState, AuthUser, Profile } from '../types';

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState((prev) => ({ ...prev, error, loading: false }));
        return;
      }

      if (session?.user) {
        // Validate email exists
        if (!session.user.email) {
          console.error('User session missing email');
          setState((prev) => ({
            ...prev,
            loading: false,
            error: new Error('User session missing email')
          }));
          return;
        }

        // Fetch profile data
        fetchProfile(session.user.id).then((result) => {
          setState({
            user: session.user as AuthUser,
            profile: result.profile,
            session,
            loading: false,
            error: result.error,
            isAuthenticated: true,
          });
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Validate email exists
        if (!session.user.email) {
          console.error('User session missing email');
          setState((prev) => ({
            ...prev,
            loading: false,
            error: new Error('User session missing email')
          }));
          return;
        }

        // Update auth state immediately, fetch profile in background
        setState({
          user: session.user as AuthUser,
          profile: null,
          session,
          loading: false,
          error: null,
          isAuthenticated: true,
        });

        // Fetch profile asynchronously
        fetchProfile(session.user.id).then((result) => {
          if (result.error) {
            setState((prev) => ({
              ...prev,
              profile: null,
              error: new Error('Failed to load profile data')
            }));
          } else {
            setState((prev) => ({ ...prev, profile: result.profile }));
          }
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

async function fetchProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { profile: null, error: new Error(error.message) };
    }

    return { profile: data, error: null };
  } catch (err) {
    console.error('Exception fetching profile:', err);
    return { profile: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}
