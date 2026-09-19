import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, Badge } from '../components/ui';
import { useScanStore } from '../stores/scanStore';
import { formatRelativeTime } from '../lib/utils';

export function HistoryPage() {
  const { scans, isLoading, loadError, loadScans } = useScanStore();
  useEffect(() => { void loadScans(); }, [loadScans]);
  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto"><div className="mb-8"><h1 className="text-2xl sm:text-3xl font-bold text-text-primary">History</h1><p className="mt-1 text-text-secondary">Persisted analysis history</p></div>{loadError && <div role="alert" className="mb-6 rounded-lg border border-danger-red/30 bg-danger-red/10 p-4 text-sm text-danger-red">{loadError}</div>}<Card><CardHeader className="flex flex-row items-center justify-between"><h2 className="text-sm font-semibold text-text-primary">All Analyses</h2><Link to="/scan" className="text-xs text-accent-blue">New scan</Link></CardHeader><CardContent>{isLoading ? <p className="text-sm text-text-muted">Loading analyses…</p> : scans.length === 0 && !loadError ? <div className="py-8 text-center"><Activity className="mx-auto mb-3 h-10 w-10 text-text-muted/40" /><p className="text-sm text-text-muted">No persisted analyses yet.</p></div> : <div className="space-y-3">{scans.map((scan) => <div key={scan.id} className="flex items-center justify-between rounded-lg border border-white/5 p-3"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-white/5 p-2">{scan.riskLevel === 'safe' ? <CheckCircle className="h-4 w-4 text-success-emerald" /> : scan.riskLevel === 'suspicious' ? <AlertTriangle className="h-4 w-4 text-warning-amber" /> : <Shield className="h-4 w-4 text-danger-red" />}</div><div className="min-w-0"><p className="truncate text-sm text-text-primary">{scan.inputContent}</p><p className="text-xs text-text-muted">{scan.scanType} · {formatRelativeTime(scan.createdAt)}</p></div></div><Badge riskLevel={scan.riskLevel} size="sm">{scan.riskScore}</Badge></div>)}</div>}</CardContent></Card></div>;
}
