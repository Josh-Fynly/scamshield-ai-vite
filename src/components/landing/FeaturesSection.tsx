import { motion } from 'framer-motion';
import { Brain, Shield, Zap, Eye, FileSearch, Lock, BarChart, Bell, Globe } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning models detect phishing, fraud, and social engineering patterns with 99.7% accuracy.',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  {
    icon: Zap,
    title: 'Real-time Processing',
    description: 'Our 9-stage deterministic pipeline completes analysis in under 5 seconds for most inputs.',
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
  {
    icon: Eye,
    title: 'Explainable Results',
    description: 'Every threat score comes with a detailed AI explanation so you understand exactly why something was flagged.',
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10',
  },
  {
    icon: FileSearch,
    title: 'Multi-format Scanning',
    description: 'Analyse text messages, URLs, images via OCR, and documents — all from a single interface.',
    color: 'text-success-emerald',
    bg: 'bg-success-emerald/10',
  },
  {
    icon: Shield,
    title: 'Threat Intelligence',
    description: 'Integration with major threat intelligence feeds keeps our detection database current and comprehensive.',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  {
    icon: BarChart,
    title: 'Detailed Analytics',
    description: 'Comprehensive dashboard with threat trends, detection statistics, and confidence indicators.',
    color: 'text-warning-amber',
    bg: 'bg-warning-amber/10',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Configure notifications for critical threats and receive immediate alerts when dangers are detected.',
    color: 'text-danger-red',
    bg: 'bg-danger-red/10',
  },
  {
    icon: Globe,
    title: 'URL Reputation',
    description: 'Real-time URL reputation checking against multiple threat databases and known malicious domains.',
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant infrastructure with encrypted data storage and role-based access control.',
    color: 'text-success-emerald',
    bg: 'bg-success-emerald/10',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Enterprise-Grade{" "}
            <span className="gradient-text">Threat Detection</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Everything you need to protect your organisation from phishing, fraud, and social engineering attacks.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass p-6 hover:bg-white/[0.07] transition-all duration-200 group"
            >
              <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
