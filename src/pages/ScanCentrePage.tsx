import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Globe, Image, File, Send, CheckCircle, Loader2, AlertTriangle, Shield, Eye, Brain, Lightbulb, Download, X, Upload } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { useSettingsStore } from '../stores/settingsStore';
import { runAIAnalysis } from '../lib/aiService';
import { generateId, formatDate } from '../lib/utils';
import { PIPELINE_STAGES_ORDER, PIPELINE_STAGE_LABELS, type PipelineStage, type ScanType, type RiskLevel, type ThreatIndicator } from '../types';
import type { AnalysisResult } from '../types';
import { extractTextFromImage, extractTextFromFile } from '../lib/ocrService';

const scanModes = [
  { value: 'text', label: 'Text Analysis', icon: FileText, desc: 'Analyse messages, emails, and text content' },
  { value: 'url', label: 'URL Scanning', icon: Globe, desc: 'Scan links and domains for threats' },
  { value: 'image', label: 'Image OCR', icon: Image, desc: 'Extract and analyse text from images' },
  { value: 'file', label: 'File Inspection', icon: File, desc: 'Inspect documents and PDFs' },
];

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif,image/bmp';
const ACCEPTED_FILE_TYPES = '.txt,.pdf,.doc,.docx,.rtf,.csv';

const stageIcons: Record<PipelineStage, typeof Shield> = {
  INGESTING: Download,
  PARSING: FileText,
  NORMALISATION: Shield,
  FEATURE_EXTRACTION: Eye,
  AI_ANALYSIS: Brain,
  RISK_ENGINE: AlertTriangle,
  EXPLANATION_ENGINE: Lightbulb,
  RECOMMENDATION_ENGINE: Shield,
  REPORT_GENERATION: Download,
  COMPLETE: CheckCircle,
  ERROR: AlertTriangle,
};

const stageColors: Record<PipelineStage, string> = {
  INGESTING: 'text-accent-blue',
  PARSING: 'text-accent-cyan',
  NORMALISATION: 'text-accent-purple',
  FEATURE_EXTRACTION: 'text-success-emerald',
  AI_ANALYSIS: 'text-accent-blue',
  RISK_ENGINE: 'text-warning-amber',
  EXPLANATION_ENGINE: 'text-accent-cyan',
  RECOMMENDATION_ENGINE: 'text-accent-purple',
  REPORT_GENERATION: 'text-success-emerald',
  COMPLETE: 'text-success-emerald',
  ERROR: 'text-danger-red',
};

export function ScanCentrePage() {
  const [scanType, setScanType] = useState<ScanType>('text');
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [completedStages, setCompletedStages] = useState<PipelineStage[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const { addScan, setScanning } = useScanStore();
  const { settings } = useSettingsStore();
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsFilePicker = scanType === 'image' || scanType === 'file';

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setShowResult(false);

    // For image mode, set a descriptive placeholder
    if (scanType === 'image') {
      setInputContent(`[Image selected: ${file.name}]`);
    } else if (scanType === 'file') {
      setInputContent(`[File selected: ${file.name}]`);
    }
  }, [scanType]);

  const handleScanTypeChange = useCallback((type: ScanType) => {
    setScanType(type);
    setResult(null);
    setShowResult(false);
    setSelectedFile(null);
    setInputContent('');
    setOcrStatus(null);
  }, []);

  const runPipeline = useCallback(async () => {
    abortRef.current = false;
    setIsRunning(true);
    setScanning(true);
    setCompletedStages([]);
    setResult(null);
    setShowResult(false);
    setOcrStatus(null);

    let contentToAnalyse = inputContent.trim();

    // ---- Image OCR branch ----
    if (scanType === 'image' && selectedFile) {
      setOcrStatus('Extracting text from image...');

      // Advance through INGESTING stage while OCR runs
      setCurrentStage(PIPELINE_STAGES_ORDER[0]);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedStages((prev) => [...prev, PIPELINE_STAGES_ORDER[0]]);

      try {
        const ocrResult = await extractTextFromImage(selectedFile);
        contentToAnalyse = ocrResult.text;

        // Fast-forward through PARSING (which is now the OCR extraction step)
        setCurrentStage(PIPELINE_STAGES_ORDER[1]);
        await new Promise((r) => setTimeout(r, 250));
        setCompletedStages((prev) => [...prev, PIPELINE_STAGES_ORDER[1]]);

        setOcrStatus(`OCR complete (confidence: ${(ocrResult.confidence * 100).toFixed(0)}%)`);
      } catch {
        setOcrStatus('OCR extraction failed — using placeholder analysis');
        setIsRunning(false);
        setScanning(false);
        setCurrentStage(null);
        setCompletedStages([]);
        return;
      }
    }

    // ---- File upload branch ----
    if (scanType === 'file' && selectedFile) {
      setOcrStatus('Reading file contents...');

      setCurrentStage(PIPELINE_STAGES_ORDER[0]);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedStages((prev) => [...prev, PIPELINE_STAGES_ORDER[0]]);

      try {
        const fileText = await extractTextFromFile(selectedFile);
        contentToAnalyse = fileText;

        setCurrentStage(PIPELINE_STAGES_ORDER[1]);
        await new Promise((r) => setTimeout(r, 250));
        setCompletedStages((prev) => [...prev, PIPELINE_STAGES_ORDER[1]]);

        setOcrStatus('File contents extracted successfully');
      } catch {
        setOcrStatus('File reading failed');
        setIsRunning(false);
        setScanning(false);
        setCurrentStage(null);
        setCompletedStages([]);
        return;
      }
    }

    // ---- Normal pipeline (or text mode / URL mode) ----
    // If the content was extracted via OCR/file reading, analyse it as text
    const effectiveScanType = (
      (scanType === 'image' || scanType === 'file') && selectedFile
    ) ? 'text' as const : scanType;

    const { riskScore, riskLevel, threatIndicators, aiExplanation, recommendedAction, confidenceLevel, stageDurations } = await runAIAnalysis(
      contentToAnalyse,
      effectiveScanType,
      settings.aiProvider,
      settings.apiKeys[settings.aiProvider],
    );

    // If we already advanced through INGESTING and PARSING,
    // start from NORMALISATION
    const startIndex = (scanType === 'image' || scanType === 'file') && selectedFile
      ? 2
      : 0;

    for (let i = startIndex; i < PIPELINE_STAGES_ORDER.length; i++) {
      if (abortRef.current) break;
      const stage = PIPELINE_STAGES_ORDER[i];
      setCurrentStage(stage);
      await new Promise((resolve) => setTimeout(resolve, stageDurations[stage] || 400));
      setCompletedStages((prev) => [...prev, stage]);
    }

    if (abortRef.current) {
      setIsRunning(false);
      setScanning(false);
      setCurrentStage(null);
      setOcrStatus(null);
      return;
    }

    const scanResult = {
      id: generateId(),
      scanType,
      inputContent: contentToAnalyse,
      riskScore,
      riskLevel: riskLevel as RiskLevel,
      threatIndicators: threatIndicators as ThreatIndicator[],
      aiExplanation,
      recommendedAction,
      confidenceLevel,
      pipelineStages: {} as AnalysisResult['pipelineStages'],
      createdAt: new Date().toISOString(),
    };

    addScan(scanResult);
    setResult(scanResult);
    setShowResult(true);
    setIsRunning(false);
    setScanning(false);
    setOcrStatus(null);
  }, [inputContent, scanType, selectedFile, addScan, setScanning, settings]);

  const handleCancel = () => {
    abortRef.current = true;
    setIsRunning(false);
    setScanning(false);
    setCurrentStage(null);
    setCompletedStages([]);
    setOcrStatus(null);
  };

  const isReady = (scanType === 'image' || scanType === 'file')
    ? (!!selectedFile || inputContent.trim().length > 0)
    : inputContent.trim().length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Scan Centre</h1>
        <p className="text-text-secondary mt-1">Submit content for AI-powered threat analysis</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
            <Brain className="h-3 w-3" />
            {settings.aiProvider === 'openai' ? 'OpenAI GPT-4o' : 'Google Gemini 1.5 Pro'}
          </span>
          <span className="text-[11px] text-text-muted">
            {settings.apiKeys[settings.aiProvider] ? '• API connected' : '• Simulation mode (add API key in Settings)'}
          </span>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">New Analysis</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scan type selector */}
              <div className="grid grid-cols-2 gap-2">
                {scanModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = scanType === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => handleScanTypeChange(mode.value as ScanType)}
                      disabled={isRunning}
                      className={`p-3 rounded-lg text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-accent-blue/10 border border-accent-blue/30'
                          : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                      } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-accent-blue' : 'text-text-muted'}`} />
                      <p className="text-xs font-medium text-text-primary">{mode.label}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Input area — varies by scan type */}
              {scanType === 'url' ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Enter URL</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <Globe className="h-4 w-4" />
                    </div>
                    <input
                      type="url"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all duration-150"
                      placeholder="https://example.com"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      disabled={isRunning}
                    />
                  </div>
                </div>
              ) : needsFilePicker ? (
                <div className="space-y-3">
                  {/* File dropzone / picker */}
                  <div
                    onClick={() => !isRunning && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${
                      selectedFile
                        ? 'border-accent-blue/40 bg-accent-blue/5'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                    } ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={scanType === 'image' ? ACCEPTED_IMAGE_TYPES : ACCEPTED_FILE_TYPES}
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isRunning}
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        {scanType === 'image' ? (
                          <Image className="h-8 w-8 text-accent-blue" />
                        ) : (
                          <File className="h-8 w-8 text-accent-blue" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-primary">{selectedFile.name}</p>
                          <p className="text-xs text-text-muted">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        {!isRunning && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setInputContent(''); }}
                            className="text-xs text-danger-red hover:text-danger-red/80 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-text-muted" />
                        <p className="text-sm text-text-secondary">
                          {scanType === 'image'
                            ? 'Click to select an image (PNG, JPG, WebP)'
                            : 'Click to select a file (TXT, PDF, DOC, DOCX)'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional manual text input for image/file */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-muted">
                      Or paste text manually for analysis
                    </label>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all duration-150 resize-none h-20"
                      placeholder="Paste text directly or upload a file above..."
                      value={inputContent}
                      onChange={(e) => { setInputContent(e.target.value); if (e.target.value) setSelectedFile(null); }}
                      disabled={isRunning}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Enter text content</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all duration-150 resize-none h-32"
                    placeholder="Paste suspicious message, email content, or text..."
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              )}

              {/* OCR / extraction status */}
              {ocrStatus && (
                <div className="flex items-center gap-2 text-xs text-accent-cyan bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{ocrStatus}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={runPipeline}
                  loading={isRunning}
                  disabled={!isReady || isRunning}
                  icon={<Send className="h-4 w-4" />}
                  className="flex-1"
                >
                  {isRunning ? 'Analysing...' : 'Analyse'}
                </Button>
                {isRunning && (
                  <Button variant="danger" onClick={handleCancel} icon={<X className="h-4 w-4" />}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Pipeline visualizer or Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {isRunning ? (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Analysis Pipeline</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PIPELINE_STAGES_ORDER.map((stage) => {
                    const isCompleted = completedStages.includes(stage);
                    const isCurrent = currentStage === stage;
                    const Icon = stageIcons[stage];

                    return (
                      <div
                        key={stage}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                          isCurrent
                            ? 'bg-accent-blue/10 border border-accent-blue/20'
                            : isCompleted
                            ? 'bg-success-emerald/5'
                            : 'opacity-40'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          isCompleted
                            ? 'bg-success-emerald/20'
                            : isCurrent
                            ? 'bg-accent-blue/20'
                            : 'bg-white/5'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-success-emerald" />
                          ) : (
                            <Icon className={`h-4 w-4 ${isCurrent ? stageColors[stage] : 'text-text-muted'} ${isCurrent ? 'animate-pulse' : ''}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isCompleted
                              ? 'text-success-emerald'
                              : isCurrent
                              ? 'text-accent-blue'
                              : 'text-text-muted'
                          }`}>
           
