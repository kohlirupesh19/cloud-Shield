import React, { useEffect, useState, useCallback } from 'react';
import { Plus, BarChart2, FileBarChart, Shield, Scale, Download, X, Eye, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ReportItem {
  id: string;
  title: string;
  reportType: string;
  markdownContent: string;
  jsonPayload: any;
  createdAt: string;
}

interface AnalysisItem {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}

export function Reports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Report generation states
  const [showGenModal, setShowGenModal] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadReports = useCallback(() => {
    setLoading(true);
    apiFetch('/reports/summary')
      .then((res) => {
        setReports(res.data || []);
      })
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleOpenGenModal = async () => {
    setShowGenModal(true);
    setLoadingAnalyses(true);
    try {
      const res = await apiFetch('/analysis/history');
      // Only list completed analyses that do not already have reports
      const completedAnalyses = (res.data || []).filter(
        (a: AnalysisItem) => a.status === 'COMPLETED'
      );
      setAnalyses(completedAnalyses);
      if (completedAnalyses.length > 0) {
        setSelectedAnalysisId(completedAnalyses[0].id);
      }
    } catch (err) {
      console.error('Failed to load completed analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysisId) return;
    setGenerating(true);
    try {
      await apiFetch('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ analysisId: selectedAnalysisId }),
      });
      loadReports();
      setShowGenModal(false);
      setSelectedAnalysisId('');
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to parse and render raw markdown content beautifully
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} className="text-xl font-bold text-on-surface mt-6 mb-3 pb-2 border-b border-precision border-outline-variant">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-base font-bold text-on-surface mt-5 mb-2">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-sm font-bold text-on-surface mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-5 list-disc text-body-main text-on-surface-variant my-1">
            {line.slice(2)}
          </li>
        );
      }
      if (line.trim().length === 0) {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-body-main text-on-surface-variant my-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="p-container-margin max-w-5xl mx-auto min-h-screen pb-24 relative animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-metric-display font-medium text-on-surface tracking-tight">Reports</h2>
          <p className="text-body-main text-on-surface-variant mt-1">
            Manage and view your organization's compliance and governance audit reports.
          </p>
        </div>
        <button 
          onClick={handleOpenGenModal}
          className="h-9 px-4 bg-primary text-on-primary rounded-lg font-section-header flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm text-xs font-bold"
        >
          <Plus className="w-4 h-4 text-on-primary" strokeWidth={3} />
          Generate report
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack_gap_md">
          {reports.length > 0 ? (
            reports.map((report) => {
              let icon = <Scale className="w-7 h-7 text-primary fill-primary/10" />;
              let iconBg = "bg-primary/5";
              if (report.reportType === 'QUALITY') {
                icon = <FileBarChart className="w-7 h-7 text-secondary fill-secondary/10" />;
                iconBg = "bg-secondary/5";
              } else if (report.reportType === 'SECURITY') {
                icon = <Shield className="w-7 h-7 text-tertiary fill-tertiary/10" />;
                iconBg = "bg-tertiary-container/10";
              }

              return (
                <ReportCard 
                  key={report.id}
                  title={report.title} 
                  lastRun={`Generated: ${new Date(report.createdAt).toLocaleDateString()} ${new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
                  size={report.reportType} 
                  icon={icon} 
                  iconBg={iconBg} 
                  onView={() => setSelectedReport(report)}
                />
              );
            })
          ) : (
            <div className="md:col-span-2 bg-surface-container-lowest border border-precision border-outline-variant p-16 rounded-xl text-center shadow-sm">
              <Scale className="w-12 h-12 text-outline-variant/50 mx-auto mb-3" />
              <h4 className="font-bold text-on-surface text-sm">No reports generated yet</h4>
              <p className="text-xs text-on-surface-variant max-w-[280px] mx-auto mt-1">
                Upload a dataset or trigger a behavioral security scan to generate dynamic audit reports.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="mt-12 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-card-padding py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
          <h3 className="font-section-header text-section-header text-on-surface font-medium">Recent Generation Log</h3>
          <span className="text-label-caps text-on-surface-variant bg-surface-container-low px-2 py-1 rounded tracking-wide text-[10px] font-bold">
            Live database state
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-card-padding py-3 font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] font-semibold">Report Name</th>
                <th className="px-card-padding py-3 font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] font-semibold">Type</th>
                <th className="px-card-padding py-3 font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] font-semibold">Status</th>
                <th className="px-card-padding py-3 font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px] font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="text-body-main divide-y border-precision divide-outline-variant/30">
              {reports.length > 0 ? reports.slice(0, 5).map((item) => (
                <LogEntry 
                  key={item.id} 
                  name={item.title} 
                  user={item.reportType} 
                  status="Success" 
                  time={new Date(item.createdAt).toLocaleDateString() + ' ' + new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                />
              )) : (
                <tr>
                  <td colSpan={4} className="px-card-padding py-8 text-center text-xs text-on-surface-variant">
                    No log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-precision border-outline-variant w-full max-w-[700px] max-h-[85vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
              <div>
                <h3 className="text-section-header font-bold text-on-surface">{selectedReport.title}</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5 font-semibold uppercase">
                  {selectedReport.reportType} REPORT · ID: {selectedReport.id.slice(-8)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-xs">
              {renderMarkdown(selectedReport.markdownContent)}
            </div>

            <div className="px-6 py-4 border-t border-precision border-outline-variant flex justify-end bg-surface-container-low/30">
              <button 
                onClick={() => setSelectedReport(null)}
                className="h-9 px-6 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-precision border-outline-variant w-full max-w-[480px] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
              <div>
                <h3 className="text-section-header font-bold text-on-surface">Generate dynamic report</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Select a completed analysis to generate an audit report.</p>
              </div>
              <button 
                onClick={() => setShowGenModal(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="p-6 space-y-4">
              {loadingAnalyses ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No completed scans found without a report. Ingest or scan a dataset first.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Select scan run</label>
                  <select
                    value={selectedAnalysisId}
                    onChange={(e) => setSelectedAnalysisId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    {analyses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.type} Ingest Scan · Run ID: {a.id.slice(-6)} ({new Date(a.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="flex-1 bg-surface-container-low text-on-surface hover:bg-surface-container-high py-2.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || analyses.length === 0}
                  className="flex-1 bg-primary text-on-primary hover:opacity-90 py-2.5 rounded-lg text-xs font-bold transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Audit...</span>
                    </>
                  ) : (
                    <span>Generate Now</span>
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

interface ReportCardProps {
  key?: any;
  title: string;
  lastRun: string;
  size: string;
  icon: React.ReactNode;
  iconBg: string;
  onView: () => void;
}

function ReportCard({ title, lastRun, size, icon, iconBg, onView }: ReportCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between group hover:border-primary/30 transition-all duration-300 shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="px-2.5 py-0.5 bg-surface-container rounded text-label-caps font-label-caps text-on-surface-variant tracking-wide font-bold text-[9px]">
          {size}
        </span>
      </div>
      <div className="relative z-10">
        <h3 className="text-section-header font-medium text-on-surface text-xs font-semibold">{title}</h3>
        <p className="text-body-main text-on-surface-variant mt-1 text-[11px]">{lastRun}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-precision border-outline-variant/30 flex justify-end relative z-10">
        <button 
          onClick={onView}
          className="h-9 px-4 bg-white border border-precision border-outline-variant text-on-surface rounded-lg font-body-main text-body-main flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-semibold"
        >
          <Eye className="w-4 h-4 text-on-surface-variant" />
          View Report Audit
        </button>
      </div>
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}

function LogEntry({ name, user, status, time }: any) {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors">
      <td className="px-card-padding py-4 font-medium text-on-surface text-xs">{name}</td>
      <td className="px-card-padding py-4 text-on-surface-variant text-xs">{user}</td>
      <td className="px-card-padding py-4">
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Success</span>
      </td>
      <td className="px-card-padding py-4 text-on-surface-variant text-xs">{time}</td>
    </tr>
  );
}
