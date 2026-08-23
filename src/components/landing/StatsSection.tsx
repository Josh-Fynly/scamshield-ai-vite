import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

const stats = [
  { icon: Shield, value: '10,000+', label: 'Daily Analyses', color: 'text-accent-blue' },
  { icon: AlertTriangle, value: '2,847', label: 'Threats Blocked Today', color: 'text-danger-red' },
  { icon: Activity, value: '99.7%', label: 'Detection Accuracy', color: 'text-success-emerald' },
  { icon: CheckCircle, value: '4.2ms', label: 'Avg. Response Time', color: 'text-accent-cyan' },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-6 text-center"
            >
              <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
              <p className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
                }
