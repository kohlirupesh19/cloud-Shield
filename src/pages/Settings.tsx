import { Info, ChevronDown, History } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="p-container-margin max-w-4xl mx-auto min-h-screen pb-24 relative">
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
                  defaultValue="Government of India — IT Dept."
                  className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 text-body-main focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Cloud region</label>
              <div className="w-[60%] relative">
                <select className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                <select className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                <select className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                <Checkbox label="PDPB 2023" defaultChecked />
                <Checkbox label="ISO 27001" defaultChecked />
                <Checkbox label="GDPR" />
                <Checkbox label="SOC 2" />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-[40%] font-body-main text-body-main text-on-surface-variant font-medium">Retention period</label>
              <div className="w-[60%]">
                <div className="relative">
                  <input 
                    type="text" 
                    defaultValue="365 days"
                    className="w-full h-9 bg-white border border-precision border-outline-variant rounded-lg px-3 pr-10 text-body-main focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                  <History className="absolute right-3 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
                </div>
              </div>
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
            className={cn(
              "h-9 px-6 rounded-lg font-body-main text-body-main transition-all shadow-sm active:scale-95 flex items-center justify-center font-medium min-w-[120px]",
              saving ? "bg-green-600 text-white" : "bg-primary-container text-white hover:opacity-90"
            )}
          >
            {saving ? "Saved Successfully" : "Save settings"}
          </button>
        </div>
      </form>

      {/* Decorative Glows */}
      <div className="fixed top-0 right-0 -z-10 w-[40vw] h-[40vw] bg-secondary-fixed/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="fixed bottom-0 left-[220px] -z-10 w-[30vw] h-[30vw] bg-primary-fixed/10 blur-[120px] pointer-events-none rounded-full"></div>
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

function Checkbox({ label, defaultChecked }: { label: string, defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input 
        type="checkbox" 
        defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 accent-primary"
      />
      <span className="text-body-main text-on-surface group-hover:text-primary transition-colors">{label}</span>
    </label>
  );
}
