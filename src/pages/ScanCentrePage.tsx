import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle, Loader2, Send, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { useSettingsStore } from '../stores/settingsStore';
import { runAIAnalysis } from '../lib/aiService';
import { PIPELINE_STAGES_ORDER, type AnalysisResult, type PipelineStage, type RiskLevel, type ScanType, type ThreatIndicator } from '../types';

export function ScanCentrePage() {
  const [scanType, setScanType] = useState<ScanType>('text');
  const [inputContent, setInputContent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const abortRef = useRef(false);
  const { saveScan, setScanning } = useScanStore();
  const { settings } = useSettingsStore();

  const runPipeline = useCallback(async () => {
    const content = inputContent.trim();
    if (!content) return;
    abortRef.current = false;
    setError(null); setResult(null); setIsRunning(true); setScanning(true);
    try {
      const analysis = await runAIAnalysis(content, scanType, settings.aiProvider);
      for (const stage of PIPELINE_STAGES_ORDER) {
        if (abortRef.current) return;
        setCurrentStage(stage);
      }
      if (abortRef.current) return;
      const persisted = await saveScan({
        id: '', scanType, inputContent: content,
        riskScore: analysis.riskScore, riskLevel: analysis.riskLevel as RiskLevel,
        threatIndicators: analysis.threatIndicators as ThreatIndicator[],
        aiExplanation: analysis.aiExplanation, recommendedAction: analysis.recommendedAction,
        confidenceLevel: analysis.confidenceLevel,
        pipelineStages: {} as AnalysisResult['pipelineStages'], createdAt: new Date().toISOString(),
      });
      setResult(persisted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis or persistence failed.');
    } finally {
      setCurrentStage(null); setIsRunning(false); setScanning(false);
    }
  }, [inputContent, scanType, saveScan, setScanning, settings.aiProvider]);

  return <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto"><h1 className="text-2xl font-bold text-text-primary">Scan Centre</h1><p className="mt-1 text-text-secondary">Analysis is only successful after persistence.</p><Card className="mt-6"><CardHeader><h2 className="text-sm font-semibold text-text-primary">New analysis</h2></CardHeader><CardContent className="space-y-4"><select value={scanType} onChange={(event) => setScanType(event.target.value as ScanType)} disabled={isRunning} className="w-full rounded-lg bg-white/5 p-3 text-text-primary"><option value="text">Text</option><option value="url">URL</option><option value="image">Image</option><option value="file">File</option></select><textarea value={inputContent} onChange={(event) => setInputContent(event.target.value)} disabled={isRunning} className="min-h-40 w-full rounded-lg bg-white/5 p-3 text-text-primary" placeholder="Enter content to analyse" /><div className="flex items-center gap-3"><Button onClick={() => void runPipeline()} disabled={isRunning || !inputContent.trim()} loading={isRunning} icon={<Send className="h-4 w-4" />}>Analyse</Button>{isRunning && <Button variant="danger" onClick={() => { abortRef.current = true; }} icon={<X className="h-4 w-4" />}>Cancel</Button>}</div>{error && <div role="alert" className="flex gap-2 rounded-lg border border-danger-red/30 bg-danger-red/10 p-3 text-sm text-danger-red"><AlertTriangle className="h-4 w-4" />{error}</div>}{isRunning && <div className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" />{currentStage ?? 'Running analysis…'}</div>}{result && <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 p-4 text-sm text-success-emerald"><CheckCircle className="mr-2 inline h-4 w-4" />Persisted analysis {result.id} · score {result.riskScore}</div>}<p className="text-xs text-text-muted"><Brain className="mr-1 inline h-3 w-3" />Provider credentials are managed by the server-side analysis service.</p></CardContent></Card></div>;
}
