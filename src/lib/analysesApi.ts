/**
 * Analyses data-access layer.
 *
 * Browser access to this table is only safe when Supabase Row Level
 * Security (RLS) policies correctly restrict rows to the authorised user.
 *
 * This module deliberately does not bypass RLS and never uses a service-role
 * key. Privileged database operations belong on trusted server-side code.
 */

import { supabase } from './supabaseClient';
import type { AnalysisResult, ThreatIndicator } from '../types';

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

function isThreatIndicator(value: unknown): value is ThreatIndicator {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === 'string' &&
    typeof candidate.detected === 'boolean' &&
    (candidate.severity === 'low' ||
      candidate.severity === 'medium' ||
      candidate.severity === 'high') &&
    typeof candidate.description === 'string'
  );
}

function parseThreatIndicators(value: unknown): ThreatIndicator[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isThreatIndicator);
}

function mapRowToAnalysis(row: AnalysisRow): AnalysisResult {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    scanType: row.scan_type,
    inputContent: row.input_content ?? '',
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    threatIndicators: parseThreatIndicators(row.threat_indicators),
    aiExplanation: row.ai_explanation ?? '',
    recommendedAction: row.recommended_action ?? '',
    confidenceLevel:
      typeof row.confidence_level === 'number'
        ? row.confidence_level
        : 0,
    pipelineStages:
      (row.pipeline_stages ?? {}) as AnalysisResult['pipelineStages'],
    createdAt: row.created_at,
  };
}

/**
 * Fetch analyses visible to the current Supabase session.
 *
 * RLS is responsible for determining which rows the current client may read.
 */
export async function fetchAnalysesFromSupabase(): Promise<AnalysisResult[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id,user_id,scan_type,input_content,risk_score,risk_level,threat_indicators,ai_explanation,recommended_action,confidence_level,pipeline_stages,created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as AnalysisRow[] | null) ?? []).map(mapRowToAnalysis);
}

/**
 * Persist a completed analysis.
 *
 * The database/RLS layer must determine the authorised user identity.
 * No service-role credentials are used from the browser.
 */
export async function persistAnalysisToSupabase(
  scan: AnalysisResult,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from(TABLE).insert({
    scan_type: scan.scanType,
    input_content: scan.inputContent,
    risk_score: scan.riskScore,
    risk_level: scan.riskLevel,
    threat_indicators: scan.threatIndicators,
    ai_explanation: scan.aiExplanation,
    recommended_action: scan.recommendedAction,
    confidence_level: scan.confidenceLevel,
    pipeline_stages: scan.pipelineStages,
  });

  if (error) {
    throw error;
  }
}

/**
 * Clear analyses for the current authorised scope.
 *
 * This operation relies entirely on RLS.
 *
 * There is intentionally no "delete everything except a sentinel UUID"
 * condition. A client must never receive a query that accidentally becomes
 * an unrestricted table-wide destructive operation.
 */
export async function clearAnalysesInSupabase(): Promise<void> {
  if (!supabase) {
    return;
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;

  if (!userId) {
    throw new Error(
      'You must be authenticated before clearing analysis history.',
    );
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
    }
