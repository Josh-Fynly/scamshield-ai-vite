import { invokeEdgeFunction } from './supabaseClient';

export interface AnalysisStatus {
  openai: boolean;
  gemini: boolean;
}

interface AnalysisStatusResponse {
  ok?: unknown;
  result?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
  };
}

function isAnalysisStatus(value: unknown): value is AnalysisStatus {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.openai === 'boolean' &&
    typeof candidate.gemini === 'boolean'
  );
}

/**
 * Queries the analysis-status Edge Function.
 *
 * The Edge Function returns only provider availability booleans.
 * Provider API keys themselves never leave the server.
 */
export async function fetchAnalysisStatus(): Promise<AnalysisStatus> {
  const { data, error } = await invokeEdgeFunction<AnalysisStatusResponse>(
    'analysis-status',
    {},
  );

  if (error) {
    throw new Error(
      'Could not retrieve AI provider configuration status.',
    );
  }

  if (!data || data.ok !== true) {
    const message =
      typeof data?.error?.message === 'string'
        ? data.error.message
        : 'Could not retrieve AI provider configuration status.';

    throw new Error(message);
  }

  if (!isAnalysisStatus(data.result)) {
    throw new Error(
      'The analysis-status service returned an invalid response.',
    );
  }

  return data.result;
}
