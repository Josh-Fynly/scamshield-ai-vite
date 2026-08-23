import { motion } from 'framer-motion';
import { Smartphone, Monitor, LayoutDashboard, Search, History, Settings } from 'lucide-react';

const screenshots = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard Overview',
    description: 'Real-time threat monitoring with comprehensive analytics and risk metrics.',
  },
  {
    icon: Search,
    title: 'Scan Centre',
    description: 'Multi-format analysis with the animated 9-stage pipeline visualisation.',
  },
  {
    icon: History,
    title: 'Analysis History',
    description: 'Searchable, filterable history with detailed report views and export options.',
  },
  {
    icon: Settings,
    title: 'Settings & Configuration',
    description: 'API key management, notification preferences, and security controls.',
  },
];

export function ScreenshotsSection() {
  return (
    <section id="screenshots" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Powerful{" "}
            <span className="gradient-text">Interface</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Built for security professionals with a clean, dark-themed interface
            that puts critical information front and centre.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {screenshots.map((screenshot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-4">
                <screenshot.icon className="h-6 w-6 text-accent-blue" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{screenshot.title}</h3>
              <p className="text-sm text-text-secondary">{screenshot.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Device mockups */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative w-64 h-80 glass rounded-3xl p-3 flex items-center justify-center">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/10 rounded-full" />
              <Monitor className="h-16 w-16 text-accent-blue/30" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/5" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center md:justify-start"
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-text-primary">Responsive Design</h3>
              <p className="text-text-secondary">
                Fully responsive layout that works seamlessly across desktop, tablet, and mobile devices.
                Access your threat intelligence from anywhere.
              </p>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Monitor className="h-4 w-4" />
                  <span>Desktop</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
              }
