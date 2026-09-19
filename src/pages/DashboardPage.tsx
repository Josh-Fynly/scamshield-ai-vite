import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, Badge } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { formatRelativeTime } from '../lib/utils';

export function DashboardPage() {
  const { scans, isLoading, loadError, loadScans } = useScanStore();
  useEffect(() => { void loadScans(); }, [loadScans]);

  const stats = useMemo(() => ({
    total: scans.length,
    safe: scans.filter((scan) => scan.riskLevel === 'safe').length,
    suspicious: scans.filter((scan) => scan.riskLevel === 'suspicious').length,
    highRisk: scans.filter((scan) => scan.riskLevel === 'high_risk').length,
  }), [scans]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Persisted threat intelligence overview</p>
      </div>
      {loadError && <div role="alert" className="mb-6 rounded-lg border border-danger-red/30 bg-danger-red/10 p-4 text-sm text-danger-red">{loadError}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[['Total Analyses', stats.total, Activity], ['Safe', stats.safe, CheckCircle], ['Suspicious', stats.suspicious, AlertTriangle], ['High Risk', stats.highRisk, Shield]].map(([label, value, Icon]) => (
          <div key={String(label)} className="glass p-4"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-accent-blue" /><div><p className="text-2xl font-bold text-text-primary">{value}</p><p className="text-xs text-text-muted">{label}</p></div></div></div>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><h3 className="text-sm font-semibold text-text-primary">Recent Analyses</h3><Link to="/scan" className="text-xs text-accent-blue">New scan</Link></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-text-muted">Loading analyses…</p> : scans.length === 0 && !loadError ? <p className="text-sm text-text-muted">No persisted analyses yet.</p> : <div className="space-y-3">{scans.slice(0, 5).map((scan) => <div key={scan.id} className="flex items-center justify-between"><div className="min-w-0"><p className="truncate text-sm text-text-primary">{scan.inputContent.slice(0, 60)}</p><p className="text-xs text-text-muted">{formatRelativeTime(scan.createdAt)}</p></div><Badge riskLevel={scan.riskLevel} size="sm">{scan.riskScore}</Badge></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
