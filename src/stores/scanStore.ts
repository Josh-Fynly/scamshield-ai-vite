import { create } from 'zustand';
import type {
  AnalysisDraft,
  AnalysisResult,
  PipelineStage,
  RiskLevel,
  ScanType,
} from '../types';
import {
  clearAnalysesInSupabase,
  fetchAnalysesFromSupabase,
  persistAnalysisToSupabase,
} from '../lib/analysesApi';

/**
 * Hydrate analyses from Supabase once for the current store lifecycle.
 *
 * This is an optimization only. Supabase remains the authoritative source
 * of persisted analysis data.
 */
let hasLoaded = false;

interface ScanState {
  scans: AnalysisResult[];
  isLoading: boolean;
  loadError: string | null;
  isScanning: boolean;
  currentScanId: string | null;
  currentPipelineStage: PipelineStage | null;
  pipelineProgress: number;

  loadScans: () => Promise<void>;
  saveScan: (draft: AnalysisDraft) => Promise<AnalysisResult>;
  setScanning: (scanning: boolean) => void;
  setCurrentScanId: (id: string | null) => void;
  setCurrentPipelineStage: (stage: PipelineStage | null) => void;
  setPipelineProgress: (progress: number) => void;
  getScanById: (id: string) => AnalysisResult | undefined;
  getScansByType: (type: ScanType) => AnalysisResult[];
  getScansByRiskLevel: (level: RiskLevel) => AnalysisResult[];
  clearHistory: () => Promise<void>;
}

export const useScanStore = create<ScanState>((set, get) => ({
  scans: [],
  isLoading: false,
  loadError: null,
  isScanning: false,
  currentScanId: null,
  currentPipelineStage: null,
  pipelineProgress: 0,

  loadScans: async () => {
    if (hasLoaded) {
      return;
    }

    set({
      isLoading: true,
      loadError: null,
    });

    try {
      const data = await fetchAnalysesFromSupabase();

      hasLoaded = true;

      set({
        scans: data,
        isLoading: false,
        loadError: null,
      });
    } catch (err) {
      set({
        scans: [],
        loadError:
          err instanceof Error
            ? err.message
            : 'Could not load your analyses.',
        isLoading: false,
      });
    }
  },

  saveScan: async (draft) => {
    const persistedScan = await persistAnalysisToSupabase(draft);

    set((state) => ({
      scans: [
        persistedScan,
        ...state.scans.filter((scan) => scan.id !== persistedScan.id),
      ],
      loadError: null,
    }));

    return persistedScan;
  },

  setScanning: (scanning) =>
    set({
      isScanning: scanning,
    }),

  setCurrentScanId: (id) =>
    set({
      currentScanId: id,
    }),

  setCurrentPipelineStage: (stage) =>
    set({
      currentPipelineStage: stage,
    }),

  setPipelineProgress: (progress) =>
    set({
      pipelineProgress: progress,
    }),

  getScanById: (id) =>
    get().scans.find((scan) => scan.id === id),

  getScansByType: (type) =>
    get().scans.filter((scan) => scan.scanType === type),

  getScansByRiskLevel: (level) =>
    get().scans.filter((scan) => scan.riskLevel === level),

  clearHistory: async () => {
    await clearAnalysesInSupabase();

    hasLoaded = false;

    set({
      scans: [],
      loadError: null,
    });
  },
}));
