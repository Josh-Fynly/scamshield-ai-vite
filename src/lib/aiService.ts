/**
 * AI Analysis Service
 *
 * All AI provider calls run inside the `analyze-content` Supabase Edge
 * Function. Provider API keys are stored only as Supabase server-side
 * secrets and never enter the browser, localStorage, or the bundle.
 *
 * A failed, timed-out, malformed, or unconfigured analysis always throws.
 * No simulation or fabricated verdict is ever used.
 */

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import type {
  AiProvider,
  PipelineStage,
  RiskLevel,
  ScanType,
  ThreatIndicator,
} from '../types';
import {
  isSupabaseConfigured,
  invokeEdgeFunction,
} from './supabaseClient';

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

  constructor(
    message: string,
    code: string,
    status?: number,
  ) {
    super(message);
    this.name = 'AIAnalysisError';
    this.code = code;
    this.status = status;
  }

  toJSON(): AIAnalysisFailure {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
    };
  }
}

interface RawAnalysisResult {
  riskScore: unknown;
  riskLevel: unknown;
  threatIndicators: unknown;
  aiExplanation: unknown;
  recommendedAction: unknown;
  confidenceLevel: unknown;
  stageDurations: unknown;
}

interface AnalysisResponse {
  ok: unknown;
  result?: unknown;
  error?: unknown;
}

interface ParsedAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  threatIndicators: ThreatIndicator[];
  aiExplanation: string;
  recommendedAction: string;
  confidenceLevel: number;
  stageDurations: Partial<Record<PipelineStage, number>>;
}

const VALID_SCAN_TYPES = new Set<ScanType>([
  'text',
  'url',
  'image',
  'file',
]);

const VALID_PROVIDERS = new Set<AiProvider>([
  'openai',
  'gemini',
]);

const VALID_RISK_LEVELS = new Set<RiskLevel>([
  'safe',
  'suspicious',
  'high_risk',
]);

const VALID_PIPELINE_STAGES = new Set<PipelineStage>([
  'INGESTING',
  'PARSING',
  'NORMALISATION',
  'FEATURE_EXTRACTION',
  'AI_ANALYSIS',
  'RISK_ENGINE',
  'EXPLANATION_ENGINE',
  'RECOMMENDATION_ENGINE',
  'REPORT_GENERATION',
  'COMPLETE',
  'ERROR',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isThreatIndicator(value: unknown): value is ThreatIndicator {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === 'string' &&
    typeof value.detected === 'boolean' &&
    (
      value.severity === 'low' ||
      value.severity === 'medium' ||
      value.severity === 'high'
    ) &&
    typeof value.description === 'string'
  );
}

function parseThreatIndicators(
  value: unknown,
): ThreatIndicator[] {
  if (!Array.isArray(value)) {
    throw new AIAnalysisError(
      'The analysis service returned invalid threat indicators.',
      'MALFORMED_RESPONSE',
    );
  }

  if (!value.every(isThreatIndicator)) {
    throw new AIAnalysisError(
      'The analysis service returned malformed threat indicators.',
      'MALFORMED_RESPONSE',
    );
  }

  return value;
}

function parseRiskScore(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new AIAnalysisError(
      'The analysis service returned an invalid risk score.',
      'MALFORMED_RESPONSE',
    );
  }

  return value;
}

function parseRiskLevel(value: unknown): RiskLevel {
  if (
    typeof value !== 'string' ||
    !VALID_RISK_LEVELS.has(value as RiskLevel)
  ) {
    throw new AIAnalysisError(
      'The analysis service returned an invalid risk level.',
      'MALFORMED_RESPONSE',
    );
  }

  return value as RiskLevel;
}

function parseConfidenceLevel(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new AIAnalysisError(
      'The analysis service returned an invalid confidence level.',
      'MALFORMED_RESPONSE',
    );
  }

  return value;
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new AIAnalysisError(
      `The analysis service returned an invalid ${fieldName}.`,
      'MALFORMED_RESPONSE',
    );
  }

  return value;
}

function parseStageDurations(
  value: unknown,
): Partial<Record<PipelineStage, number>> {
  if (!isRecord(value)) {
    throw new AIAnalysisError(
      'The analysis service returned invalid pipeline timings.',
      'MALFORMED_RESPONSE',
    );
  }

  const durations: Partial<Record<PipelineStage, number>> = {};

  for (const [stage, duration] of Object.entries(value)) {
    if (!VALID_PIPELINE_STAGES.has(stage as PipelineStage)) {
      throw new AIAnalysisError(
        `The analysis service returned an unknown pipeline stage: ${stage}.`,
        'MALFORMED_RESPONSE',
      );
    }

    if (
      typeof duration !== 'number' ||
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      throw new AIAnalysisError(
        `The analysis service returned an invalid duration for ${stage}.`,
        'MALFORMED_RESPONSE',
      );
    }

    durations[stage as PipelineStage] = duration;
  }

  return durations;
}

function parseAnalysisResult(
  value: unknown,
): ParsedAnalysisResult {
  if (!isRecord(value)) {
    throw new AIAnalysisError(
      'The analysis service returned an invalid response.',
      'MALFORMED_RESPONSE',
    );
  }

  const raw = value as RawAnalysisResult;

  return {
    riskScore: parseRiskScore(raw.riskScore),
    riskLevel: parseRiskLevel(raw.riskLevel),
    threatIndicators: parseThreatIndicators(raw.threatIndicators),
    aiExplanation: parseRequiredString(
      raw.aiExplanation,
      'AI explanation',
    ),
    recommendedAction: parseRequiredString(
      raw.recommendedAction,
      'recommended action',
    ),
    confidenceLevel: parseConfidenceLevel(
      raw.confidenceLevel,
    ),
    stageDurations: parseStageDurations(
      raw.stageDurations,
    ),
  };
}

function parseErrorPayload(
  value: unknown,
): {
  code?: string;
  message?: string;
  status?: number;
} {
  if (!isRecord(value)) {
    return {};
  }

  const error = isRecord(value.error)
    ? value.error
    : value;

  return {
    code:
      typeof error.code === 'string'
        ? error.code
        : undefined,
    message:
      typeof error.message === 'string'
        ? error.message
        : undefined,
    status:
      typeof error.status === 'number'
        ? error.status
        : undefined,
  };
}

function validateRequest(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): void {
  if (typeof content !== 'string' || !content.trim()) {
    throw new AIAnalysisError(
      'Analysis content cannot be empty.',
      'INVALID_INPUT',
    );
  }

  if (!VALID_SCAN_TYPES.has(scanType)) {
    throw new AIAnalysisError(
      'Unsupported scan type.',
      'INVALID_SCAN_TYPE',
    );
  }

  if (!VALID_PROVIDERS.has(provider)) {
    throw new AIAnalysisError(
      'Unsupported AI provider.',
      'INVALID_PROVIDER',
    );
  }
}

async function invokeAnalysis(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): Promise<ParsedAnalysisResult> {
  validateRequest(content, scanType, provider);

  if (!isSupabaseConfigured) {
    throw new AIAnalysisError(
      'AI analysis isn’t available yet — Supabase isn’t configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Environment settings.',
      'SERVICE_NOT_CONFIGURED',
    );
  }

  let response: AnalysisResponse;

  try {
    const { data, error } =
      await invokeEdgeFunction<AnalysisResponse>(
        'analyze-content',
        {
          content,
          scanType,
          provider,
        },
      );

    if (error) {
      if (error instanceof FunctionsHttpError) {
        let payload: {
          code?: string;
          message?: string;
          status?: number;
        } = {};

        try {
          const json: unknown =
            await error.context.json();

          payload = parseErrorPayload(json);
        } catch {
          payload = {};
        }

        const status =
          typeof error.context?.status === 'number'
            ? error.context.status
            : payload.status;

        throw new AIAnalysisError(
          payload.message ??
            'The analysis service returned an error.',
          payload.code ??
            'ANALYSIS_SERVICE_ERROR',
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

    response = data;
  } catch (err) {
    if (err instanceof AIAnalysisError) {
      throw err;
    }

    throw new AIAnalysisError(
      'The analysis could not be completed. Please try again.',
      'UNKNOWN_ERROR',
    );
  }

  if (!isRecord(response)) {
    throw new AIAnalysisError(
      'The analysis service returned an invalid response.',
      'MALFORMED_RESPONSE',
    );
  }

  if (response.ok !== true) {
    const errorPayload = parseErrorPayload(
      response.error,
    );

    throw new AIAnalysisError(
      errorPayload.message ??
        'The analysis could not be completed.',
      errorPayload.code ??
        'UNKNOWN_ERROR',
      errorPayload.status,
    );
  }

  if (response.result === undefined) {
    throw new AIAnalysisError(
      'The analysis service returned no analysis result.',
      'MALFORMED_RESPONSE',
    );
  }

  return parseAnalysisResult(response.result);
}

/**
 * Returns the AI/risk data required by consumers that do not need the
 * frontend pipeline timing metadata.
 */
export async function analyseContent(
  content: string,
  scanType: ScanType,
  provider: AiProvider,
): Promise<AIAnalysisResult> {
  const result = await invokeAnalysis(
    content,
    scanType,
    provider,
  );

  return {
    riskScore: result.riskScore,
    threatIndicators: result.threatIndicators,
    aiExplanation: result.aiExplanation,
    recommendedAction: result.recommendedAction,
    confidenceLevel: result.confidenceLevel,
  };
}

/**
 * Returns the complete analysis-provider result used by the Scan Centre.
 *
 * Note that this result is still not a persisted AnalysisResult.
 * Persistence is handled separately through analysesApi.ts.
 */
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
  stageDurations: Partial<Record<PipelineStage, number>>;
}> {
  return invokeAnalysis(
    content,
    scanType,
    provider,
  );
}
