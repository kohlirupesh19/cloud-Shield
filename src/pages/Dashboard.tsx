import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, AlertTriangle, FileCheck, TrendingUp, Info, Zap, FileOutput, PlusCircle, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface DashboardMetrics {
  totalDatasets: number;
  qualityScore: number;
  openSecurityAlerts: number;
  complianceScore: number;
  activeFrameworks?: string[];
  riskSummary: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  riskScore: number;
  summary: string;
  dataset?: {
    name: string;
  };
}

// Sample Templates for Instant ML Verification
const SAMPLE_TEMPLATES = [
  {
    name: "Clean Aadhaar Audit Logs",
    dept: "UIDAI",
    type: "json",
    data: JSON.stringify(
      Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        age: 22 + (i % 28),
        income: 48000 + i * 1200,
        dependents: i % 3,
        score: 85 + (i % 10)
      })),
      null,
      2
    )
  },
  {
    name: "Anomalous PM-Kisan List (Drift/Duplicates)",
    dept: "Agriculture",
    type: "json",
    data: JSON.stringify(
      Array.from({ length: 25 }, (_, i) => {
        const isNull = i % 5 === 0;
        const isDuplicate = i > 20;
        const idx = isDuplicate ? 2 : i;
        return {
          id: idx + 1,
          age: isNull ? null : (20 + (idx % 25)),
          income: isNull ? null : (28000 + idx * 750),
          dependents: idx % 4,
          score: isNull ? null : (55 + (idx % 20))
        };
      }),
      null,
      2
    )
  }
];

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDatasets: 0,
    qualityScore: 0,
    openSecurityAlerts: 0,
    complianceScore: 0,
    activeFrameworks: [],
    riskSummary: { low: 0, medium: 0, high: 0, critical: 0 }
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [datasetName, setDatasetName] = useState('');
  const [department, setDepartment] = useState('');
  const [fileType, setFileType] = useState('json');
  const [pasteData, setPasteData] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadInsights, setUploadInsights] = useState<null | {
    analysisId?: string;
    reportId?: string;
    qualityScore?: number;
    anomalyScore?: number;
    issues?: string[];
    recommendations?: string[];
  }>(null);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/dashboard/metrics'),
      apiFetch('/dashboard/recent-analyses')
    ])
      .then(([metricsRes, activitiesRes]) => {
        setMetrics(metricsRes.data);
        setActivities(activitiesRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard metrics:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSelectTemplate = (tpl: typeof SAMPLE_TEMPLATES[0]) => {
    setDatasetName(tpl.name);
    setDepartment(tpl.dept);
    setFileType(tpl.type);
    setPasteData(tpl.data);
    setSelectedFile(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      let fileToSend: Blob;
      let filename = datasetName || 'dataset';

      if (selectedFile) {
        fileToSend = selectedFile;
        filename = selectedFile.name;
      } else if (pasteData.trim()) {
        const ext = fileType === 'csv' ? 'csv' : 'json';
        if (!filename.toLowerCase().endsWith(`.${ext}`)) {
          filename = `${filename}.${ext}`;
        }
        fileToSend = new Blob([pasteData], { type: fileType === 'csv' ? 'text/csv' : 'application/json' });
      } else {
        throw new Error('Please upload a file or paste sample rows to analyze.');
      }

      const formData = new FormData();
      formData.append('file', fileToSend, filename);
      formData.append('datasetName', datasetName);
      formData.append('department', department);

      const response = await apiFetch('/datasets/upload', {
        method: 'POST',
        body: formData
      });

      setUploadInsights(response.data?.insights || null);

      // Refresh dashboard metrics
      loadDashboardData();
      setShowUploadModal(false);
      
      // Reset form
      setDatasetName('');
      setDepartment('');
      setPasteData('');
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze and upload dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRiskCount = metrics.riskSummary.low + metrics.riskSummary.medium + metrics.riskSummary.high + metrics.riskSummary.critical;

  return (
    <div className="p-container-margin max-w-350 mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-metric-display font-medium text-on-surface tracking-tight">Governance Dashboard</h1>
          <p className="text-body-main text-on-surface-variant mt-1">Real-time oversight of national data integrity assets.</p>
        </div>
        <div className="text-label-caps text-outline uppercase tracking-widest text-[11px] font-medium">
          LIVE CLUSTERS CONNECTED
        </div>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack_gap_md">
        <MetricCard 
          title="Total datasets monitored" 
          value={String(metrics.totalDatasets)} 
          icon={<Database className="text-primary w-5 h-5" />}
          trend={`${metrics.totalDatasets > 0 ? 'Active' : 'No data'}`}
          trendUp={metrics.totalDatasets > 0}
        />
        <MetricCard 
          title="Quality score" 
          value={`${metrics.qualityScore}%`} 
          icon={<ShieldCheck className="text-secondary w-5 h-5" />}
          progress={metrics.qualityScore}
        />
        <MetricCard 
          title="Open security alerts" 
          value={String(metrics.openSecurityAlerts)} 
          icon={<AlertTriangle className="text-error w-5 h-5" />}
          trend={`${metrics.riskSummary.critical} Critical priority`}
          trendDanger={metrics.openSecurityAlerts > 0}
          valueDanger={metrics.openSecurityAlerts > 0}
        />
        <MetricCard 
          title="Compliance status" 
          value={`${metrics.complianceScore}%`} 
          icon={<FileCheck className="text-tertiary w-5 h-5" />}
          subtext={metrics.activeFrameworks && metrics.activeFrameworks.length > 0 ? metrics.activeFrameworks.join(', ') : "Connect compliance docs to surface framework scores"}
        />
      </div>

      {/* Middle Section: Activity & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-stack_gap_md">
        
        {/* Recent Activity (60%) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-95 shadow-sm">
          <div className="px-card-padding py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
            <h2 className="text-section-header font-medium text-on-surface">Recent audit activity</h2>
            <div className="text-xs text-on-surface-variant font-medium">ML pipeline feedback</div>
          </div>
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="h-full flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-outline-variant/60 mb-2" />
                <h4 className="text-body-main font-bold">All pipelines quiet</h4>
                <p className="text-xs text-on-surface-variant max-w-70 mt-1">Upload a dataset to run live Isolation Forest anomaly scans.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse zebra-table">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-[11px]">Dataset</th>
                    <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-[11px]">Analysis Type</th>
                    <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-[11px]">Status</th>
                    <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-center text-[11px]">Risk</th>
                    <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-right text-[11px]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-precision divide-outline-variant/30">
                  {activities.map((act) => {
                    const dsName = act.dataset?.name || 'Access Event Stream';
                    const scoreText = act.type === 'QUALITY' ? 'Outlier Ingest' : 'Access Cluster';
                    const severity = act.status === 'FAILED' ? 'FAILED' : act.riskScore > 0.6 ? 'CRITICAL' : act.riskScore > 0.2 ? 'WARNING' : 'PASSED';
                    const timeAgo = new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <ActivityRow 
                        key={act.id}
                        dataset={dsName} 
                        dept={scoreText} 
                        issue={act.type} 
                        severity={severity} 
                        time={timeAgo} 
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Alerts by Module (40%) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-section-header font-medium text-on-surface">Security anomaly risk spread</h2>
            <p className="text-label-caps text-on-surface-variant mt-1 text-[11px]">UEBA DBSCAN clustering logs</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-6 space-y-6">
            <ProgressBar 
              label="Critical threat alerts" 
              count={String(metrics.riskSummary.critical)} 
              percent={totalRiskCount > 0 ? (metrics.riskSummary.critical / totalRiskCount) * 100 : 0} 
              colorClass="bg-error" 
            />
            <ProgressBar 
              label="High security risks" 
              count={String(metrics.riskSummary.high)} 
              percent={totalRiskCount > 0 ? (metrics.riskSummary.high / totalRiskCount) * 100 : 0} 
              colorClass="bg-orange-500" 
            />
            <ProgressBar 
              label="Medium access warning" 
              count={String(metrics.riskSummary.medium)} 
              percent={totalRiskCount > 0 ? (metrics.riskSummary.medium / totalRiskCount) * 100 : 0} 
              colorClass="bg-yellow-500" 
            />
          </div>

          <div className="pt-4 border-t border-precision border-outline-variant text-[11px] text-on-surface-variant flex items-center">
            <Info className="w-4 h-4 mr-2 text-primary" />
            Unresolved events grouped dynamically by cluster density.
          </div>
        </div>
      </div>

      {/* Bottom: Quick Actions */}
      <div className="pt-4 flex flex-col gap-4">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[11px]">Administrative Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={loadDashboardData}
            className="flex items-center px-6 py-2 rounded-lg bg-surface-container-lowest border border-precision border-outline-variant text-on-surface font-section-header hover:bg-surface-container-low transition-colors active:scale-95 text-xs font-medium shadow-sm"
          >
            <Zap className="mr-2 w-4 h-4 text-primary" />
            Refresh metrics
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-6 py-2 rounded-lg bg-primary text-on-primary font-section-header hover:opacity-90 transition-opacity active:scale-95 text-xs font-semibold shadow-sm"
          >
            <PlusCircle className="mr-2 w-4 h-4 text-white" />
            Add data source
          </button>
        </div>

        {uploadInsights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm">
              <div className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Latest custom ingest</div>
              <div className="mt-2 text-section-header font-semibold text-on-surface">AI analysis complete</div>
              <div className="mt-1 text-xs text-on-surface-variant">Report ID: {uploadInsights.reportId || uploadInsights.analysisId || 'pending'}</div>
            </div>
            <MetricCard
              title="Latest quality score"
              value={`${uploadInsights.qualityScore ?? 0}%`}
              icon={<ShieldCheck className="text-secondary w-5 h-5" />}
              progress={uploadInsights.qualityScore ?? 0}
            />
            <MetricCard
              title="Latest anomaly score"
              value={`${((uploadInsights.anomalyScore ?? 0) * 100).toFixed(1)}%`}
              icon={<AlertTriangle className="text-error w-5 h-5" />}
              valueDanger={(uploadInsights.anomalyScore ?? 0) > 0.2}
            />
          </div>
        )}
      </div>

      {/* Add Data Source Modal (Premium Glassmorphic Dialog) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-precision border-outline-variant w-full max-w-155 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
              <div>
                <h3 className="text-section-header font-bold text-on-surface">Add dynamic data source</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Ingest new datasets to trigger live scikit-learn anomaly checking.</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-error/10 text-error border border-error/20 rounded-lg text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Instant Verification Templates */}
              <div>
                <span className="text-[11px] font-bold text-outline-variant uppercase tracking-wider block mb-2">Test with high-fidelity templates</span>
                <div className="flex gap-3">
                  {SAMPLE_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="flex-1 text-left p-3 border border-precision border-outline-variant rounded-xl hover:border-primary bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                    >
                      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        {tpl.name.split(' ')[0]}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{tpl.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Dataset Name</label>
                  <input
                    type="text"
                    required
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. Health_Records_MH"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Ministry of Health"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Row data input</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFileType('json')}
                      className={cn("px-2 py-0.5 text-[10px] font-bold rounded", fileType === 'json' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileType('csv')}
                      className={cn("px-2 py-0.5 text-[10px] font-bold rounded", fileType === 'csv' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <textarea
                  value={pasteData}
                  onChange={(e) => {
                    setPasteData(e.target.value);
                    setSelectedFile(null);
                  }}
                  placeholder={fileType === 'json' ? '[\n  { "age": 32, "income": 50000, "dependents": 2, "score": 88 }\n]' : 'age,income,dependents,score\n32,50000,2,88'}
                  className="w-full h-32 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 font-mono text-[11px] focus:ring-1 focus:ring-primary outline-none resize-none"
                />

                <div className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Or upload raw file:</span>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setDatasetName(e.target.files[0].name.split('.')[0]);
                        setPasteData('');
                      }
                    }}
                    className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-surface-container-high file:text-primary file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-surface-container-low text-on-surface hover:bg-surface-container-high py-2.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-on-primary hover:opacity-90 py-2.5 rounded-lg text-xs font-bold transition-opacity flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running Isolation Forest...</span>
                    </>
                  ) : (
                    <span>Analyze & Add Ingest</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, icon, trend, trendUp, trendDanger, progress, subtext, valueDanger }: any) {
  return (
    <div className="bg-surface-container-lowest border border-precision border-outline-variant p-card-padding rounded-xl hover:border-primary-container transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="text-label-caps text-on-surface-variant uppercase text-[10px] font-medium tracking-wider">{title}</span>
        {icon}
      </div>
      <div className={cn("text-metric-display font-medium text-[32px] tracking-tight", valueDanger ? "text-error" : "text-primary")}>
        {value}
      </div>
      
      {trend && (
        <div className={cn("mt-2 flex items-center text-[11px] font-medium", trendDanger ? "text-error" : "text-green-600")}>
          {trendUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : null}
          {!trendUp && trendDanger ? <AlertTriangle className="w-3.5 h-3.5 mr-1" /> : null}
          <span>{trend}</span>
        </div>
      )}
      
      {progress !== undefined && (
        <div className="w-full bg-surface-container mt-4 h-1.5 rounded-full overflow-hidden">
          <div className="bg-secondary h-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {subtext && (
        <div className="mt-2 flex items-center text-[11px] text-on-surface-variant">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ dataset, dept, issue, severity, time }: any) {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors">
      <td className="px-card-padding py-4 text-xs font-bold text-on-surface">{dataset}</td>
      <td className="px-card-padding py-4 text-xs text-on-surface-variant">{dept}</td>
      <td className="px-card-padding py-4 text-xs text-on-surface-variant font-medium">{issue}</td>
      <td className="px-card-padding py-4 text-center">
        <SeverityBadge severity={severity} />
      </td>
      <td className="px-card-padding py-4 text-xs text-right text-on-surface-variant font-medium">{time}</td>
    </tr>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error uppercase tracking-wide">Critical</span>;
  if (severity === 'WARNING') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wide">Warning</span>;
  if (severity === 'PASSED') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Passed</span>;
  if (severity === 'FAILED') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">Failed</span>;
  return null;
}

function ProgressBar({ label, count, percent, colorClass }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-on-surface">{label}</span>
        <span className="text-xs font-bold text-on-surface-variant">{count} open</span>
      </div>
      <div className="h-6 w-full bg-surface-container rounded-lg overflow-hidden flex">
        <div className={cn("h-full transition-all duration-1000", colorClass)} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
