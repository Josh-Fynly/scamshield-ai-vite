/**
 * AI Analysis Service
 *
 * All AI provider calls run inside the `analyze-content` Supabase Edge Function.
 * Provider API keys are stored ONLY as Supabase server-side secrets and never
 * enter the browser, localStorage, or the bundle.
 *
 * A failed, timed-out, malformed, or unconfigured analysis ALWAYS throws an
 * error — no simulation or fabricated verdict is ever used.
 */

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import type { AiProvider, RiskLevel, ScanType, ThreatIndicator } from '../types';
import { isSupabaseConfigured, invokeEdgeFunction } from './supabaseClient';

export interface AIAnalysisResult {
  riskScore: number;
  threatIndicators: ThreatIndicator[];
  aiExplanation: string;
  recommendedAction: string;
  confidenceLevel: number;
}

export interface AIAnalysisFailure {
  code: string;
  message: string;
  status?: number;
}

export class AIAnalysisError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'AIAnalysisError';
    this.code = code;
    this.status = status;
  }

  toJSON(): AIAnalysisFailure {
    return { code: this.code, message: this.message, status: this.status };
  }
}

interface AnalysisResponse {
  ok: boolean;
  result?: {
    riskScore: number;
    riskLevel: RiskLevel;
    threatIndicators: ThreatIndicator[];
    aiExplanation: string;
    recommendedAction: string;
    confidenceLevel: number;
    stageDurations: Record<string, number>;
  };
  error?: {
    code?: string;
    message?: string;
    status?: number;
  };
}

async function invokeAnalysis(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): Promise<NonNullable<AnalysisResponse['result']>> {
  let response: AnalysisResponse;

  try {
    if (!isSupabaseConfigured) {
      throw new AIAnalysisError(
        'AI analysis isn’t available yet — Supabase isn’t configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Environment settings.',
        'SERVICE_NOT_CONFIGURED',
      );
    }

    const { data, error } = await invokeEdgeFunction<AnalysisResponse>('analyze-content', {
      content,
      scanType,
      provider,
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        let payload: { error?: { code?: string; message?: string } } | null = null;
        try {
          const json: unknown = await error.context.json();
          if (typeof json === 'object' && json !== null) {
            payload = json as { error?: { code?: string; message?: string } };
          }
        } catch {
          payload = null;
        }
        const status: number | undefined =
          typeof error.context?.status === 'number' ? error.context.status : undefined;
        throw new AIAnalysisError(
          payload?.error?.message ?? 'The analysis service returned an error.',
          payload?.error?.code ?? 'ANALYSIS_SERVICE_ERROR',
          status,
        );
      }
      if (error instanceof FunctionsRelayError) {
        throw new AIAnalysisError(
          'The analysis service is temporarily unavailable. Please try again.',
          'RELAY_ERROR',
        );
      }
      if (error instanceof FunctionsFetchError) {
        throw new AIAnalysisError(
          'Could not reach the analysis service. Please check your connection and try again.',
          'FETCH_ERROR',
        );
      }
      throw new AIAnalysisError(
        'The analysis could not be completed. Please try again.',
        'UNKNOWN_ERROR',
      );
    }

    response = data as AnalysisResponse;
  } catch (err) {
    if (err instanceof AIAnalysisError) throw err;
    throw new AIAnalysisError(
      'The analysis could not be completed. Please try again.',
      'UNKNOWN_ERROR',
    );
  }

  if (!response?.ok || !response.result) {
    throw new AIAnalysisError(
      response?.error?.message ?? 'The analysis could not be completed.',
      response?.error?.code ?? 'UNKNOWN_ERROR',
      response?.error?.status,
    );
  }

  return response.result;
}

export async function analyseContent(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): Promise<AIAnalysisResult> {
  const result = await invokeAnalysis(content, scanType, provider);
  return {
    riskScore: result.riskScore,
    threatIndicators: result.threatIndicators,
    aiExplanation: result.aiExplanation,
    recommendedAction: result.recommendedAction,
    confidenceLevel: result.confidenceLevel,
  };
}

export async function runAIAnalysis(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): Promise<{
  riskScore: number;
  riskLevel: RiskLevel;
  threatIndicators: ThreatIndicator[];
  aiExplanation: string;
  recommendedAction: string;
  confidenceLevel: number;
  stageDurations: Record<string, number>;
}> {
  const result = await invokeAnalysis(content, scanType, provider);
  return {
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    threatIndicators: result.threatIndicators,
    aiExplanation: result.aiExplanation,
    recommendedAction: result.recommendedAction,
    confidenceLevel: result.confidenceLevel,
    stageDurations: result.stageDurations,
  };
      }

