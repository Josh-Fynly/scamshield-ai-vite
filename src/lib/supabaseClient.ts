import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof rawSupabaseUrl === 'string'
    ? rawSupabaseUrl.trim()
    : '';

const supabaseAnonKey =
  typeof rawSupabaseAnonKey === 'string'
    ? rawSupabaseAnonKey.trim()
    : '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0;

export const supabase: SupabaseClient | null =
  isSupabaseConfigured
    ? createClient(
        supabaseUrl,
        supabaseAnonKey,
      )
    : null;

export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<{
  data: T | null;
  error: Error | null;
}> {
  if (!supabase) {
    return {
      data: null,
      error: new Error(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Environment settings.',
      ),
    };
  }

  if (!name.trim()) {
    return {
      data: null,
      error: new Error(
        'An Edge Function name is required.',
      ),
    };
  }

  const { data, error } =
    await supabase.functions.invoke<T>(
      name,
      {
        body,
      },
    );

  return {
    data,
    error,
  };
}
