import { ShieldPlus, Users, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, ShieldAlert, ServerOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export function SecurityAccess() {
  return (
    <div className="p-container-margin max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="flex items-center gap-2 text-label-caps text-on-surface-variant opacity-60 mb-1 font-medium">
            <Link to="/" className="hover:underline">GOVERNANCE</Link>
            <span>/</span>
            <span>SECURITY</span>
          </nav>
          <h2 className="text-metric-display font-medium text-primary tracking-tight">Security & access</h2>
        </div>
        <button className="h-9 px-6 bg-primary text-on-primary rounded-lg font-section-header hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm">
          <ShieldPlus className="w-5 h-5" />
          Add access rule
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack_gap_md mb-8">
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-2 font-medium">Active users with access</p>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-display font-bold">148</span>
              <span className="text-green-600 text-[12px] flex items-center font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +12%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center">
            <Users className="text-on-secondary-fixed-variant fill-on-secondary-fixed-variant/10 w-6 h-6" />
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-2 font-medium">Anomalies detected this week</p>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-display font-bold">7</span>
              <span className="text-error text-[12px] flex items-center font-medium">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Alert
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-error-container rounded-lg flex items-center justify-center">
            <TrendingUp className="text-on-error-container w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-precision border-outline-variant mb-6">
        <div className="flex gap-8">
          <button className="pb-3 text-section-header font-medium border-b-2 border-primary text-primary transition-all">Access log</button>
          <button className="pb-3 text-section-header font-medium border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all">User roles</button>
          <button className="pb-3 text-section-header font-medium border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-2">
            Anomaly alerts
            <span className="w-5 h-5 bg-error text-white text-[10px] rounded-full flex items-center justify-center font-bold">2</span>
          </button>
        </div>
      </div>

      {/* Access Log Table */}
      <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden mb-12 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">User</th>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">Department</th>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">Dataset accessed</th>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">Action</th>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">Time</th>
                <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium">Risk level</th>
              </tr>
            </thead>
            <tbody className="divide-y border-precision divide-outline-variant/50">
              <LogRow user="Rajesh Kumar" dept="Ministry of Finance" dataset="FIN-AUDIT-2023-Q4" action="READ_EXPORT" time="10:42:15 AM" risk="LOW" />
              <LogRow user="Ananya Sharma" dept="Healthcare Dept" dataset="PATIENT-RECORDS-MH" action="QUERY_FULL" time="10:38:02 AM" risk="MEDIUM" />
              <LogRow user="Suresh V." dept="Infrastructure" dataset="ROAD-NET-DELHI" action="UPDATE_ENTRY" time="10:15:44 AM" risk="LOW" />
              <LogRow user="Admin_System_Bot" dept="IT Operations" dataset="SYS-LOGS-CLUSTER-1" action="DELETE_RECURSIVE" time="09:55:12 AM" risk="HIGH" actionDanger />
              <LogRow user="Priya Iyer" dept="Direct Taxes" dataset="PAN-VERIFY-SRV" action="API_CALL" time="09:30:22 AM" risk="LOW" />
              <LogRow user="Vikram Singh" dept="Remote Sensing" dataset="SATELLITE-IMG-L2" action="READ_EXPORT" time="09:12:00 AM" risk="MEDIUM" />
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center text-label-caps text-on-surface-variant border-top border-precision border-outline-variant">
          <span>Showing 6 of 1,284 events</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 border border-precision border-outline-variant rounded flex items-center justify-center hover:bg-white bg-surface-container-lowest transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 border border-precision border-outline-variant rounded flex items-center justify-center hover:bg-white bg-surface-container-lowest transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Anomaly Alerts Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-error w-6 h-6 fill-error/20" />
          <h3 className="text-section-header font-medium">Anomaly alerts</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack_gap_md">
          <AlertCard 
            icon={<ShieldAlert className="text-error w-5 h-5" />}
            title="Multiple failed login attempts" 
            time="2 minutes ago"
            description={
              <>Account <span className="font-mono text-primary bg-secondary-fixed/50 px-1 py-0.5 rounded text-[11px]">USR-6621</span> attempted to log in 12 times from a restricted IP range (Bangalore, KA).</>
            }
          />
          <AlertCard 
            icon={<ServerOff className="text-error w-5 h-5" />}
            title="Unusual data export volume" 
            time="45 minutes ago"
            description={
              <>Department <span className="font-mono text-primary bg-secondary-fixed/50 px-1 py-0.5 rounded text-[11px]">HEALTH-MH</span> exceeded daily export limit by 450%. Potential data breach or misconfiguration.</>
            }
          />
        </div>
      </section>
    </div>
  );
}

function LogRow({ user, dept, dataset, action, time, risk, actionDanger }: any) {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors group">
      <td className="px-6 py-4 text-body-main font-medium">{user}</td>
      <td className="px-6 py-4 text-body-main text-on-surface-variant">{dept}</td>
      <td className="px-6 py-4 text-body-main font-mono text-[11px] font-medium">{dataset}</td>
      <td className={cn("px-6 py-4 text-body-main", actionDanger && "text-error font-medium")}>{action}</td>
      <td className="px-6 py-4 text-body-main text-on-surface-variant">{time}</td>
      <td className="px-6 py-4">
        {risk === 'LOW' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold tracking-wider">LOW</span>}
        {risk === 'MEDIUM' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold tracking-wider">MEDIUM</span>}
        {risk === 'HIGH' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold tracking-wider">HIGH</span>}
      </td>
    </tr>
  );
}

function AlertCard({ icon, title, time, description }: any) {
  return (
    <div className="bg-surface-container-lowest border border-precision border-outline-variant border-l-4 border-l-error rounded-lg p-card-padding flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-body-main font-bold">{title}</h4>
          <span className="text-[11px] text-on-surface-variant">{time}</span>
        </div>
        <p className="text-body-main text-on-surface-variant mb-4 leading-relaxed">
          {description}
        </p>
        <button className="h-[32px] px-4 border border-precision border-outline-variant bg-white text-on-surface rounded-lg font-medium text-[12px] hover:bg-surface-container-low transition-colors shadow-sm">
          Review Incident
        </button>
      </div>
    </div>
  );
}
