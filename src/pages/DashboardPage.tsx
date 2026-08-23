import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, Badge } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { SAMPLE_SCANS } from '../lib/constants';
import { formatRelativeTime } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AnalysisResult } from '../types';
import { Link } from 'react-router-dom';

const COLORS = {
  safe: '#10b981',
  suspicious: '#f59e0b',
  high_risk: '#ef4444',
};

const CARD_COLORS = [
  { icon: Activity, label: 'Total Analyses', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
  { icon: CheckCircle, label: 'Safe', color: 'text-success-emerald', bg: 'bg-success-emerald/10' },
  { icon: AlertTriangle, label: 'Suspicious', color: 'text-warning-amber', bg: 'bg-warning-amber/10' },
  { icon: Shield, label: 'High Risk', color: 'text-danger-red', bg: 'bg-danger-red/10' },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-sm p-3 text-xs">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { scans } = useScanStore();

  // Memoise all derived data so it only recalculates when scans changes
  const allScans = useMemo(() => [...SAMPLE_SCANS, ...scans] as AnalysisResult[], [scans]);

  const summaryStats = useMemo(() => {
    const safe = allScans.filter((s) => s.riskLevel === 'safe');
    const suspicious = allScans.filter((s) => s.riskLevel === 'suspicious');
    const highRisk = allScans.filter((s) => s.riskLevel === 'high_risk');
    const avgScore = allScans.length > 0
      ? Math.round(allScans.reduce((acc, s) => acc + s.riskScore, 0) / allScans.length)
      : 0;
    const avgConfidence = allScans.length > 0
      ? (allScans.reduce((acc, s) => acc + s.confidenceLevel, 0) / allScans.length * 100).toFixed(1)
      : '0.0';
    return { safe: safe.length, suspicious: suspicious.length, highRisk: highRisk.length, avgScore, avgConfidence };
  }, [allScans]);

  const timelineData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayScans = allScans.filter((s) => {
        const scanDate = new Date(s.createdAt);
        return scanDate.toDateString() === date.toDateString();
      });
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        safe: dayScans.filter((s) => s.riskLevel === 'safe').length,
        suspicious: dayScans.filter((s) => s.riskLevel === 'suspicious').length,
        highRisk: dayScans.filter((s) => s.riskLevel === 'high_risk').length,
      };
    }),
    [allScans]
  );

  const detectionStats = useMemo(() => [
    { name: 'Safe', value: summaryStats.safe, color: COLORS.safe },
    { name: 'Suspicious', value: summaryStats.suspicious, color: COLORS.suspicious },
    { name: 'High Risk', value: summaryStats.highRisk, color: COLORS.high_risk },
  ], [summaryStats]);

  const recentAnalyses = useMemo(() => allScans.slice(0, 5), [allScans]);

  const latestAnalysis = useMemo(() => allScans.length > 0 ? allScans[0] : null, [allScans]);

  const summaryCardData = useMemo(() => [
    { ...CARD_COLORS[0], value: allScans.length },
    { ...CARD_COLORS[1], value: summaryStats.safe },
    { ...CARD_COLORS[2], value: summaryStats.suspicious },
    { ...CARD_COLORS[3], value: summaryStats.highRisk },
  ], [allScans.length, summaryStats]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Real-time threat intelligence overview</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCardData.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Threat Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Threat Timeline</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.safe} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.safe} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.suspicious} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.suspicious} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.high_risk} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.high_risk} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="safe" stroke={COLORS.safe} fill="url(#safeGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="suspicious" stroke={COLORS.suspicious} fill="url(#suspGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="highRisk" stroke={COLORS.high_risk} fill="url(#riskGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detection Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Detection Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={detectionStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {detectionStats.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 w-full sm:w-auto">
                  {detectionStats.map((stat) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }} />
                      <span className="text-sm text-text-secondary">{stat.name}</span>
                      <span className="text-sm font-medium text-text-primary ml-auto">{stat.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Avg. Score</span>
                      <span className="font-medium text-text-primary">{summaryStats.avgScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-text-muted">Avg. Confidence</span>
                      <span className="font-medium text-text-primary">{summaryStats.avgConfidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Analyses & AI Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analyses */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Recent Analyses</h3>
              <Link to="/history" className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {recentAnalyses.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          scan.riskLevel === 'safe' ? 'bg-success-emerald/10' :
                          scan.riskLevel === 'suspicious' ? 'bg-warning-amber/10' : 'bg-danger-red/10'
                        }`}>
                          {scan.riskLevel === 'safe' ? <CheckCircle className="h-4 w-4 text-success-emerald" /> :
                           scan.riskLevel === 'suspicious' ? <AlertTriangle className="h-4 w-4 text-warning-amber" /> :
                           <Shield className="h-4 w-4 text-danger-red" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {scan.inputContent.slice(0, 40)}...
                          </p>
                          <p className="text-xs text-text-muted">{formatRelativeTime(scan.createdAt)}</p>
                        </div>
                      </div>
                      <Badge riskLevel={scan.riskLevel} size="sm">
                        {scan.riskScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No analyses yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Run a scan to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Explanation Panel — exactly one, no duplicates */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">AI Explanation</h3>
            </CardHeader>
            <CardContent>
              {latestAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-accent-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        Latest Analysis: <span className="text-text-muted">{latestAnalysis.scanType}</span>
                      </p>
                      <p className="text-xs text-text-muted">
                        Risk Score: {latestAnalysis.riskScore}/100 · Confidence: {(latestAnalysis.confidenceLevel * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="glass-sm p-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {latestAnalysis.aiExplanation}
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-text-muted flex-shrink-0">Recommended Action</span>
                    <span className="text-text-primary font-medium text-right">
                      {latestAnalysis.recommendedAction}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No analyses yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Run a scan to see AI explanations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
      }
            
