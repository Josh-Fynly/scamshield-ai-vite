import { supabase } from './supabaseClient';
import type {
  AnalysisResult,
  PipelineStage,
  RiskLevel,
  ScanType,
  ThreatIndicator,
} from '../types';

const TABLE = 'analyses';

interface AnalysisRow {
  id: string;
  user_id: string;
  scan_type: ScanType;
  input_content: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  threat_indicators: unknown;
  ai_explanation: string | null;
  recommended_action: string | null;
  confidence_level: number | null;
  pipeline_stages: unknown;
  created_at: string;
}

function isThreatIndicator(value: unknown): value is ThreatIndicator {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === 'string'
    && typeof candidate.detected === 'boolean'
    && (candidate.severity === 'low' || candidate.severity === 'medium' || candidate.severity === 'high')
    && typeof candidate.description === 'string';
}

function isPipelineStages(value: unknown): value is AnalysisResult['pipelineStages'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((stage) => {
    if (typeof stage !== 'object' || stage === null) return false;
    const status = (stage as Record<string, unknown>).status;
    return status === 'pending' || status === 'in_progress' || status === 'completed' || status === 'error';
  });
}

function mapRowToAnalysis(row: AnalysisRow): AnalysisResult {
  if (!row.user_id || !Array.isArray(row.threat_indicators) || !isPipelineStages(row.pipeline_stages)) {
    throw new Error('Supabase returned an invalid analysis record.');
  }
  const indicators = row.threat_indicators.filter(isThreatIndicator);
  if (indicators.length !== row.threat_indicators.length) {
    throw new Error('Supabase returned malformed threat indicators.');
  }
  return {
    id: row.id,
    userId: row.user_id,
    scanType: row.scan_type,
    inputContent: row.input_content ?? '',
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    threatIndicators: indicators,
    aiExplanation: row.ai_explanation ?? '',
    recommendedAction: row.recommended_action ?? '',
    confidenceLevel: row.confidence_level ?? 0,
    pipelineStages: row.pipeline_stages,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = 'id,user_id,scan_type,input_content,risk_score,risk_level,threat_indicators,ai_explanation,recommended_action,confidence_level,pipeline_stages,created_at';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function fetchAnalysesFromSupabase(): Promise<AnalysisResult[]> {
  const client = requireSupabase();
  const { data, error } = await client.from(TABLE).select(SELECT_COLUMNS).order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as AnalysisRow[] | null) ?? []).map(mapRowToAnalysis);
}

export async function persistAnalysisToSupabase(scan: AnalysisResult): Promise<AnalysisResult> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert({
      scan_type: scan.scanType,
      input_content: scan.inputContent,
      risk_score: scan.riskScore,
      risk_level: scan.riskLevel,
      threat_indicators: scan.threatIndicators,
      ai_explanation: scan.aiExplanation,
      recommended_action: scan.recommendedAction,
      confidence_level: scan.confidenceLevel,
      pipeline_stages: scan.pipelineStages,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  if (!data) throw new Error('Supabase did not return the persisted analysis.');
  return mapRowToAnalysis(data as AnalysisRow);
}

export async function clearAnalysesInSupabase(): Promise<void> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user.id) throw new Error('You must be authenticated before clearing analysis history.');
  const { error } = await client.from(TABLE).delete().eq('user_id', sessionData.session.user.id);
  if (error) throw error;
}
