export const PipelineStage = {
  INGESTING: 'INGESTING',
  PARSING: 'PARSING',
  NORMALISATION: 'NORMALISATION',
  FEATURE_EXTRACTION: 'FEATURE_EXTRACTION',
  AI_ANALYSIS: 'AI_ANALYSIS',
  RISK_ENGINE: 'RISK_ENGINE',
  EXPLANATION_ENGINE: 'EXPLANATION_ENGINE',
  RECOMMENDATION_ENGINE: 'RECOMMENDATION_ENGINE',
  REPORT_GENERATION: 'REPORT_GENERATION',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
} as const;

export type PipelineStage =
  (typeof PipelineStage)[keyof typeof PipelineStage];

export const PIPELINE_STAGES_ORDER: PipelineStage[] = [
  PipelineStage.INGESTING,
  PipelineStage.PARSING,
  PipelineStage.NORMALISATION,
  PipelineStage.FEATURE_EXTRACTION,
  PipelineStage.AI_ANALYSIS,
  PipelineStage.RISK_ENGINE,
  PipelineStage.EXPLANATION_ENGINE,
  PipelineStage.RECOMMENDATION_ENGINE,
  PipelineStage.REPORT_GENERATION,
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.INGESTING]: 'Ingesting',
  [PipelineStage.PARSING]: 'Parsing',
  [PipelineStage.NORMALISATION]: 'Normalisation',
  [PipelineStage.FEATURE_EXTRACTION]: 'Feature Extraction',
  [PipelineStage.AI_ANALYSIS]: 'AI Analysis',
  [PipelineStage.RISK_ENGINE]: 'Risk Engine',
  [PipelineStage.EXPLANATION_ENGINE]: 'Explanation Engine',
  [PipelineStage.RECOMMENDATION_ENGINE]: 'Recommendation Engine',
  [PipelineStage.REPORT_GENERATION]: 'Report Generation',
  [PipelineStage.COMPLETE]: 'Complete',
  [PipelineStage.ERROR]: 'Error',
};

export type ScanType = 'text' | 'url' | 'image' | 'file';

export type RiskLevel = 'safe' | 'suspicious' | 'high_risk';

export type PipelineStageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'error';

export interface PipelineStageState {
  status: PipelineStageStatus;
  durationMs?: number;
}

export type PipelineStages = Partial<
  Record<PipelineStage, PipelineStageState>
>;

export interface ThreatIndicator {
  name: string;
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AnalysisDraft {
  scanType: ScanType;
  inputContent: string;
  riskScore: number;
  riskLevel: RiskLevel;
  threatIndicators: ThreatIndicator[];
  aiExplanation: string;
  recommendedAction: string;
  confidenceLevel: number;
  pipelineStages: PipelineStages;
}

export interface AnalysisResult extends AnalysisDraft {
  id: string;
  createdAt: string;
  userId: string;
}

export interface AnalysisSummary {
  totalScans: number;
  safeScans: number;
  suspiciousScans: number;
  highRiskScans: number;
  averageRiskScore: number;
  averageConfidence: number;
}

export type AiProvider = 'openai' | 'gemini';

export interface Settings {
  aiProvider: AiProvider;
  theme: 'dark';
  notifications: {
    emailAlerts: boolean;
    pushNotifications: boolean;
    weeklyReport: boolean;
    criticalThreatsOnly: boolean;
  };
  security: {
    autoBlockHighRisk: boolean;
    requireConfirmation: boolean;
    logAllAnalyses: boolean;
    ipWhitelist: string[];
  };
}

export const DEFAULT_SETTINGS: Settings = {
  aiProvider: 'openai',
  theme: 'dark',
  notifications: {
    emailAlerts: true,
    pushNotifications: false,
    weeklyReport: true,
    criticalThreatsOnly: false,
  },
  security: {
    autoBlockHighRisk: false,
    requireConfirmation: true,
    logAllAnalyses: true,
    ipWhitelist: [],
  },
};
