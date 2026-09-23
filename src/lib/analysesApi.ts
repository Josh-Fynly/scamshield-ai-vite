/**
 * Analyses data-access layer.
 *
 * Browser access to this table relies on Supabase Row Level Security (RLS)
 * to restrict rows to the authenticated user.
 *
 * This module never accepts a caller-supplied user_id, never uses a
 * service-role key, and never treats locally-created analysis objects as
 * authoritative persisted records.
 */

import { supabase } from './supabaseClient';
import type {
  AnalysisDraft,
  AnalysisResult,
  PipelineStage,
  PipelineStages,
  PipelineStageState,
  ThreatIndicator,
} from '../types';

const TABLE = 'analyses';

interface AnalysisRow {
  id: string;
  user_id: string | null;
  scan_type: AnalysisResult['scanType'];
  input_content: string | null;
  risk_score: number;
  risk_level: AnalysisResult['riskLevel'];
  threat_indicators: unknown;
  ai_explanation: string | null;
  recommended_action: string | null;
  confidence_level: number | null;
  pipeline_stages: unknown;
  created_at: string;
}

const PIPELINE_STAGE_VALUES = new Set<PipelineStage>([
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

const SCAN_TYPE_VALUES = new Set<AnalysisResult['scanType']>([
  'text',
  'url',
  'image',
  'file',
]);

const RISK_LEVEL_VALUES = new Set<AnalysisResult['riskLevel']>([
  'safe',
  'suspicious',
  'high_risk',
]);

const PIPELINE_STATUS_VALUES = new Set<
  PipelineStageState['status']
>([
  'pending',
  'in_progress',
  'completed',
  'error',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isThreatIndicator(value: unknown): value is ThreatIndicator {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === 'string' &&
    typeof value.detected === 'boolean' &&
    (value.severity === 'low' ||
      value.severity === 'medium' ||
      value.severity === 'high') &&
    typeof value.description === 'string'
  );
}

function parseThreatIndicators(value: unknown): ThreatIndicator[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'Persisted analysis contains an invalid threat-indicator collection.',
    );
  }

  if (!value.every(isThreatIndicator)) {
    throw new Error(
      'Persisted analysis contains a malformed threat indicator.',
    );
  }

  return value;
}

function isPipelineStageState(
  value: unknown,
): value is PipelineStageState {
  if (!isRecord(value)) {
    return false;
  }

  if (!PIPELINE_STATUS_VALUES.has(
    value.status as PipelineStageState['status'],
  )) {
    return false;
  }

  if (
    value.durationMs !== undefined &&
    (
      typeof value.durationMs !== 'number' ||
      !Number.isFinite(value.durationMs) ||
      value.durationMs < 0
    )
  ) {
    return false;
  }

  return true;
}

function parsePipelineStages(value: unknown): PipelineStages {
  if (!isRecord(value)) {
    throw new Error(
      'Persisted analysis contains an invalid pipeline-stage object.',
    );
  }

  const parsed: PipelineStages = {};

  for (const [stage, stageState] of Object.entries(value)) {
    if (!PIPELINE_STAGE_VALUES.has(stage as PipelineStage)) {
      throw new Error(
        `Persisted analysis contains an unknown pipeline stage: ${stage}.`,
      );
    }

    if (!isPipelineStageState(stageState)) {
      throw new Error(
        `Persisted analysis contains invalid state for pipeline stage: ${stage}.`,
      );
    }

    parsed[stage as PipelineStage] = stageState;
  }

  return parsed;
}

function parseScanType(value: unknown): AnalysisResult['scanType'] {
  if (
    typeof value !== 'string' ||
    !SCAN_TYPE_VALUES.has(value as AnalysisResult['scanType'])
  ) {
    throw new Error('Persisted analysis contains an invalid scan type.');
  }

  return value as AnalysisResult['scanType'];
}

function parseRiskLevel(value: unknown): AnalysisResult['riskLevel'] {
  if (
    typeof value !== 'string' ||
    !RISK_LEVEL_VALUES.has(value as AnalysisResult['riskLevel'])
  ) {
    throw new Error('Persisted analysis contains an invalid risk level.');
  }

  return value as AnalysisResult['riskLevel'];
}

function parseRiskScore(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error('Persisted analysis contains an invalid risk score.');
  }

  return value;
}

function parseConfidenceLevel(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      'Persisted analysis contains an invalid confidence level.',
    );
  }

  return value;
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(
      `Persisted analysis contains an invalid ${fieldName}.`,
    );
  }

  return value;
}

function mapRowToAnalysis(row: AnalysisRow): AnalysisResult {
  if (!isValidUuid(row.id)) {
    throw new Error('Persisted analysis contains an invalid ID.');
  }

  if (!isValidUuid(row.user_id)) {
    throw new Error(
      'Persisted analysis is missing valid ownership information.',
    );
  }

  const scanType = parseScanType(row.scan_type);
  const riskLevel = parseRiskLevel(row.risk_level);
  const riskScore = parseRiskScore(row.risk_score);
  const threatIndicators = parseThreatIndicators(row.threat_indicators);
  const pipelineStages = parsePipelineStages(
    row.pipeline_stages ?? {},
  );

  if (typeof row.created_at !== 'string' || !row.created_at) {
    throw new Error(
      'Persisted analysis contains an invalid creation timestamp.',
    );
  }

  if (row.confidence_level === null) {
    throw new Error(
      'Persisted analysis is missing confidence information.',
    );
  }

  const confidenceLevel = parseConfidenceLevel(row.confidence_level);

  if (
    row.input_content !== null &&
    typeof row.input_content !== 'string'
  ) {
    throw new Error(
      'Persisted analysis contains invalid input content.',
    );
  }

  if (
    row.ai_explanation !== null &&
    typeof row.ai_explanation !== 'string'
  ) {
    throw new Error(
      'Persisted analysis contains an invalid AI explanation.',
    );
  }

  if (
    row.recommended_action !== null &&
    typeof row.recommended_action !== 'string'
  ) {
    throw new Error(
      'Persisted analysis contains an invalid recommended action.',
    );
  }

  return {
    id: row.id,
    userId: row.user_id,
    scanType,
    inputContent: row.input_content ?? '',
    riskScore,
    riskLevel,
    threatIndicators,
    aiExplanation: row.ai_explanation ?? '',
    recommendedAction: row.recommended_action ?? '',
    confidenceLevel,
    pipelineStages,
    createdAt: row.created_at,
  };
}

async function requireAuthenticatedUser(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error(
      'You must be authenticated to access analysis data.',
    );
  }

  if (!isValidUuid(userId)) {
    throw new Error('The authenticated user ID is invalid.');
  }

  return userId;
}

/**
 * Validate an analysis draft before sending it to the persistence layer.
 *
 * This validates the client-side contract but deliberately does not accept
 * or validate id, userId, or createdAt because those values are owned by
 * the persistence boundary.
 */
function validateAnalysisDraft(draft: AnalysisDraft): void {
  if (!isRecord(draft)) {
    throw new Error('Invalid analysis draft.');
  }

  if (!SCAN_TYPE_VALUES.has(draft.scanType)) {
    throw new Error('Invalid analysis scan type.');
  }

  if (
    typeof draft.inputContent !== 'string' ||
    !draft.inputContent.trim()
  ) {
    throw new Error('Analysis input cannot be empty.');
  }

  if (
    !Number.isInteger(draft.riskScore) ||
    draft.riskScore < 0 ||
    draft.riskScore > 100
  ) {
    throw new Error('Analysis risk score must be between 0 and 100.');
  }

  if (!RISK_LEVEL_VALUES.has(draft.riskLevel)) {
    throw new Error('Invalid analysis risk level.');
  }

  if (
    typeof draft.confidenceLevel !== 'number' ||
    !Number.isFinite(draft.confidenceLevel) ||
    draft.confidenceLevel < 0 ||
    draft.confidenceLevel > 1
  ) {
    throw new Error(
      'Analysis confidence must be between 0 and 1.',
    );
  }

  if (!Array.isArray(draft.threatIndicators)) {
    throw new Error('Analysis threat indicators must be an array.');
  }

  if (!draft.threatIndicators.every(isThreatIndicator)) {
    throw new Error('Analysis contains an invalid threat indicator.');
  }

  if (typeof draft.aiExplanation !== 'string') {
    throw new Error('Analysis explanation must be a string.');
  }

  if (typeof draft.recommendedAction !== 'string') {
    throw new Error('Analysis recommendation must be a string.');
  }

  parsePipelineStages(draft.pipelineStages);
}

/**
 * Fetch analyses visible to the current authenticated Supabase session.
 *
 * RLS remains the authoritative database-level ownership boundary.
 */
export async function fetchAnalysesFromSupabase(): Promise<
  AnalysisResult[]
> {
  await requireAuthenticatedUser();

  const { data, error } = await supabase!
    .from(TABLE)
    .select(
      'id,user_id,scan_type,input_content,risk_score,risk_level,threat_indicators,ai_explanation,recommended_action,confidence_level,pipeline_stages,created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data as AnalysisRow[] | null) ?? [];

  return rows.map(mapRowToAnalysis);
}

/**
 * Persist a completed analysis.
 *
 * The caller submits an AnalysisDraft only. The database owns:
 * - id
 * - user_id
 * - created_at
 *
 * The function returns the authoritative row created by the database.
 */
export async function persistAnalysisToSupabase(
  draft: AnalysisDraft,
): Promise<AnalysisResult> {
  validateAnalysisDraft(draft);

  await requireAuthenticatedUser();

  const { data, error } = await supabase!
    .from(TABLE)
    .insert({
      scan_type: draft.scanType,
      input_content: draft.inputContent,
      risk_score: draft.riskScore,
      risk_level: draft.riskLevel,
      threat_indicators: draft.threatIndicators,
      ai_explanation: draft.aiExplanation,
      recommended_action: draft.recommendedAction,
      confidence_level: draft.confidenceLevel,
      pipeline_stages: draft.pipelineStages,
    })
    .select(
      'id,user_id,scan_type,input_content,risk_score,risk_level,threat_indicators,ai_explanation,recommended_action,confidence_level,pipeline_stages,created_at',
    )
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      'Analysis was accepted but no persisted record was returned.',
    );
  }

  return mapRowToAnalysis(data as AnalysisRow);
}

/**
 * Clear analyses belonging to the current authenticated user.
 *
 * RLS remains the database-level authorization boundary, while the explicit
 * user filter prevents this client from issuing an accidental table-wide
 * destructive request.
 */
export async function clearAnalysesInSupabase(): Promise<void> {
  const userId = await requireAuthenticatedUser();

  const { error } = await supabase!
    .from(TABLE)
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
