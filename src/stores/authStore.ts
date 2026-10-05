import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useScanStore } from './scanStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  bootstrapSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    requiresEmailConfirmation: boolean;
  }>;
  signOut: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

let authSubscriptionEstablished = false;
let bootstrapPromise: Promise<void> | null = null;
let authGeneration = 0;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function applyAuthenticatedUser(user: User | null): void {
  useAuthStore.setState({
    user,
    error: null,
  });

  useScanStore.getState().resetForUser(user?.id ?? null);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  bootstrapSession: async () => {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      if (!supabase) {
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          error:
            'Authentication is not configured. Add the required Supabase environment variables.',
        });

        useScanStore.getState().resetForUser(null);
        return;
      }

      set({
        isLoading: true,
        error: null,
      });

      if (!authSubscriptionEstablished) {
        const { data } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            authGeneration += 1;

            const user = session?.user ?? null;

            applyAuthenticatedUser(user);

            set({
              isInitialized: true,
              isLoading: false,
            });
          }
        );

        if (data.subscription) {
          authSubscriptionEstablished = true;
        }
      }

      const requestGeneration = ++authGeneration;

      const { data, error } = await supabase.auth.getSession();

      if (requestGeneration !== authGeneration) {
        return;
      }

      if (error) {
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          error: getErrorMessage(
            error,
            'Could not restore your authentication session.'
          ),
        });

        useScanStore.getState().resetForUser(null);
        return;
      }

      const user = data.session?.user ?? null;

      applyAuthenticatedUser(user);

      set({
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    })().finally(() => {
      bootstrapPromise = null;
    });

    return bootstrapPromise;
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({
        error:
          'Authentication is not configured. Add the required Supabase environment variables.',
      });

      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    const operationGeneration = ++authGeneration;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (operationGeneration !== authGeneration) {
      return false;
    }

    if (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Sign-in failed.'),
      });

      return false;
    }

    const user = data.user ?? data.session?.user ?? null;

    applyAuthenticatedUser(user);

    set({
      isLoading: false,
      isInitialized: true,
      error: null,
    });

    return user !== null;
  },

  signUp: async (email, password) => {
    if (!supabase) {
      const error =
        'Authentication is not configured. Add the required Supabase environment variables.';

      set({ error });

      return {
        success: false,
        requiresEmailConfirmation: false,
      };
    }

    set({
      isLoading: true,
      error: null,
    });

    const operationGeneration = ++authGeneration;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (operationGeneration !== authGeneration) {
      return {
        success: false,
        requiresEmailConfirmation: false,
      };
    }

    if (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Sign-up failed.'),
      });

      return {
        success: false,
        requiresEmailConfirmation: false,
      };
    }

    const user = data.user ?? null;
    const session = data.session ?? null;

    if (session?.user) {
      applyAuthenticatedUser(session.user);

      set({
        isLoading: false,
        isInitialized: true,
        error: null,
      });

      return {
        success: true,
        requiresEmailConfirmation: false,
      };
    }

    set({
      user: user && !session ? null : user,
      isLoading: false,
      isInitialized: true,
      error: null,
    });

    useScanStore.getState().resetForUser(null);

    return {
      success: true,
      requiresEmailConfirmation: true,
    };
  },

  signOut: async () => {
    if (!supabase) {
      authGeneration += 1;

      applyAuthenticatedUser(null);

      set({
        isLoading: false,
        isInitialized: true,
        error: null,
      });

      return true;
    }

    set({
      isLoading: true,
      error: null,
    });

    authGeneration += 1;

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Sign-out failed.'),
      });

      return false;
    }

    authGeneration += 1;

    applyAuthenticatedUser(null);

    set({
      isLoading: false,
      isInitialized: true,
      error: null,
    });

    return true;
  },

  requestPasswordReset: async (email) => {
    if (!supabase) {
      set({
        error:
          'Authentication is not configured. Add the required Supabase environment variables.',
      });

      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    );

    if (error) {
      set({
        isLoading: false,
        error: getErrorMessage(
          error,
          'Could not request a password reset.'
        ),
      });

      return false;
    }

    set({
      isLoading: false,
      error: null,
    });

    return true;
  },

  updatePassword: async (newPassword) => {
    if (!supabase) {
      set({
        error:
          'Authentication is not configured. Add the required Supabase environment variables.',
      });

      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Could not update your password.'),
      });

      return false;
    }

    applyAuthenticatedUser(data.user ?? get().user);

    set({
      isLoading: false,
      error: null,
    });

    return true;
  },

  clearError: () => {
    set({ error: null });
  },
}));
