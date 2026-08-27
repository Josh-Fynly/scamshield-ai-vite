import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasValidSupabaseConfig =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 0;

/**
 * Indicates whether the browser has the public Supabase configuration
 * required to communicate with Supabase.
 *
 * This does NOT indicate that the user is authenticated or authorised.
 * Authentication and authorisation must be enforced by Supabase/RLS and
 * server-side Edge Functions.
 */
export const isSupabaseConfigured = hasValidSupabaseConfig;

/**
 * Public Supabase client.
 *
 * The browser may safely contain the Supabase publishable/anon key.
 * Privileged secrets such as AI provider API keys must NEVER be placed
 * in this client, localStorage, source code, or the Vite bundle.
 */
export const supabase: SupabaseClient | null = hasValidSupabaseConfig
  ? createClient(supabaseUrl!.trim(), supabaseAnonKey!.trim())
  : null;

type EdgeFunctionBody =
  | string
  | Record<string, unknown>
  | File
  | Blob
  | ArrayBuffer
  | FormData
  | ReadableStream<Uint8Array>
  | undefined;

/**
 * Invoke a Supabase Edge Function without allowing missing configuration
 * to crash the application during module evaluation.
 */
export async function invokeEdgeFunction<T>(
  name: string,
  body: EdgeFunctionBody,
): Promise<{ data: T | null; error: Error | null }> {
  if (!supabase) {
    return {
      data: null,
      error: new Error(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Environment settings.',
      ),
    };
  }

  return supabase.functions.invoke<T>(name, { body });
}
