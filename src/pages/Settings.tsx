import { Info, ChevronDown, History, Loader2, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

const AVAILABLE_FRAMEWORKS = ["PDPB 2023", "ISO 27001", "GDPR", "SOC 2"];

export function Settings() {
  const [orgName, setOrgName] = useState('');
  const [cloudRegion, setCloudRegion] = useState('ap-south-1 (Mumbai)');
  const [auditFrequency, setAuditFrequency] = useState('Daily');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('Warning & above');
  const [activeFrameworks, setActiveFrameworks] = useState<string[]>([]);
  const [retentionPeriod, setRetentionPeriod] = useState('365 days');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch('/settings')
      .then((res) => {
        const data = res.data;
        if (data) {
          setOrgName(data.orgName);
          setCloudRegion(data.cloudRegion);
          setAuditFrequency(data.auditFrequency);
          setEmailAlerts(data.emailAlerts);
          setSmsAlerts(data.smsAlerts);
          setAlertThreshold(data.alertThreshold);
          setActiveFrameworks(data.activeFrameworks || []);
          setRetentionPeriod(data.retentionPeriod);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const payload = {
        orgName,
        cloudRegion,
        auditFrequency,
        emailAlerts,
        smsAlerts,
        alertThreshold,
        activeFrameworks,
        retentionPeriod,
      };

      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (resetConfirmationText !== 'RESET') {
      return;
    }

    setResetting(true);
    setResetMessage('');

    try {
      const response = await apiFetch('/settings/reset-data', { method: 'POST' });
      const reset = response.data?.reset || {};
      setResetMessage(
        `Removed ${reset.datasets || 0} datasets, ${reset.analyses || 0} analyses, ${reset.reports || 0} reports, and ${reset.filesRemoved || 0} files.` +
        (reset.aiEngineReset ? '' : ' AI engine reset could not be confirmed.')
      );
      setTimeout(() => setResetMessage(''), 6000);
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to reset organization data.');
    } finally {
      setResetting(false);
      setShowResetDialog(false);
      setResetConfirmationText('');
    }
  };

  const handleFrameworkChange = (framework: string, checked: boolean) => {
    if (checked) {
      setActiveFrameworks((prev) => [...prev, framework]);
    } else {
      setActiveFrameworks((prev) => prev.filter((f) => f !== framework));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-container-margin max-w-4xl mx-auto min-h-screen pb-24 relative animate-in fade-in duration-300">
      <header className="mb-8">
        <h2 className="text-title-lg font-bold text-on-surface tracking-tight">Settings</h2>
        <p className="text-body-main text-outline mt-1">Configure platform parameters and compliance frameworks.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings Section */}
        <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm">
          <div className="flex border-b border-precision border-outline-variant pb-4 mb-6">
            <div className="w-[40%]">
              <h3 className="font-section-header text-section-header text-on-surface font-medium">General</h3>
              <p className="text-label-caps text-outline mt-1">Core administrative identity</p>
            </div>
            <div className="w-[60%] flex items-center">
              <Info className="text-primary w-5 h-5 fill-primary/10" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Org name</label>
              <div className="w-[60%]">
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 text-body-main focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Cloud region</label>
              <div className="w-[60%] relative">
                <select 
                  value={cloudRegion}
                  onChange={(e) => setCloudRegion(e.target.value)}
                  className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <option>ap-south-1 (Mumbai)</option>
                  <option>us-east-1 (N. Virginia)</option>
                  <option>eu-west-1 (Ireland)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Audit frequency</label>
              <div className="w-[60%] relative">
                <select 
                  value={auditFrequency}
                  onChange={(e) => setAuditFrequency(e.target.value)}
                  className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Real-time</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm">
          <div className="flex border-b border-precision border-outline-variant pb-4 mb-6">
            <div className="w-[40%]">
              <h3 className="font-section-header text-section-header text-on-surface font-medium">Notifications</h3>
              <p className="text-label-caps text-outline mt-1">Alert routing and verbosity</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Email alerts</label>
              <div className="w-[60%]">
                <Toggle active={emailAlerts} onClick={() => setEmailAlerts(!emailAlerts)} />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">SMS alerts</label>
              <div className="w-[60%]">
                <Toggle active={smsAlerts} onClick={() => setSmsAlerts(!smsAlerts)} />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Threshold</label>
              <div className="w-[60%] relative">
                <select 
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <option>Warning & above</option>
                  <option>Critical only</option>
                  <option>All events</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Framework Section */}
        <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm">
          <div className="flex border-b border-precision border-outline-variant pb-4 mb-6">
            <div className="w-[40%]">
              <h3 className="font-section-header text-section-header text-on-surface font-medium">Compliance framework</h3>
              <p className="text-label-caps text-outline mt-1">Regulatory and legal mapping</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant pt-1 font-medium">Active frameworks</label>
              <div className="w-[60%] grid grid-cols-2 gap-y-3">
                {AVAILABLE_FRAMEWORKS.map((framework) => (
                  <label key={framework} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={activeFrameworks.includes(framework)}
                      onChange={(e) => handleFrameworkChange(framework, e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 accent-primary"
                    />
                    <span className="text-body-main text-on-surface group-hover:text-primary transition-colors">{framework}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Retention period</label>
              <div className="w-[60%]">
                <div className="relative">
                  <input 
                    type="text" 
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                  <History className="absolute right-3 top-1/2 -translate-y-1/2 text-outline w-4.5 h-4.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-surface-container-lowest border border-error/20 rounded-xl p-card-padding shadow-sm">
          <div className="flex border-b border-error/10 pb-4 mb-6">
            <div className="w-[40%]">
              <h3 className="font-section-header text-section-header text-error font-medium">Danger zone</h3>
              <p className="text-label-caps text-outline mt-1">Remove inserted analysis data and start fresh</p>
            </div>
            <div className="w-[60%] flex items-center gap-2 text-xs text-on-surface-variant">
              <AlertTriangle className="w-4 h-4 text-error" />
              This clears datasets, analyses, reports, security events, compliance documents, policies, vector data, and AI memory for the organization.
            </div>
          </div>

          <div className="space-y-4">
            {resetMessage && (
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                {resetMessage}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-main text-on-surface font-medium">Reset organization data</p>
                <p className="text-xs text-on-surface-variant mt-1">Use this before a fresh benchmark or a new upload batch.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                disabled={resetting}
                className="h-9 px-5 rounded-lg bg-error text-white font-body-main text-body-main hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear all inserted data'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button 
            type="button"
            className="h-9 px-6 rounded-lg border border-precision border-outline-variant bg-white text-on-surface font-body-main text-body-main hover:bg-surface-container-low transition-colors active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.02)] font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={saving}
            className={cn(
              "h-9 px-6 rounded-lg font-body-main text-body-main transition-all shadow-sm active:scale-95 flex items-center justify-center font-medium min-w-30",
              success ? "bg-green-600 text-white" : "bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : success ? (
              "Saved Successfully"
            ) : (
              "Save settings"
            )}
          </button>
        </div>
      </form>

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !resetting && setShowResetDialog(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant/60 bg-surface-container-high shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-section-header font-medium text-on-surface">Confirm cleanup</h3>
                <p className="mt-2 text-body-main text-on-surface-variant">
                  This will remove uploaded datasets, analyses, reports, security events, compliance documents, governance policies,
                  vector data, and AI memory for the current organization.
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-error font-medium">
                  Type RESET to continue
                </p>
                <input
                  value={resetConfirmationText}
                  onChange={(e) => setResetConfirmationText(e.target.value)}
                  placeholder="RESET"
                  disabled={resetting}
                  className="mt-2 w-full h-10 rounded-lg border border-outline-variant bg-white px-3 text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-error/40"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!resetting) {
                    setShowResetDialog(false);
                    setResetConfirmationText('');
                  }
                }}
                disabled={resetting}
                className="h-9 px-4 rounded-lg border border-outline-variant bg-white text-on-surface font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting || resetConfirmationText !== 'RESET'}
                className="h-9 px-4 rounded-lg bg-error text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear all inserted data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Glows */}
      <div className="fixed top-0 right-0 -z-10 w-[40vw] h-[40vw] bg-secondary-fixed/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="fixed bottom-0 left-sidebar -z-10 w-[30vw] h-[30vw] bg-primary-fixed/10 blur-[120px] pointer-events-none rounded-full"></div>
    </div>
  );
}

function Toggle({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "w-11 h-6 rounded-full p-0.5 transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/20",
        active ? "bg-primary" : "bg-outline-variant"
      )}
    >
      <div className={cn(
        "w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
        active ? "translate-x-5" : "translate-x-0"
      )}></div>
    </button>
  );
}
