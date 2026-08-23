import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'For individuals and small teams',
    features: [
      '100 analyses per month',
      'Text & URL scanning',
      'Basic risk assessment',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For growing security teams',
    features: [
      '5,000 analyses per month',
      'All scan types (Text, URL, Image, File)',
      'Full AI explanations',
      'Export reports (JSON)',
      'Priority email & chat support',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organisations',
    features: [
      'Unlimited analyses',
      'All scan types + custom integrations',
      'Dedicated AI model fine-tuning',
      'Custom export formats',
      '24/7 phone & email support',
      'SSO & RBAC',
      'On-premise deployment option',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What types of threats can ScamShield AI detect?',
    a: 'ScamShield AI detects phishing attempts, email scams, fraudulent URLs, social engineering attacks, identity theft attempts, financial fraud, and malware delivery vectors across text, URLs, images, and documents.',
  },
  {
    q: 'How accurate is the threat detection?',
    a: 'Our platform achieves 99.7% detection accuracy across all scan types. Each analysis goes through a 9-stage deterministic pipeline that combines rule-based detection with AI-powered analysis for comprehensive coverage.',
  },
  {
    q: 'How long does an analysis take?',
    a: 'Most analyses complete in under 5 seconds. Text and URL scans are typically the fastest (2-3 seconds), while image OCR and file scans may take slightly longer depending on the size and complexity of the content.',
  },
  {
    q: 'Can I integrate ScamShield AI with my existing tools?',
    a: 'Yes, our Professional and Enterprise plans include API access for integration with SIEM systems, SOAR platforms, email security gateways, and custom workflows. Enterprise plans also support custom integrations.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted at rest and in transit. We maintain SOC 2 compliance and follow industry best practices for data security. Your analysis data is never shared with third parties.',
  },
  {
    q: 'How does the pricing work?',
    a: 'Our pricing is based on the number of analyses per month. The Starter plan is free with 100 analyses/month. Professional plans include 5,000 analyses, and Enterprise plans offer unlimited usage with custom pricing.',
  },
];

export function PricingSection() {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Simple{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Choose the plan that fits your organisation's needs. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative glass p-6 ${plan.popular ? 'border-accent-blue/30 ring-1 ring-accent-blue/20' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-blue text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-1">{plan.name}</h3>
                <p className="text-sm text-text-muted mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                  {plan.period && <span className="text-text-muted text-sm">{plan.period}</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-text-secondary">
                    <Check className="h-4 w-4 text-success-emerald mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.name === 'Enterprise' ? (
                <a
                  href="mailto:sales@scamshield.ai"
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                    plan.popular
                      ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                      : 'bg-white/5 text-text-primary hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  to="/dashboard"
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                      : 'bg-white/5 text-text-primary hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div id="faq">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-10"
          >
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </motion.h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-sm overflow-hidden"
              >
                <button
                  onClick={() => setSelectedFaq(selectedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-text-primary hover:bg-white/[0.03] transition-colors"
                  aria-expanded={selectedFaq === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
                      selectedFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {selectedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
    }
