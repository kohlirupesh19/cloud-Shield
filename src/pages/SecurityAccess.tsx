import { ShieldPlus, Users, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, ShieldAlert, ServerOff, Loader2, X, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface IncidentItem {
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

export function SecurityAccess() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [alerts, setAlerts] = useState<IncidentItem[]>([]);
  const [stats, setStats] = useState<{ total: number; critical: number; high: number; medium: number; resolved: number; activeUsers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'access' | 'alerts'>('access');

  // Form parameters
  const [user, setUser] = useState('');
  const [department, setDepartment] = useState('');
  const [dataset, setDataset] = useState('');
  const [action, setAction] = useState('READ_EXPORT');
  const [hour, setHour] = useState('12');
  const [bytes, setBytes] = useState('50000');
  const [failedLogins, setFailedLogins] = useState('0');
  const [ipAddress, setIpAddress] = useState('192.168.1.52');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSecurityData = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/security/incidents'),
      apiFetch('/security/alerts'),
      apiFetch('/security/stats'),
    ])
      .then(([incRes, alRes, statsRes]) => {
        setIncidents(incRes.data);
        setAlerts(alRes.data);
        setStats(statsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load security incidents:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const handleQuickAlertFill = (type: 'brute' | 'normal') => {
    if (type === 'brute') {
      setUser('Ananya Sharma');
      setDepartment('Healthcare Dept');
      setDataset('PATIENT-RECORDS-MH');
      setAction('QUERY_FULL');
      setHour('2'); // Late night
      setBytes('8500000'); // Massive bytes
      setFailedLogins('12'); // Extreme failed logins
      setIpAddress('185.220.101.4'); // TOR IP
    } else {
      setUser('Suresh V.');
      setDepartment('Infrastructure');
      setDataset('ROAD-NET-DELHI');
      setAction('READ_EXPORT');
      setHour('14'); // Midday
      setBytes('35000'); // Low volume
      setFailedLogins('0'); // Clean
      setIpAddress('192.168.1.92');
    }
  };

  const handleAddRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        logs: [
          {
            user,
            department,
            dataset,
            action,
            hour: Number(hour),
            bytes: Number(bytes),
            failed_logins: Number(failedLogins),
            ip: ipAddress
          }
        ]
      };

      await apiFetch('/security/log-access', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Refresh security data and close modal
      loadSecurityData();
      setShowAddRuleModal(false);

      // Reset
      setUser('');
      setDepartment('');
      setDataset('');
      setHour('12');
      setBytes('50000');
      setFailedLogins('0');
      setIpAddress('192.168.1.52');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit access log check.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeUsersCount = stats?.activeUsers ?? 0;
  const trendPercent = Math.max(4, Math.min(24, activeUsersCount * 4));

  const activeAnomaliesCount = alerts.length;
  const accessLogCount = incidents.length;

  return (
    <div className="p-container-margin max-w-6xl mx-auto pb-12">
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
        <button 
          onClick={() => setShowAddRuleModal(true)}
          className="h-9 px-6 bg-primary text-on-primary rounded-lg font-section-header hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm text-xs font-bold"
        >
          <ShieldPlus className="w-5 h-5" />
          Add access rule
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack_gap_md mb-8">
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-2 font-semibold text-[10px]">Active users with access</p>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-display font-bold text-[32px] tracking-tight">{activeUsersCount}</span>
              <span className="text-green-600 text-[11px] flex items-center font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +{trendPercent}%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center">
            <Users className="text-on-secondary-fixed-variant fill-on-secondary-fixed-variant/10 w-6 h-6" />
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-2 font-semibold text-[10px]">Anomalies detected this week</p>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-display font-bold text-[32px] tracking-tight">{activeAnomaliesCount}</span>
              <span className={cn("text-[11px] flex items-center font-bold", activeAnomaliesCount > 0 ? "text-error" : "text-green-600")}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {activeAnomaliesCount > 0 ? 'Alert active' : 'Clean'}
              </span>
            </div>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", activeAnomaliesCount > 0 ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-700")}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-precision border-outline-variant mb-6">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={cn(
              'pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'access'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Access log
            <span className={cn('min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold', activeTab === 'access' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant')}>
              {accessLogCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={cn(
              'pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'alerts'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Anomaly alerts
            {activeAnomaliesCount > 0 && (
              <span className="w-5 h-5 bg-error text-white text-[10px] rounded-full flex items-center justify-center font-bold">{activeAnomaliesCount}</span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'access' ? (
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden mb-12 shadow-sm min-h-75">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <ShieldCheck className="w-12 h-12 text-outline-variant/60 mb-2" />
              <h4 className="text-body-main font-bold">No access events logged</h4>
              <p className="text-xs text-on-surface-variant max-w-70 mt-1">Submit an access rule form to trigger DBSCAN behavior clustering checks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse zebra-table">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">User</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">Department</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">Dataset accessed</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">Action</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">Time</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant font-medium text-[11px]">Risk level</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-precision divide-outline-variant/50">
                  {incidents.map((inc) => {
                    const uName = inc.eventPayload.user || 'Unknown User';
                    const deptName = inc.eventPayload.department || 'Finance';
                    const dsName = inc.eventPayload.dataset || 'FIN-AUDIT';
                    const actionStr = inc.eventPayload.action || 'ACCESS';
                    const timeText = new Date(inc.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    return (
                      <LogRow 
                        key={inc.id}
                        user={uName} 
                        dept={deptName} 
                        dataset={dsName} 
                        action={actionStr} 
                        time={timeText} 
                        risk={inc.severity} 
                        actionDanger={inc.severity === 'CRITICAL' || inc.severity === 'HIGH'} 
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <section className="space-y-4 mb-12">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-error w-6 h-6 fill-error/20" />
            <h3 className="text-section-header font-bold">Anomaly alerts</h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-surface-container-lowest border border-precision border-outline-variant p-6 rounded-xl text-center text-xs text-on-surface-variant shadow-sm">
              No unresolved anomalies detected yet. Submit the high-threat access template or upload a suspicious access batch to populate live alerts.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack_gap_md">
              {alerts.map((al) => {
                const uName = al.eventPayload.user || 'User';
                const ip = al.source;
                const ds = al.eventPayload.dataset || 'Dataset';
                const hour = al.eventPayload.hour || 12;
                const fails = al.eventPayload.failed_logins || 0;
                const isBrute = fails > 3;

                const icon = <ShieldAlert className="text-error w-5 h-5" />;
                const title = isBrute ? 'Failed login brute attempt' : 'Suspicious late night data transfer';
                const desc = isBrute ? (
                  <>User <span className="font-mono text-primary bg-secondary-fixed/50 px-1 py-0.5 rounded text-[11px]">{uName}</span> failed to login {fails} times from restricted IP range ({ip}).</>
                ) : (
                  <>User <span className="font-mono text-primary bg-secondary-fixed/50 px-1 py-0.5 rounded text-[11px]">{uName}</span> initiated a massive transfer of {Math.round((al.eventPayload.bytes || 0) / 1000000)} MB from dataset {ds} at hour {hour} AM.</>
                );

                return (
                  <AlertCard 
                    key={al.id}
                    icon={icon}
                    title={title}
                    time="Detected now"
                    description={desc}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Add Access Rule Modal (Premium Form) */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-precision border-outline-variant w-full max-w-140 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
              <div>
                <h3 className="text-section-header font-bold text-on-surface">Simulate system access log</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Ingest new logins to run DBSCAN outlier clustering scans.</p>
              </div>
              <button 
                onClick={() => setShowAddRuleModal(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRuleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-error/10 text-error border border-error/20 rounded-lg text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Instant Verification Quick Fills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block">Quick-fill threat testing templates</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickAlertFill('brute')}
                    className="flex-1 text-xs py-1.5 px-3 border border-error/30 bg-error/5 text-error rounded-lg hover:bg-error/10 transition-colors font-bold text-center"
                  >
                    High Threat: 12 failed logins (TOR)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAlertFill('normal')}
                    className="flex-1 text-xs py-1.5 px-3 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-bold text-center"
                  >
                    Clean Access: Midday read event
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">User identity</label>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
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
                    placeholder="e.g. Direct Taxes"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Target Dataset</label>
                  <input
                    type="text"
                    required
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    placeholder="e.g. PATIENT-RECORDS-MH"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Action type</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none appearance-none"
                  >
                    <option value="READ_EXPORT">READ_EXPORT</option>
                    <option value="QUERY_FULL">QUERY_FULL</option>
                    <option value="DELETE_RECURSIVE">DELETE_RECURSIVE</option>
                    <option value="API_CALL">API_CALL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Hour of access</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    required
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Bytes Transferred</label>
                  <input
                    type="number"
                    required
                    value={bytes}
                    onChange={(e) => setBytes(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Failed Logins</label>
                  <input
                    type="number"
                    required
                    value={failedLogins}
                    onChange={(e) => setFailedLogins(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Request IP address</label>
                <input
                  type="text"
                  required
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 192.168.1.52"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
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
                      <span>Running DBSCAN clustering...</span>
                    </>
                  ) : (
                    <span>Check & Log Event</span>
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

function LogRow({ user, dept, dataset, action, time, risk, actionDanger }: any) {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors group">
      <td className="px-6 py-4 text-xs font-bold text-on-surface">{user}</td>
      <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">{dept}</td>
      <td className="px-6 py-4">
        <span className="inline-flex px-1.5 py-0.5 text-xs font-mono text-[10px] text-primary bg-primary/5 rounded font-bold">{dataset}</span>
      </td>
      <td className={cn("px-6 py-4 text-xs font-medium text-on-surface-variant", actionDanger && "text-error font-semibold")}>{action}</td>
      <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">{time}</td>
      <td className="px-6 py-4">
        {risk === 'LOW' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold tracking-wide uppercase">LOW</span>}
        {risk === 'MEDIUM' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold tracking-wide uppercase">MEDIUM</span>}
        {risk === 'HIGH' && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold tracking-wide uppercase">HIGH</span>}
        {risk === 'CRITICAL' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold tracking-wide uppercase">CRITICAL</span>}
      </td>
    </tr>
  );
}

function AlertCard({ icon, title, time, description }: any) {
  return (
    <div className="bg-surface-container-lowest border border-precision border-outline-variant border-l-4 border-l-error rounded-xl p-card-padding flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-bold text-on-surface">{title}</h4>
          <span className="text-[10px] text-on-surface-variant font-bold">{time}</span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {description}
        </p>
        <div className="text-[10px] text-error font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Outlier behavioral pattern marked by DBSCAN behavioral analysis
        </div>
      </div>
    </div>
  );
}
