import type { Session, User, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser extends User {
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: SupabaseAuthError | Error | null;
  isAuthenticated: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  password: string;
}

export type AuthError = SupabaseAuthError;
