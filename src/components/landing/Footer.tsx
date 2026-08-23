import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* CTA */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
            Ready to protect your organisation?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Start analysing threats today with our free tier. No credit card required.
          </p>
          <Link to="/dashboard">
            <Button size="lg" icon={<ArrowRight className="h-5 w-5" />}>
              Get Started Free
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-accent-blue" />
              <span className="font-semibold text-text-primary">{APP_NAME}</span>
            </div>
            <p className="text-sm text-text-muted">
              Enterprise-grade threat detection powered by AI. Protecting organisations from phishing, fraud, and social engineering.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#features" className="hover:text-text-secondary transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-text-secondary transition-colors">Pricing</a></li>
              <li><a href="#architecture" className="hover:text-text-secondary transition-colors">Architecture</a></li>
              <li><Link to="/dashboard" className="hover:text-text-secondary transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#" className="hover:text-text-secondary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#" className="hover:text-text-secondary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-text-secondary transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border-subtle text-center text-sm text-text-muted">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
