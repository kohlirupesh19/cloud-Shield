import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, Info, Scaling, Clock, Loader2, RefreshCw, Bell, BellOff, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface AlertEvent {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatScore: number;
  source: string;
  detectedAt: string;
  resolvedAt: string | null;
  eventPayload: {
    user?: string;
    department?: string;
    dataset?: string;
    action?: string;
    hour?: number;
    bytes?: number;
    failed_logins?: number;
  };
}

type FilterType = 'All' | 'Critical' | 'High' | 'Medium' | 'Resolved';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function Alerts() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const loadAlerts = useCallback(() => {
    setLoading(true);
    // Load both unresolved alerts AND all incidents to show resolved ones too
    Promise.all([
      apiFetch('/security/alerts'),
      apiFetch('/security/incidents'),
    ])
      .then(([alertsRes, incidentsRes]) => {
        const allIncidents: AlertEvent[] = incidentsRes.data || [];
        setEvents(allIncidents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      await apiFetch(`/security/resolve/${id}`, { method: 'PATCH' });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, resolvedAt: new Date().toISOString() } : e));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const filtered = events.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Resolved') return e.resolvedAt !== null;
    if (filter === 'Critical') return e.severity === 'CRITICAL' && !e.resolvedAt;
    if (filter === 'High') return e.severity === 'HIGH' && !e.resolvedAt;
    if (filter === 'Medium') return e.severity === 'MEDIUM' && !e.resolvedAt;
    return true;
  });

  const counts = {
    all: events.length,
    critical: events.filter(e => e.severity === 'CRITICAL' && !e.resolvedAt).length,
    high: events.filter(e => e.severity === 'HIGH' && !e.resolvedAt).length,
    medium: events.filter(e => e.severity === 'MEDIUM' && !e.resolvedAt).length,
    resolved: events.filter(e => e.resolvedAt !== null).length,
  };

  const unresolvedCount = events.filter(e => !e.resolvedAt).length;

  return (
    <div className="p-container-margin max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-section-header text-metric-display text-on-surface tracking-tight">Alerts</h1>
          <p className="text-on-surface-variant font-body-main mt-1">
            Live security events and governance violations from DBSCAN clustering analysis.
          </p>
        </div>
        <button
          onClick={loadAlerts}
          disabled={loading}
          className="h-9 px-4 rounded-lg font-section-header text-[13px] transition-all flex items-center gap-2 bg-surface-container-lowest border border-precision border-outline-variant text-on-surface hover:bg-surface-container active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Events', value: counts.all, color: 'text-on-surface' },
          { label: 'Critical', value: counts.critical, color: 'text-error' },
          { label: 'High / Medium', value: counts.high + counts.medium, color: 'text-orange-600' },
          { label: 'Resolved', value: counts.resolved, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(['All', 'Critical', 'High', 'Medium', 'Resolved'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[12px] font-bold transition-all border border-precision',
              filter === f
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
            )}
          >
            {f}
            {f === 'Critical' && counts.critical > 0 && (
              <span className="ml-1.5 bg-error text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                {counts.critical}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant">Loading security events...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl">
          <BellOff className="w-14 h-14 text-outline-variant/50 mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-1">
            {filter === 'All' ? 'No security events' : `No ${filter.toLowerCase()} alerts`}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-xs text-center">
            {filter === 'All'
              ? 'Go to Security & access and submit an access log to trigger real-time DBSCAN analysis.'
              : `No ${filter.toLowerCase()} severity events found. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <AlertCard
              key={event.id}
              event={event}
              onDismiss={handleDismiss}
              isDismissing={dismissingId === event.id}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-[11px] text-outline font-label-caps uppercase tracking-widest mt-8">
          Showing {filtered.length} of {counts.all} total events
        </p>
      )}
    </div>
  );
}

function AlertCard({ event, onDismiss, isDismissing }: {
  key?: any;
  event: AlertEvent;
  onDismiss: (id: string) => void | Promise<void>;
  isDismissing: boolean;
}) {
  const isResolved = event.resolvedAt !== null;
  const payload = event.eventPayload;

  const severityConfig = {
    CRITICAL: { label: 'Critical', borderColor: 'border-l-error', iconBg: 'bg-error/10 text-error', badgeColor: 'text-error' },
    HIGH: { label: 'High', borderColor: 'border-l-orange-500', iconBg: 'bg-orange-50 text-orange-600', badgeColor: 'text-orange-600' },
    MEDIUM: { label: 'Medium', borderColor: 'border-l-yellow-500', iconBg: 'bg-yellow-50 text-yellow-600', badgeColor: 'text-yellow-600' },
    LOW: { label: 'Low', borderColor: 'border-l-secondary', iconBg: 'bg-secondary/10 text-secondary', badgeColor: 'text-secondary' },
  }[event.severity] || { label: 'Low', borderColor: 'border-l-secondary', iconBg: 'bg-secondary/10 text-secondary', badgeColor: 'text-secondary' };

  const Icon = event.severity === 'CRITICAL' || event.severity === 'HIGH' ? ShieldAlert : AlertTriangle;

  const title = (() => {
    const fails = payload.failed_logins || 0;
    const bytes = payload.bytes || 0;
    if (fails >= 8) return `Brute-Force Login Attack — ${fails} Failed Attempts`;
    if (fails >= 2) return `Repeated Failed Logins (${fails}x) — Possible Intrusion`;
    if (bytes > 5_000_000) return `Abnormal Data Exfiltration — ${(bytes / 1_000_000).toFixed(1)} MB Transfer`;
    if (payload.hour !== undefined && (payload.hour < 5 || payload.hour >= 22)) return `Suspicious Late-Night Access at ${payload.hour}:00`;
    return `${event.eventType} — Anomalous Behavior Detected`;
  })();

  const description = [
    payload.user && `User: ${payload.user}`,
    payload.department && `Dept: ${payload.department}`,
    payload.dataset && `Dataset: ${payload.dataset}`,
    payload.action && `Action: ${payload.action}`,
    payload.failed_logins !== undefined && `Failed logins: ${payload.failed_logins}`,
    payload.bytes !== undefined && payload.bytes > 0 && `Bytes: ${(payload.bytes / 1000).toFixed(0)} KB`,
    `Source IP: ${event.source}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className={cn(
      'bg-surface-container-lowest border border-precision border-outline-variant border-l-[4px] rounded-xl p-card-padding hover:shadow-md transition-all group',
      severityConfig.borderColor,
      isResolved && 'opacity-60'
    )}>
      <div className="flex gap-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', severityConfig.iconBg)}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-section-header text-section-header text-on-surface font-medium leading-snug">{title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {isResolved && (
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase">Resolved</span>
              )}
              <span className={cn('text-[11px] font-bold uppercase tracking-wider', severityConfig.badgeColor)}>
                {severityConfig.label}
              </span>
            </div>
          </div>

          <p className="text-on-surface-variant text-xs mb-3 leading-relaxed">{description}</p>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-outline text-[11px] font-medium">
              {payload.department && (
                <span className="flex items-center gap-1.5">
                  <Scaling className="w-3.5 h-3.5" />
                  {payload.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(event.detectedAt)}
              </span>
              <span className="font-mono text-[10px] text-outline/70">
                Threat: {(event.threatScore * 100).toFixed(0)}%
              </span>
            </div>
            {!isResolved && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDismiss(event.id)}
                  disabled={isDismissing}
                  className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isDismissing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Dismiss
                </button>
                <button className="px-4 py-1.5 text-[11px] font-bold bg-primary text-on-primary rounded-lg transition-all active:scale-95 shadow-sm hover:opacity-90">
                  View details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
