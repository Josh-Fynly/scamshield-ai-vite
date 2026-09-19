import { create } from 'zustand';
import type { AnalysisDraft, AnalysisResult, PipelineStage, ScanType } from '../types';
import { clearAnalysesInSupabase, fetchAnalysesFromSupabase, persistAnalysisToSupabase } from '../lib/analysesApi';

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
  saveScan: (scan: AnalysisDraft) => Promise<AnalysisResult>;
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
  scans: [], isLoading: false, loadError: null, isScanning: false, currentScanId: null, currentPipelineStage: null, pipelineProgress: 0,
  loadScans: async () => {
    if (hasLoaded) return;
    set({ isLoading: true, loadError: null });
    try {
      const data = await fetchAnalysesFromSupabase();
      hasLoaded = true; set({ scans: data, isLoading: false });
    } catch (err) {
      set({ scans: [], loadError: err instanceof Error ? err.message : 'Could not load your analyses.', isLoading: false });
    }
  },
  saveScan: async (scan) => {
    const persisted = await persistAnalysisToSupabase(scan);
    set((state) => ({ scans: [persisted, ...state.scans] }));
    return persisted;
  },
  setScanning: (scanning) => set({ isScanning: scanning }),
  setCurrentScanId: (id) => set({ currentScanId: id }),
  setCurrentPipelineStage: (stage) => set({ currentPipelineStage: stage }),
  setPipelineProgress: (progress) => set({ pipelineProgress: progress }),
  getScanById: (id) => get().scans.find((scan) => scan.id === id),
  getScansByType: (type) => get().scans.filter((scan) => scan.scanType === type),
  getScansByRiskLevel: (level) => get().scans.filter((scan) => scan.riskLevel === level),
  clearHistory: async () => {
    await clearAnalysesInSupabase();
    set({ scans: [] }); hasLoaded = false;
  },
}));
