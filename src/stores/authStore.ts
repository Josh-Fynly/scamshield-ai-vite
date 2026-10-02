import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  bootstrapSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
}

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
  };
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('invalid login credentials') || message.includes('invalid password')) {
      return 'Invalid email or password.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message.includes('user already exists')) {
      return 'This email is already registered.';
    }
    if (message.includes('password')) {
      return 'Password does not meet requirements.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message || 'An authentication error occurred.';
  }
  return 'An unknown authentication error occurred.';
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => {
  const requireSupabase = () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Environment settings.');
    }
    return supabase;
  };

  return {
    user: null,
    isLoading: false,
    error: null,
    isInitialized: false,

    bootstrapSession: async () => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { data, error } = await client.auth.getSession();

        if (error) throw error;

        const user = mapSupabaseUser(data.session?.user ?? null);
        set({ user, isInitialized: true, isLoading: false });

        if (unsubscribe) {
          unsubscribe();
        }

        const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
          const nextUser = mapSupabaseUser(session?.user ?? null);
          set({ user: nextUser });
        });

        unsubscribe = subscription?.subscription.unsubscribe || null;
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isInitialized: true, isLoading: false, user: null });
      }
    },

    signIn: async (email: string, password: string) => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const user = mapSupabaseUser(data.user);
        set({ user, isLoading: false });
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isLoading: false, user: null });
        throw new Error(message);
      }
    },

    signUp: async (email: string, password: string) => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { data, error } = await client.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        const user = mapSupabaseUser(data.user);
        set({ user, isLoading: false });
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isLoading: false, user: null });
        throw new Error(message);
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { error } = await client.auth.signOut();

        if (error) throw error;

        set({ user: null, isLoading: false });
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    requestPasswordReset: async (email: string) => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        set({ isLoading: false });
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    updatePassword: async (newPassword: string) => {
      set({ isLoading: true, error: null });

      try {
        const client = requireSupabase();

        const { error } = await client.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        set({ isLoading: false });
      } catch (err) {
        const message = getAuthErrorMessage(err);
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    clearError: () => set({ error: null }),
  };
});
