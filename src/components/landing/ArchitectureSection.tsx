import { motion } from 'framer-motion';
import { CheckCircle, Shield, Eye, Brain, FileSearch, AlertTriangle, Lightbulb, Download, ArrowRight } from 'lucide-react';
import { PIPELINE_STAGES_ORDER, PIPELINE_STAGE_LABELS, type PipelineStage } from '../../types';

const stageIcons: Record<PipelineStage, typeof Shield> = {
  INGESTING: Download,
  PARSING: FileSearch,
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

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Analysis{" "}
            <span className="gradient-text">Pipeline</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Every submission passes through our 9-stage deterministic analysis pipeline
            for comprehensive threat detection.
          </p>
        </motion.div>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-12 left-[4.5%] right-[4.5%] h-0.5 bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-purple opacity-30" />

            <div className="flex justify-between">
              {PIPELINE_STAGES_ORDER.map((stage, i) => {
                const Icon = stageIcons[stage];
                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex flex-col items-center gap-2 w-[10%]"
                  >
                    <div className="relative z-10 h-14 w-14 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className={`h-6 w-6 ${stageColors[stage]}`} />
                    </div>
                    <p className="text-[10px] text-text-muted text-center leading-tight">
                      {PIPELINE_STAGE_LABELS[stage]}
                    </p>
                    {i < PIPELINE_STAGES_ORDER.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-text-muted/30 -mt-1" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="lg:hidden space-y-3">
          {PIPELINE_STAGES_ORDER.map((stage, i) => {
            const Icon = stageIcons[stage];
            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-4 glass-sm p-3"
              >
                <div className="h-10 w-10 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center flex-shrink-0">
                  <Icon className={`h-5 w-5 ${stageColors[stage]}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </p>
                </div>
                {i < PIPELINE_STAGES_ORDER.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-text-muted/30" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
            }
