import { CheckCircle2, ShieldAlert, AlertTriangle, Info, Scaling, ShieldHalf, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function Alerts() {
  const [markedRead, setMarkedRead] = useState(false);

  const handleMarkRead = () => {
    setMarkedRead(true);
    setTimeout(() => setMarkedRead(false), 2000);
  }

  return (
    <div className="p-container-margin max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-section-header text-metric-display text-on-surface tracking-tight">Alerts</h1>
          <p className="text-on-surface-variant font-body-main">Monitor and manage security events and governance violations.</p>
        </div>
        <button 
          onClick={handleMarkRead}
          className={cn(
            "h-9 px-4 rounded-lg font-section-header text-[13px] transition-colors flex items-center gap-2",
            markedRead 
              ? "bg-green-50 text-green-700 border border-precision border-green-200"
              : "bg-surface-container-lowest border border-precision border-outline-variant text-on-surface hover:bg-surface-container"
          )}
        >
          <CheckCircle2 className={cn("w-4 h-4", markedRead && "animate-pulse")} />
          {markedRead ? "All Read" : "Mark all read"}
        </button>
      </div>

      {/* Filter Row */}
      <div className="mb-6 flex items-center gap-2">
        <FilterPill active>All</FilterPill>
        <FilterPill>Critical</FilterPill>
        <FilterPill>Warning</FilterPill>
        <FilterPill>Info</FilterPill>
      </div>

      {/* Alerts List */}
      <div className="space-y-stack_gap_sm">
        <AlertItem
          type="Critical"
          title="Unauthorized Database Access Attempt"
          description="A high-frequency login attempt was detected on the central UIDAI node from an unrecognized IP range in the Asia-Pacific region."
          dept="Ministry of Electronics & IT"
          time="2 mins ago"
        />
        <AlertItem
          type="Warning"
          title="Schema Deviation in Healthcare Records"
          description="Data quality scan identified a 12% schema drift in the Ayushman Bharat dataset. Several mandatory fields are being received as null strings."
          dept="Ministry of Health"
          time="15 mins ago"
        />
        <AlertItem
          type="Info"
          title="Scheduled Backup Completed"
          description="Quarterly snapshot of the National Data Repository (NDR) has been successfully verified and stored in the primary cold storage vault."
          dept="NDR Admin"
          time="1 hour ago"
        />
        <AlertItem
          type="Critical"
          title="GDPR/DPDP Violation Flag"
          description="Automated audit detected unencrypted PII being transferred to an unauthorized cross-border server endpoint from the Finance Dept."
          dept="Ministry of Finance"
          time="3 hours ago"
        />
        <AlertItem
          type="Warning"
          title="Unexpected Latency in Aadhaar Auth API"
          description="Average response time increased by 450ms across all authentication nodes. System load is approaching 85% of total capacity."
          dept="UIDAI Infrastructure"
          time="5 hours ago"
        />
        <AlertItem
          type="Info"
          title="New Admin Role Provisioned"
          description='Access credentials for "Governance Auditor" role have been provisioned for User: RAJESH_SEC_2024 as per ticket #SR9921.'
          dept="IAM Service"
          time="1 day ago"
        />
      </div>

      {/* Pagination / Load More */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-low border border-precision border-outline-variant text-on-surface rounded-full text-[13px] hover:bg-surface-container-high transition-colors font-medium">
          Load older alerts
          <ChevronDown className="w-5 h-5" />
        </button>
        <p className="text-[11px] text-outline font-label-caps uppercase tracking-widest">Showing 6 of 142 total events</p>
      </div>
    </div>
  );
}

function FilterPill({ active, children }: any) {
  return (
    <button className={cn(
      "px-5 py-1.5 rounded-full text-[13px] font-medium transition-all shadow-sm border border-precision",
      active 
        ? "bg-primary text-on-primary border-primary" 
        : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
    )}>
      {children}
    </button>
  );
}

function AlertItem({ type, title, description, dept, time }: any) {
  const isCritical = type === 'Critical';
  const isWarning = type === 'Warning';
  const isInfo = type === 'Info';

  const Icon = isCritical ? ShieldAlert : (isWarning ? AlertTriangle : Info);

  return (
    <div className={cn(
      "bg-surface-container-lowest border border-precision border-outline-variant border-l-[4px] rounded-xl p-card-padding hover:shadow-md transition-shadow group",
      isCritical ? 'border-l-error' : (isWarning ? 'border-l-tertiary-container' : 'border-l-secondary')
    )}>
      <div className="flex gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden",
          isCritical ? "bg-error/10 text-error" : (isWarning ? "bg-tertiary-fixed text-tertiary" : "bg-secondary-fixed text-secondary")
        )}>
          <Icon className={cn("w-5 h-5", isCritical && "fill-error/20")} strokeWidth={isCritical ? 2.5 : 2} />
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-section-header text-section-header text-on-surface font-medium">{title}</h3>
            <span className="text-[11px] font-label-caps text-outline uppercase tracking-wider">{type.toUpperCase()}</span>
          </div>
          
          <p className="text-on-surface-variant text-body-main mb-4 leading-relaxed max-w-4xl">
            {description}
          </p>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4 text-outline text-[12px] font-medium">
              <span className="flex items-center gap-1.5">
                <Scaling className="w-4 h-4" />
                {dept}
              </span>
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                {time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary-container/10 rounded-lg transition-colors">Dismiss</button>
              <button className="px-4 py-1.5 text-[12px] font-medium bg-primary text-on-primary rounded-lg transition-all active:scale-95 shadow-sm hover:opacity-90">View details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
