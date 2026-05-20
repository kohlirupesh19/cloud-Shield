import { Database, ShieldCheck, AlertTriangle, FileCheck, TrendingUp, Info, Zap, FileOutput, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
  return (
    <div className="p-container-margin max-w-[1400px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-metric-display font-medium text-on-surface tracking-tight">Governance Dashboard</h1>
          <p className="text-body-main text-on-surface-variant mt-1">Real-time oversight of national data integrity assets.</p>
        </div>
        <div className="text-label-caps text-outline uppercase tracking-widest">
          Last updated: 14:02 PM IST
        </div>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack_gap_md">
        <MetricCard 
          title="Total datasets monitored" 
          value="1,284" 
          icon={<Database className="text-primary w-5 h-5" />}
          trend="12 new this week"
          trendUp
        />
        <MetricCard 
          title="Quality score" 
          value="87.4%" 
          icon={<ShieldCheck className="text-secondary w-5 h-5" />}
          progress={87.4}
        />
        <MetricCard 
          title="Open security alerts" 
          value="23" 
          icon={<AlertTriangle className="text-error w-5 h-5" />}
          trend="4 Critical priority"
          trendDanger
          valueDanger
        />
        <MetricCard 
          title="Compliance status" 
          value="94.1%" 
          icon={<FileCheck className="text-tertiary w-5 h-5" />}
          subtext="GDPR, MeitY Guidelines"
        />
      </div>

      {/* Middle Section: Activity & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-stack_gap_md">
        
        {/* Recent Activity (60%) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="px-card-padding py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
            <h2 className="text-section-header font-medium text-on-surface">Recent audit activity</h2>
            <button className="text-label-caps text-primary font-medium hover:underline">View all logs</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse zebra-table">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Dataset</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Department</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Issue type</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-center">Severity</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y border-precision divide-outline-variant/30">
                <ActivityRow dataset="NH-Schema_V2" dept="Healthcare" issue="Null Violation" severity="CRITICAL" time="2m ago" />
                <ActivityRow dataset="UIDAI_Auth_Log" dept="Identification" issue="Access Spike" severity="WARNING" time="14m ago" />
                <ActivityRow dataset="Railway_Sched_P0" dept="Transport" issue="Sync Completed" severity="PASSED" time="1h ago" />
                <ActivityRow dataset="Agri_Yield_2024" dept="Agriculture" issue="Schema Drift" severity="WARNING" time="3h ago" />
                <ActivityRow dataset="Tax_Return_Enc" dept="Finance" issue="Integrity Check" severity="PASSED" time="5h ago" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts by Module (40%) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col">
          <div className="mb-8">
            <h2 className="text-section-header font-medium text-on-surface">Alerts by module</h2>
            <p className="text-label-caps text-on-surface-variant mt-1">Cross-domain incident distribution</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
            <ProgressBar label="Data Quality" count="142" percent={65} colorClass="bg-primary" />
            <ProgressBar label="Security" count="89" percent={42} colorClass="bg-error" />
            <ProgressBar label="Governance" count="54" percent={25} colorClass="bg-tertiary" />
          </div>

          <div className="mt-8 pt-4 border-t border-precision border-outline-variant text-[12px] text-on-surface-variant flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Aggregated from all active monitoring clusters.
          </div>
        </div>
      </div>

      {/* Bottom: Quick Actions */}
      <div className="pt-4 flex flex-col gap-4">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Administrative Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center px-6 py-2 rounded-lg bg-surface-container-lowest border border-precision border-outline-variant text-on-surface font-section-header hover:bg-surface-container-low transition-colors active:scale-95">
            <Zap className="mr-2 w-5 h-5" />
            Run audit now
          </button>
          <button className="flex items-center px-6 py-2 rounded-lg bg-surface-container-lowest border border-precision border-outline-variant text-on-surface font-section-header hover:bg-surface-container-low transition-colors active:scale-95">
            <FileOutput className="mr-2 w-5 h-5" />
            Export report
          </button>
          <button className="flex items-center px-6 py-2 rounded-lg bg-surface-container-lowest border border-precision border-outline-variant text-on-surface font-section-header hover:bg-surface-container-low transition-colors active:scale-95">
            <PlusCircle className="mr-2 w-5 h-5" />
            Add data source
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, icon, trend, trendUp, trendDanger, progress, subtext, valueDanger }: any) {
  return (
    <div className="bg-surface-container-lowest border border-precision border-outline-variant p-card-padding rounded-xl hover:border-primary-container transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="text-label-caps text-on-surface-variant uppercase">{title}</span>
        {icon}
      </div>
      <div className={cn("text-metric-display font-medium", valueDanger ? "text-error" : "text-primary")}>
        {value}
      </div>
      
      {trend && (
        <div className={cn("mt-2 flex items-center text-[12px] font-medium", trendDanger ? "text-error" : "text-green-600")}>
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
        <div className="mt-2 flex items-center text-[12px] text-on-surface-variant">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ dataset, dept, issue, severity, time }: any) {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors">
      <td className="px-card-padding py-4 text-body-main font-medium text-on-surface">{dataset}</td>
      <td className="px-card-padding py-4 text-body-main text-on-surface-variant">{dept}</td>
      <td className="px-card-padding py-4 text-body-main text-on-surface-variant">{issue}</td>
      <td className="px-card-padding py-4 text-center">
        <SeverityBadge severity={severity} />
      </td>
      <td className="px-card-padding py-4 text-body-main text-right text-on-surface-variant">{time}</td>
    </tr>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error/10 text-error uppercase tracking-wider">Critical</span>;
  if (severity === 'WARNING') return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">Warning</span>;
  if (severity === 'PASSED') return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Passed</span>;
  return null;
}

function ProgressBar({ label, count, percent, colorClass }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-body-main font-medium text-on-surface">{label}</span>
        <span className="text-label-caps font-bold">{count}</span>
      </div>
      <div className="h-8 w-full bg-surface-container rounded-lg overflow-hidden flex">
        <div className={cn("h-full transition-all duration-1000", colorClass)} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
