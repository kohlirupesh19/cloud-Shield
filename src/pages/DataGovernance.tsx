import React, { useEffect, useState, useCallback } from 'react';
import { Network, Plus, Loader2, RefreshCw, Database, FileJson, FileText, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface LineageItem {
  datasetId: string;
  name: string;
  fileType: string;
  rowCount: number | null;
  source: string;
  transformations: string[];
  sink: string;
  status: string;
  createdAt: string;
  sizeBytes: number;
  metadata: {
    qualityScore?: number;
    anomalyScore?: number;
    department?: string;
  } | null;
}

interface ComplianceStatus {
  policyCoverage: number;
  retentionCompliance: number;
  catalogCompleteness: number;
  policyCount: number;
  datasetCount: number;
  alertCount: number;
  analysisCount: number;
}

interface PolicyItem {
  id: string;
  name: string;
  framework: string;
  policyVersion: string;
  isActive: boolean;
  createdAt: string;
}

export function DataGovernance() {
  const [lineage, setLineage] = useState<LineageItem[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyFramework, setPolicyFramework] = useState('ISO 27001');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/governance/lineage'),
      apiFetch('/governance/compliance-status'),
      apiFetch('/governance/policies'),
    ])
      .then(([lin, comp, pol]) => {
        setLineage(lin.data || []);
        setCompliance(comp.data);
        setPolicies(pol.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/governance/policies', {
        method: 'POST',
        body: JSON.stringify({ name: policyName, framework: policyFramework, version: '1.0', rules: {} }),
      });
      loadData();
      setShowPolicyModal(false);
      setPolicyName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = lineage.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function fileIcon(type: string) {
    if (type === 'json') return <FileJson className="w-4 h-4 text-primary" />;
    return <FileText className="w-4 h-4 text-secondary" />;
  }

  return (
    <div className="p-container-margin max-w-7xl mx-auto min-h-screen relative pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-metric-display text-metric-display text-on-surface tracking-tight">Data governance</h2>
          <p className="text-body-main text-on-surface-variant mt-1">
            Manage and audit institutional data assets, retention policies, and cross-departmental lineage.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="h-9 px-4 flex items-center gap-2 bg-surface-container-lowest border border-precision border-outline-variant rounded-lg text-xs font-bold hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack_gap_md">

        {/* Left Column — Data Asset Catalog */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden flex flex-col h-[480px]">
          <div className="p-card-padding border-b border-precision border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-section-header text-section-header">Data asset catalog</h3>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search datasets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 px-3 text-[12px] border border-precision border-outline-variant rounded bg-surface-container-low focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium">{filtered.length} assets</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Database className="w-12 h-12 text-outline-variant/50 mb-3" />
                <h4 className="font-bold text-on-surface mb-1">No datasets ingested yet</h4>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Go to the Dashboard and click "Add data source" to upload your first dataset.
                </p>
              </div>
            ) : (
              <table className="w-full zebra-table border-collapse">
                <thead className="sticky top-0 bg-surface-container-low z-10 shadow-sm shadow-outline-variant/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Asset name</th>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Type</th>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Rows</th>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Quality</th>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Ingested</th>
                    <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-main divide-y border-precision divide-outline-variant/30">
                  {filtered.map((asset) => {
                    const quality = asset.metadata?.qualityScore;
                    const statusLabel = quality !== undefined
                      ? quality >= 95 ? 'Passed' : quality >= 85 ? 'Warning' : 'Failed'
                      : 'Pending';
                    return (
                      <tr key={asset.datasetId} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {fileIcon(asset.fileType)}
                            <span className="font-medium text-on-surface text-xs">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant uppercase font-mono">{asset.fileType}</td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant">{asset.rowCount ?? '—'}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold">
                          {quality !== undefined ? (
                            <span className={quality >= 95 ? 'text-green-600' : quality >= 85 ? 'text-orange-500' : 'text-error'}>
                              {quality.toFixed(1)}%
                            </span>
                          ) : <span className="text-outline">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant">{timeAgo(asset.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          {statusLabel === 'Passed' && <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase">Active</span>}
                          {statusLabel === 'Warning' && <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold uppercase">Warning</span>}
                          {statusLabel === 'Failed' && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase">Review</span>}
                          {statusLabel === 'Pending' && <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">Pending</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column — Data Lineage */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding h-[480px] overflow-auto custom-scrollbar flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-section-header text-section-header">Data lineage summary</h3>
            <Network className="text-primary w-5 h-5" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : lineage.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Network className="w-10 h-10 text-outline-variant/50 mb-2" />
              <p className="text-xs text-on-surface-variant">No lineage data yet. Ingest datasets to track data flow.</p>
            </div>
          ) : (
            lineage.slice(0, 8).map((item) => (
              <div key={item.datasetId} className="p-3 border border-precision border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer group bg-surface-container-lowest">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{item.name}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono truncate">
                      Ingestion → {item.transformations.join(' → ')} → {item.sink}
                    </p>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ml-2 shrink-0',
                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      item.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                        'bg-surface-container-high text-on-surface-variant'
                  )}>
                    {item.status === 'COMPLETED' ? 'Active' : item.status === 'FAILED' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Governance Health — Live from DB */}
      <div className="mt-stack_gap_md bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-section-header text-section-header">Governance health</h3>
          <span className="text-[10px] text-on-surface-variant font-medium">Computed from live database state</span>
        </div>
        {loading || !compliance ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : compliance.datasetCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="w-10 h-10 text-outline-variant/50 mb-2" />
            <p className="text-sm font-bold text-on-surface mb-1">No data to compute governance health</p>
            <p className="text-xs text-on-surface-variant">Ingest datasets to start tracking governance metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HealthMetric
              title="Policy coverage"
              value={`${compliance.policyCoverage}%`}
              percent={compliance.policyCoverage}
              subtext={`${compliance.policyCount} active policies · ${compliance.datasetCount} datasets`}
              barColor="bg-primary"
            />
            <HealthMetric
              title="Retention compliance"
              value={`${compliance.retentionCompliance}%`}
              percent={compliance.retentionCompliance}
              subtext={`${compliance.analysisCount} analyses completed`}
              barColor="bg-green-600"
              valueColor="text-green-600"
            />
            <HealthMetric
              title="Catalog completeness"
              value={`${compliance.catalogCompleteness}%`}
              percent={compliance.catalogCompleteness}
              subtext={`${compliance.datasetCount} catalogued · ${compliance.alertCount} open alerts`}
              barColor="bg-amber-500"
              valueColor="text-amber-500"
            />
          </div>
        )}
      </div>

      {/* Active Policies */}
      {policies.length > 0 && (
        <div className="mt-stack_gap_md bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-section-header text-section-header">Active governance policies</h3>
            <span className="text-[10px] text-on-surface-variant font-medium">{policies.length} configured</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policies.map(policy => (
              <div key={policy.id} className="flex items-center gap-3 p-3 border border-precision border-outline-variant rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{policy.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{policy.framework} · v{policy.policyVersion}</p>
                </div>
                <span className="text-[9px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-precision border-outline-variant w-full max-w-[460px] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-precision border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="text-section-header font-bold text-on-surface">New Governance Rule</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Define a compliance policy for your data assets</p>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Policy Name</label>
                <input
                  type="text"
                  required
                  value={policyName}
                  onChange={e => setPolicyName(e.target.value)}
                  placeholder="e.g. PII Data Retention Policy"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Framework</label>
                <select
                  value={policyFramework}
                  onChange={e => setPolicyFramework(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none appearance-none"
                >
                  <option>ISO 27001</option>
                  <option>PDPB 2023</option>
                  <option>GDPR</option>
                  <option>SOC 2</option>
                  <option>MeitY Guidelines</option>
                  <option>NITI Aayog Standards</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPolicyModal(false)} className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-surface-container-high">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowPolicyModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group z-50"
      >
        <Plus className="w-7 h-7" />
        <span className="absolute right-16 bg-on-surface text-surface text-[11px] px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md">
          New Governance Rule
        </span>
      </button>
    </div>
  );
}

function HealthMetric({ title, value, percent, subtext, barColor, valueColor }: any) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-body-main font-medium">{title}</span>
        <span className={cn('text-body-main font-bold', valueColor || 'text-primary')}>{value}</span>
      </div>
      <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', barColor)} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[10px] text-outline mt-2 uppercase tracking-wide font-medium">{subtext}</p>
    </div>
  );
}
