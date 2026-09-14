import { create } from 'zustand';
import type { AnalysisResult, PipelineStage, ScanType } from '../types';
import { SAMPLE_SCANS } from '../lib/constants';
import {
  clearAnalysesInSupabase,
  fetchAnalysesFromSupabase,
  persistAnalysisToSupabase,
} from '../lib/analysesApi';

/** Local sample data used when Supabase isn't configured or can't be reached. */
const FALLBACK_SCANS = [...SAMPLE_SCANS] as unknown as AnalysisResult[];

// Hydrate from Supabase once per session. Locally-created scans are persisted,
// so a second fetch on a later page mount isn't needed. Reset on clearHistory.
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
  saveScan: (scan: AnalysisResult) => Promise<boolean>;
  addScan: (scan: AnalysisResult) => void;
  setScanning: (scanning: boolean) => void;
  setCurrentScanId: (id: string | null) => void;
  setCurrentPipelineStage: (stage: PipelineStage | null) => void;
  setPipelineProgress: (progress: number) => void;
  getScanById: (id: string) => AnalysisResult | undefined;
  getScansByType: (type: ScanType) => AnalysisResult[];
  getScansByRiskLevel: (level: string) => AnalysisResult[];
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
    if (hasLoaded) return;
    set({ isLoading: true, loadError: null });
    try {
      const data = await fetchAnalysesFromSupabase();
      hasLoaded = true;
      set({ scans: data, isLoading: false });
    } catch (err) {
      // Graceful fallback: show sample data locally instead of a blank page.
      // hasLoaded stays false so a later retry can succeed.
      set({
        scans: FALLBACK_SCANS,
        loadError: err instanceof Error ? err.message : 'Could not load your analyses.',
        isLoading: false,
      });
    }
  },

  saveScan: async (scan) => {
    // Add locally first so the UI updates instantly, then persist to the cloud.
    set((state) => ({ scans: [scan, ...state.scans] }));
    try {
      await persistAnalysisToSupabase(scan);
      return true;
    } catch (err) {
      console.warn('[scanStore] Failed to persist analysis to Supabase:', err);
      return false;
    }
  },

  addScan: (scan) =>
    set((state) => ({ scans: [scan, ...state.scans] })),

  setScanning: (scanning) => set({ isScanning: scanning }),

  setCurrentScanId: (id) => set({ currentScanId: id }),

  setCurrentPipelineStage: (stage) => set({ currentPipelineStage: stage }),

  setPipelineProgress: (progress) => set({ pipelineProgress: progress }),

  getScanById: (id) => get().scans.find((s) => s.id === id),

  getScansByType: (type) => get().scans.filter((s) => s.scanType === type),

  getScansByRiskLevel: (level) => get().scans.filter((s) => s.riskLevel === level),

  clearHistory: async () => {
    set({ scans: [] });
    hasLoaded = false;
    try {
      await clearAnalysesInSupabase();
    } catch (err) {
      console.warn('[scanStore] Failed to clear analyses on Supabase:', err);
    }
  },
}));
    
