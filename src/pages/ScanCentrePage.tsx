import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Globe, Image, File, Send, CheckCircle, Loader2, AlertTriangle, Shield, Eye, Brain, Lightbulb, Download, X, Upload } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { useSettingsStore } from '../stores/settingsStore';
import { runAIAnalysis } from '../lib/aiService';
import { PIPELINE_STAGES_ORDER, type AnalysisResult, type PipelineStage, type RiskLevel, type ScanType, type ThreatIndicator } from '../types';
import { extractTextFromImage, extractTextFromFile } from '../lib/ocrService';

const scanModes = [
  { value: 'text', label: 'Text Analysis', icon: FileText, desc: 'Analyse messages, emails, and text content' },
  { value: 'url', label: 'URL Scanning', icon: Globe, desc: 'Scan links and domains for threats' },
  { value: 'image', label: 'Image OCR', icon: Image, desc: 'Extract and analyse text from images' },
  { value: 'file', label: 'File Inspection', icon: File, desc: 'Inspect documents and PDFs' },
] as const;
const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif,image/bmp';
const ACCEPTED_FILE_TYPES = '.txt,.pdf,.doc,.docx,.rtf,.csv';
const stageIcons: Record<PipelineStage, typeof Shield> = { INGESTING: Download, PARSING: FileText, NORMALISATION: Shield, FEATURE_EXTRACTION: Eye, AI_ANALYSIS: Brain, RISK_ENGINE: AlertTriangle, EXPLANATION_ENGINE: Lightbulb, RECOMMENDATION_ENGINE: Shield, REPORT_GENERATION: Download, COMPLETE: CheckCircle, ERROR: AlertTriangle };

export function ScanCentrePage() {
  const [scanType, setScanType] = useState<ScanType>('text');
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [completedStages, setCompletedStages] = useState<PipelineStage[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveScan, setScanning } = useScanStore();
  const { settings } = useSettingsStore();
  const needsFilePicker = scanType === 'image' || scanType === 'file';

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); setResult(null); setError(null);
    setInputContent(`[${scanType === 'image' ? 'Image' : 'File'} selected: ${file.name}]`);
  }, [scanType]);

  const handleScanTypeChange = useCallback((type: ScanType) => {
    setScanType(type); setSelectedFile(null); setInputContent(''); setResult(null); setError(null); setOcrStatus(null);
  }, []);

  const runPipeline = useCallback(async () => {
    abortRef.current = false; setIsRunning(true); setScanning(true); setResult(null); setError(null); setCompletedStages([]); setOcrStatus(null);
    let content = inputContent.trim();
    try {
      if (selectedFile && scanType === 'image') {
        setOcrStatus('Extracting text from image...');
        const extracted = await extractTextFromImage(selectedFile);
        content = extracted.text; setOcrStatus(`OCR complete (confidence: ${(extracted.confidence * 100).toFixed(0)}%)`);
      } else if (selectedFile && scanType === 'file') {
        setOcrStatus('Reading file contents...'); content = await extractTextFromFile(selectedFile); setOcrStatus('File contents extracted successfully');
      }
      if (!content) throw new Error('Analysis content is empty.');
      const effectiveType = selectedFile && (scanType === 'image' || scanType === 'file') ? 'text' : scanType;
      const analysis = await runAIAnalysis(content, effectiveType, settings.aiProvider);
      const startIndex = selectedFile && (scanType === 'image' || scanType === 'file') ? 2 : 0;
      for (let index = startIndex; index < PIPELINE_STAGES_ORDER.length; index += 1) {
        if (abortRef.current) return;
        const stage = PIPELINE_STAGES_ORDER[index]; setCurrentStage(stage); setCompletedStages((previous) => [...previous, stage]);
      }
      if (abortRef.current) return;
      const persisted = await saveScan({ id: '', scanType, inputContent: content, riskScore: analysis.riskScore, riskLevel: analysis.riskLevel as RiskLevel, threatIndicators: analysis.threatIndicators as ThreatIndicator[], aiExplanation: analysis.aiExplanation, recommendedAction: analysis.recommendedAction, confidenceLevel: analysis.confidenceLevel, pipelineStages: {} as AnalysisResult['pipelineStages'], createdAt: new Date().toISOString() });
      setResult(persisted);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analysis or persistence failed.');
    } finally {
      setCurrentStage(null); setIsRunning(false); setScanning(false); setOcrStatus(null);
    }
  }, [inputContent, scanType, selectedFile, saveScan, setScanning, settings.aiProvider]);

  const cancel = () => { abortRef.current = true; setIsRunning(false); setScanning(false); setCurrentStage(null); setCompletedStages([]); setOcrStatus(null); };
  const ready = selectedFile !== null || inputContent.trim().length > 0;

  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto"><motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Scan Centre</h1><p className="text-text-secondary mt-1">Submit content for AI-powered threat analysis</p><p className="text-xs text-text-muted mt-3"><Brain className="mr-1 inline h-3 w-3" />Provider credentials are managed by the server-side analysis service.</p></motion.div><div className="grid lg:grid-cols-2 gap-6"><Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">New Analysis</h2></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-2">{scanModes.map((mode) => { const Icon = mode.icon; return <button key={mode.value} type="button" onClick={() => handleScanTypeChange(mode.value)} disabled={isRunning} className={`rounded-lg border p-3 text-left ${scanType === mode.value ? 'border-accent-blue/30 bg-accent-blue/10' : 'border-white/10 bg-white/5'}`}><Icon className="mb-1 h-5 w-5 text-accent-blue" /><p className="text-xs font-medium text-text-primary">{mode.label}</p><p className="text-[10px] text-text-muted">{mode.desc}</p></button>; })}</div>{scanType === 'url' ? <input type="url" value={inputContent} onChange={(event) => setInputContent(event.target.value)} disabled={isRunning} placeholder="https://example.com" className="w-full rounded-lg bg-white/5 p-3 text-sm text-text-primary" /> : needsFilePicker ? <><div onClick={() => !isRunning && fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') fileInputRef.current?.click(); }} className="cursor-pointer rounded-lg border-2 border-dashed border-white/10 p-6 text-center"><input ref={fileInputRef} type="file" accept={scanType === 'image' ? ACCEPTED_IMAGE_TYPES : ACCEPTED_FILE_TYPES} onChange={handleFileChange} className="hidden" disabled={isRunning} />{selectedFile ? <><File className="mx-auto h-8 w-8 text-accent-blue" /><p className="mt-2 text-sm text-text-primary">{selectedFile.name}</p><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedFile(null); setInputContent(''); }} className="mt-2 text-xs text-danger-red">Remove</button></> : <><Upload className="mx-auto h-8 w-8 text-text-muted" /><p className="text-sm text-text-secondary">Select an image or supported file</p></>}</div><textarea value={inputContent} onChange={(event) => { setInputContent(event.target.value); if (event.target.value) setSelectedFile(null); }} disabled={isRunning} placeholder="Or paste text manually" className="min-h-20 w-full rounded-lg bg-white/5 p-3 text-sm text-text-primary" /></> : <textarea value={inputContent} onChange={(event) => setInputContent(event.target.value)} disabled={isRunning} placeholder="Paste suspicious message, email content, or text..." className="min-h-32 w-full rounded-lg bg-white/5 p-3 text-sm text-text-primary" />}{ocrStatus && <p className="text-xs text-accent-cyan">{ocrStatus}</p>}<div className="flex gap-3"><Button onClick={() => void runPipeline()} disabled={!ready || isRunning} loading={isRunning} icon={<Send className="h-4 w-4" />}>Analyse</Button>{isRunning && <Button variant="danger" onClick={cancel} icon={<X className="h-4 w-4" />}>Cancel</Button>}</div>{error && <div role="alert" className="rounded-lg border border-danger-red/30 bg-danger-red/10 p-3 text-sm text-danger-red"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}</CardContent></Card><Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">Analysis Pipeline</h2></CardHeader><CardContent className="space-y-2">{isRunning ? PIPELINE_STAGES_ORDER.map((stage) => { const Icon = stageIcons[stage]; return <div key={stage} className={`flex items-center gap-3 rounded-lg p-2 ${currentStage === stage ? 'bg-accent-blue/10' : completedStages.includes(stage) ? 'bg-success-emerald/5' : 'opacity-40'}`}><Icon className="h-4 w-4 text-accent-blue" />{stage}</div>; }) : result ? <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 p-4 text-sm text-success-emerald"><CheckCircle className="mr-2 inline h-4 w-4" />Persisted analysis {result.id} · score {result.riskScore}</div> : <p className="text-sm text-text-muted">Run an analysis to view its persisted result.</p>}{isRunning && <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />}</CardContent></Card></div></div>;
}
