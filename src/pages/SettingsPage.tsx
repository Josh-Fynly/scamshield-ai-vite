import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Palette, Bell, Shield, Eye, EyeOff, Save, RotateCcw, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, Input, Button } from '../components/ui';
import { useSettingsStore } from '../stores/settingsStore';
import type { AiProvider } from '../types';

const tabs = [
  { id: 'api', label: 'API Configuration', icon: Key },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');
  const { settings, updateApiKey, updateAiProvider, updateNotification, updateSecurity, resetSettings } = useSettingsStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Configure your platform preferences</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-56 flex-shrink-0"
        >
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    activeTab === tab.id
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">API Configuration</h3>
                <p className="text-xs text-text-muted mt-1">Configure your third-party API keys for enhanced threat intelligence</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.apiKeys).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary capitalize">
                      {key === 'openai' ? 'OpenAI' : key === 'gemini' ? 'Google Gemini' : key === 'virustotal' ? 'VirusTotal' : 'AbuseIPDB'}
                    </label>
                    <div className="relative">
                      <Input
                        type={showKeys[key] ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => updateApiKey(key as keyof typeof settings.apiKeys, e.target.value)}
                        placeholder={`Enter your ${key} API key`}
                        className="pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        aria-label={showKeys[key] ? 'Hide API key' : 'Show API key'}
                      >
                        {showKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-text-muted">
                      {key === 'openai' ? 'Used for AI-powered analysis and explanations (GPT-4o)' :
                       key === 'gemini' ? 'Used for AI-powered analysis and explanations (Gemini 1.5 Pro)' :
                       key === 'virustotal' ? 'Used for URL and domain reputation checking' :
                       'Used for IP address threat intelligence'}
                    </p>
                  </div>
                ))}

                {/* AI Provider Selector */}
                <div className="pt-2 border-t border-border-subtle space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      <Brain className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                      AI Analysis Provider
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                      Select which AI service to use for scam analysis and explanations
                    </p>
                    <div className="flex gap-2">
                      {(['openai', 'gemini'] as AiProvider[]).map((provider) => {
                        const isActive = settings.aiProvider === provider;
                        const hasKey = settings.apiKeys[provider].length > 0;
                        return (
                          <button
                            key={provider}
                            onClick={() => updateAiProvider(provider)}
                            className={`flex-1 p-3 rounded-lg text-left transition-all duration-150 ${
                              isActive
                                ? 'bg-accent-blue/10 border border-accent-blue/30'
                                : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                            }`}
                          >
                            <p className="text-sm font-medium text-text-primary">
                              {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {hasKey ? '✓ Key configured' : 'No key set'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Theme Preferences</h3>
                <p className="text-xs text-text-muted mt-1">Customise the appearance of your dashboard</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Theme Mode</label>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                    <Palette className="h-5 w-5 text-accent-blue" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Dark Mode</p>
                      <p className="text-xs text-text-muted">Dark theme is the default for this platform</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Colour Accent</label>
                  <p className="text-xs text-text-muted">The accent colour is optimised for the cybersecurity theme. Future updates may include customisation options.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Notification Settings</h3>
                <p className="text-xs text-text-muted mt-1">Configure how you receive alerts and updates</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {key === 'emailAlerts' ? 'Receive email notifications for scan results' :
                         key === 'pushNotifications' ? 'Receive push notifications in your browser' :
                         key === 'weeklyReport' ? 'Receive a weekly summary of all analyses' :
                         'Only receive notifications for critical threats'}
                      </p>
                    </div>
                    <button
                      onClick={() => updateNotification(key as keyof typeof settings.notifications, !value)}
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                        value ? 'bg-accent-blue' : 'bg-white/10'
                      }`}
                      role="switch"
                      aria-checked={value}
                      aria-label={`Toggle ${key}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Security Preferences</h3>
                <p className="text-xs text-text-muted mt-1">Manage your security and privacy settings</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.security).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {key === 'autoBlockHighRisk' ? 'Automatically block high-risk content' :
                         key === 'requireConfirmation' ? 'Require confirmation before running analyses' :
                         key === 'logAllAnalyses' ? 'Log all analyses for audit purposes' :
                         'Only allow analyses from whitelisted IP addresses'}
                      </p>
                    </div>
                    {typeof value === 'boolean' && (
                      <button
                        onClick={() => updateSecurity(key as keyof typeof settings.security, !value)}
                        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                          value ? 'bg-accent-blue' : 'bg-white/10'
                        }`}
                        role="switch"
                        aria-checked={value}
                        aria-label={`Toggle ${key}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="pt-4 border-t border-border-subtle">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={resetSettings}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
                      }
