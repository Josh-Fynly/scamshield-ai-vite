import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

/**
 * Represents an authenticated user.
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Authentication state and operations.
 *
 * - user: current authenticated user, or null if no session
 * - isLoading: in-flight auth operation (signup, signin, signout, password reset)
 * - error: last auth error message, or null
 * - isInitialized: bootstrap has completed (session checked or explicitly no session)
 *
 * Session token persistence is owned by @supabase/supabase-js.
 * No credentials, tokens, or passwords are stored by this store.
 */
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Operations
  bootstrapSession: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Whether onAuthStateChange has been subscribed.
 * Prevents duplicate subscriptions on bootstrap retries.
 */
let hasSubscribed = false;

export const useAuthStore = create<AuthState>((set) => {
  /**
   * Ensure subscription is registered exactly once.
   */
  const ensureSubscription = () => {
    if (hasSubscribed) {
      return;
    }

    hasSubscribed = true;

    if (!supabase) {
      return;
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? '',
          }
        : null;

      set({
        user,
        error: null,
      });

      // Trigger scan store reset when user changes
      const { useScanStore } = require('./scanStore');
      useScanStore.getState().resetForUser(user?.id ?? null);
    });
  };

  return {
    user: null,
    isLoading: false,
    error: null,
    isInitialized: false,

    bootstrapSession: async () => {
      if (!supabase) {
        set({
          user: null,
          isInitialized: true,
          error: 'Supabase not configured',
        });
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        const user = data.session?.user
          ? {
              id: data.session.user.id,
              email: data.session.user.email ?? '',
            }
          : null;

        set({
          user,
          isInitialized: true,
          error: null,
        });

        // Trigger scan store reset for bootstrapped user
        const { useScanStore } = require('./scanStore');
        useScanStore.getState().resetForUser(user?.id ?? null);

        // Subscribe to future changes
        ensureSubscription();
      } catch (err) {
        set({
          user: null,
          isInitialized: true,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to establish session',
        });
      }
    },

    signUp: async (email: string, password: string) => {
      if (!supabase) {
        set({
          error: 'Supabase not configured',
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // signUp may return a session (if auto-confirm) or not (if email verification required)
        const user = data.user
          ? {
              id: data.user.id,
              email: data.user.email ?? '',
            }
          : null;

        set({
          user,
          isLoading: false,
          error: null,
        });

        // Trigger scan store reset if user was created
        if (user) {
          const { useScanStore } = require('./scanStore');
          useScanStore.getState().resetForUser(user.id);
        }

        ensureSubscription();
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Sign-up failed. Please try again.',
        });
      }
    },

    signIn: async (email: string, password: string) => {
      if (!supabase) {
        set({
          error: 'Supabase not configured',
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        const user = data.user
          ? {
              id: data.user.id,
              email: data.user.email ?? '',
            }
          : null;

        set({
          user,
          isLoading: false,
          error: null,
        });

        // Trigger scan store reset for new user
        if (user) {
          const { useScanStore } = require('./scanStore');
          useScanStore.getState().resetForUser(user.id);
        }

        ensureSubscription();
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Sign-in failed. Please check your credentials.',
        });
      }
    },

    signOut: async () => {
      if (!supabase) {
        set({
          user: null,
          error: null,
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        set({
          user: null,
          isLoading: false,
          error: null,
        });

        // Trigger scan store reset
        const { useScanStore } = require('./scanStore');
        useScanStore.getState().resetForUser(null);
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Sign-out failed. Please try again.',
        });
      }
    },

    requestPasswordReset: async (email: string) => {
      if (!supabase) {
        set({
          error: 'Supabase not configured',
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email
        );

        if (error) {
          throw error;
        }

        set({
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Password reset request failed. Please try again.',
        });
      }
    },

    updatePassword: async (newPassword: string) => {
      if (!supabase) {
        set({
          error: 'Supabase not configured',
        });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          throw error;
        }

        set({
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Password update failed. Please try again.',
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});
