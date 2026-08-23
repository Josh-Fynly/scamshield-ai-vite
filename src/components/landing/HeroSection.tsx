import { motion } from 'framer-motion';
import { Shield, ArrowRight, Search, FileText, Image, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { APP_TAGLINE } from '../../lib/constants';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dot-grid-glow">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm mb-8">
            <Shield className="h-4 w-4" />
            <span>Enterprise-Grade Threat Detection</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text glow-text">AI-Powered</span>
            <br />
            <span className="text-text-primary">Threat Detection</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            {APP_TAGLINE}. Analyse messages, URLs, images, and files through our
            deterministic 9-stage pipeline with AI-powered threat analysis and
            explainable risk assessments.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Scan mode indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          {[
            { icon: FileText, label: 'Text Analysis', desc: 'Messages & emails' },
            { icon: Globe, label: 'URL Scanning', desc: 'Links & domains' },
            { icon: Image, label: 'Image OCR', desc: 'Screenshots & photos' },
            { icon: Search, label: 'File Inspection', desc: 'Documents & PDFs' },
          ].map((item, i) => (
            <div key={i} className="glass-sm p-4 text-center hover:bg-white/[0.07] transition-all duration-200">
              <item.icon className="h-6 w-6 text-accent-cyan mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <a href="#stats" className="inline-flex flex-col items-center gap-2 text-text-muted hover:text-text-secondary transition-colors">
            <span className="text-xs">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-5 h-8 border-2 border-text-muted rounded-full flex justify-center pt-2"
            >
              <div className="w-1 h-2 bg-text-muted rounded-full" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
                }
