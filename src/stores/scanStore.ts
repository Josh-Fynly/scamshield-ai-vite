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

interface ScanState {
  scans: AnalysisResult[];
  isLoading: boolean;
  loadError: string | null;
  isScanning: boolean;
  currentScanId: string | null;
  currentPipelineStage: PipelineStage | null;
  pipelineProgress: number;
  currentUserId: string | null;
  hasLoadedForCurrentUser: boolean;
  loadScans: () => Promise<void>;
  saveScan: (draft: AnalysisDraft) => Promise<AnalysisResult>;
  resetForUser: (userId: string | null) => void;
  setScanning: (scanning: boolean) => void;
  setCurrentScanId: (id: string | null) => void;
  setCurrentPipelineStage: (stage: PipelineStage | null) => void;
  setPipelineProgress: (progress: number) => void;
  getScanById: (id: string) => AnalysisResult | undefined;
  getScansByType: (type: ScanType) => AnalysisResult[];
  getScansByRiskLevel: (level: RiskLevel) => AnalysisResult[];
  clearHistory: () => Promise<void>;
}

let hydrationRequestId = 0;

export const useScanStore = create<ScanState>((set, get) => ({
  scans: [],
  isLoading: false,
  loadError: null,
  isScanning: false,
  currentScanId: null,
  currentPipelineStage: null,
  pipelineProgress: 0,
  currentUserId: null,
  hasLoadedForCurrentUser: false,

  loadScans: async () => {
    const userIdAtStart = get().currentUserId;

    if (!userIdAtStart) {
      set({
        scans: [],
        isLoading: false,
        loadError: null,
        hasLoadedForCurrentUser: false,
      });

      return;
    }

    if (get().hasLoadedForCurrentUser) {
      return;
    }

    const requestId = ++hydrationRequestId;

    set({
      isLoading: true,
      loadError: null,
    });

    try {
      const data = await fetchAnalysesFromSupabase();

      const currentState = get();

      if (
        currentState.currentUserId !== userIdAtStart ||
        requestId !== hydrationRequestId
      ) {
        return;
      }

      set({
        scans: data,
        isLoading: false,
        loadError: null,
        hasLoadedForCurrentUser: true,
      });
    } catch (err) {
      const currentState = get();

      if (
        currentState.currentUserId !== userIdAtStart ||
        requestId !== hydrationRequestId
      ) {
        return;
      }

      set({
        scans: [],
        loadError:
          err instanceof Error
            ? err.message
            : 'Could not load your analyses.',
        isLoading: false,
        hasLoadedForCurrentUser: false,
      });
    }
  },

  saveScan: async (draft) => {
    const userIdAtStart = get().currentUserId;

    if (!userIdAtStart) {
      throw new Error('You must be authenticated to save an analysis.');
    }

    const persistedScan = await persistAnalysisToSupabase(draft);

    const currentState = get();

    if (currentState.currentUserId !== userIdAtStart) {
      return persistedScan;
    }

    set((state) => ({
      scans: [
        persistedScan,
        ...state.scans.filter((scan) => scan.id !== persistedScan.id),
      ],
      loadError: null,
    }));

    return persistedScan;
  },

  resetForUser: (userId) => {
    hydration
