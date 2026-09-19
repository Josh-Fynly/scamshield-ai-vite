import { supabase } from './supabaseClient';
import type {
  AnalysisDraft,
  AnalysisResult,
  PipelineStage,
  PipelineStageState,
  RiskLevel,
  ScanType,
  ThreatIndicator,
} from '../types';

const TABLE = 'analyses';
const SELECT_COLUMNS = 'id,user_id,scan_type,input_content,risk_score,risk_level,threat_indicators,ai_explanation,recommended_action,confidence_level,pipeline_stages,created_at';

interface AnalysisRow {
  id: unknown;
  user_id: unknown;
  scan_type: unknown;
  input_content: unknown;
  risk_score: unknown;
  risk_level: unknown;
  threat_indicators: unknown;
  ai_explanation: unknown;
  recommended_action: unknown;
  confidence_level: unknown;
  pipeline_stages: unknown;
  created_at: unknown;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PIPELINE_STATUSES = new Set<PipelineStageState['status']>(['pending', 'in_progress', 'completed', 'error']);

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function isScanType(value: unknown): value is ScanType {
  return value === 'text' || value === 'url' || value === 'image' || value === 'file';
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === 'safe' || value === 'suspicious' || value === 'high_risk';
}

function isThreatIndicator(value: unknown): value is ThreatIndicator {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === 'string'
    && typeof candidate.detected === 'boolean'
    && (candidate.severity === 'low' || candidate.severity === 'medium' || candidate.severity === 'high')
    && typeof candidate.description === 'string';
}

function isPipelineStages(value: unknown): value is Partial<Record<PipelineStage, PipelineStageState>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.entries(value as Record<string, unknown>).every(([stage, rawState]) => {
    if (typeof rawState !== 'object' || rawState === null || Array.isArray(rawState)) return false;
    if (!Object.values(PipelineStage).includes(stage as PipelineStage)) return false;
    const state = rawState as Record<string, unknown>;
    return PIPELINE_STATUSES.has(state.status as PipelineStageState['status'])
      && (state.durationMs === undefined || (typeof state.durationMs === 'number' && Number.isFinite(state.durationMs) && state.durationMs >= 0));
  });
}

function validateAnalysisRow(row: AnalysisRow): asserts row is {
  id: string;
  user_id: string;
  scan_type: ScanType;
  input_content: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  threat_indicators: ThreatIndicator[];
  ai_explanation: string | null;
  recommended_action: string | null;
  confidence_level: number | null;
  pipeline_stages: Partial<Record<PipelineStage, PipelineStageState>>;
  created_at: string;
} {
  if (!isUuid(row.id) || !isUuid(row.user_id)) throw new Error('Supabase returned an invalid analysis identity.');
  if (!isScanType(row.scan_type) || !isRiskLevel(row.risk_level)) throw new Error('Supabase returned invalid analysis enum data.');
  if (typeof row.input_content !== 'string' || typeof row.risk_score !== 'number' || !Number.isInteger(row.risk_score) || row.risk_score < 0 || row.risk_score > 100) throw new Error('Supabase returned invalid analysis core data.');
  if (row.ai_explanation !== null && typeof row.ai_explanation !== 'string') throw new Error('Supabase returned invalid analysis explanation.');
  if (row.recommended_action !== null && typeof row.recommended_action !== 'string') throw new Error('Supabase returned invalid recommended action.');
  if (row.confidence_level !== null && (typeof row.confidence_level !== 'number' || !Number.isFinite(row.confidence_level) || row.confidence_level < 0 || row.confidence_level > 1)) throw new Error('Supabase returned invalid analysis confidence.');
  if (!Array.isArray(row.threat_indicators) || !row.threat_indicators.every(isThreatIndicator)) throw new Error('Supabase returned malformed threat indicators.');
  if (!isPipelineStages(row.pipeline_stages) || typeof row.created_at !== 'string' || Number.isNaN(Date.parse(row.created_at))) throw new Error('Supabase returned malformed pipeline or timestamp data.');
}

function mapRowToAnalysis(row: AnalysisRow): AnalysisResult {
  validateAnalysisRow(row);
  return {
    id: row.id,
    userId: row.user_id,
    scanType: row.scan_type,
    inputContent: row.input_content,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    threatIndicators: row.threat_indicators,
    aiExplanation: row.ai_explanation ?? '',
    recommendedAction: row.recommended_action ?? '',
    confidenceLevel: row.confidence_level ?? 0,
    pipelineStages: row.pipeline_stages,
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function validateDraft(scan: AnalysisDraft): void {
  if (!isScanType(scan.scanType) || !isRiskLevel(scan.riskLevel) || typeof scan.inputContent !== 'string' || !Number.isInteger(scan.riskScore) || scan.riskScore < 0 || scan.riskScore > 100 || !Number.isFinite(scan.confidenceLevel) || scan.confidenceLevel < 0 || scan.confidenceLevel > 1 || !scan.threatIndicators.every(isThreatIndicator) || !isPipelineStages(scan.pipelineStages)) throw new Error('Analysis data is invalid and was not persisted.');
}

export async function fetchAnalysesFromSupabase(): Promise<AnalysisResult[]> {
  const client = requireSupabase();
  const { data, error } = await client.from(TABLE).select(SELECT_COLUMNS).order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as AnalysisRow[] | null) ?? []).map(mapRowToAnalysis);
}

export async function persistAnalysisToSupabase(scan: AnalysisDraft): Promise<AnalysisResult> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user.id || !isUuid(sessionData.session.user.id)) throw new Error('You must be authenticated before persisting an analysis.');
  validateDraft(scan);
  const { data, error } = await client.from(TABLE).insert({ scan_type: scan.scanType, input_content: scan.inputContent, risk_score: scan.riskScore, risk_level: scan.riskLevel, threat_indicators: scan.threatIndicators, ai_explanation: scan.aiExplanation, recommended_action: scan.recommendedAction, confidence_level: scan.confidenceLevel, pipeline_stages: scan.pipelineStages }).select(SELECT_COLUMNS).single();
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
