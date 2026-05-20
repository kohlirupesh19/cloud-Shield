import { Network, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function DataGovernance() {
  const [search, setSearch] = useState('');

  const datasets = [
    { name: 'Citizen registry', type: 'Structured', dept: 'UIDAI', source: 'Direct-S3', retention: '10 Years', updated: '2h ago' },
    { name: 'Tax records', type: 'SQL-DB', dept: 'CBDT', source: 'Oracle-V', retention: 'Permanent', updated: '5h ago' },
    { name: 'Land survey data', type: 'Geo-Spatial', dept: 'MoHUA', source: 'PostGIS', retention: '5 Years', updated: '1d ago' },
    { name: 'GST Invoices', type: 'Transactional', dept: 'GSTN', source: 'Kinesis', retention: '7 Years', updated: '10m ago' },
    { name: 'Passport logs', type: 'Log-Stream', dept: 'MEA', source: 'Splunk', retention: '1 Year', updated: '3d ago' },
    { name: 'Ration cards', type: 'Document', dept: 'PDS', source: 'S3-Object', retention: '3 Years', updated: '4h ago' },
  ];

  const filteredData = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-container-margin max-w-7xl mx-auto min-h-screen relative pb-24">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-metric-display text-metric-display text-on-surface tracking-tight">Data governance</h2>
        <p className="text-body-main text-on-surface-variant mt-1">Manage and audit institutional data assets, retention policies, and cross-departmental lineage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack_gap_md">
        
        {/* Left Column (Data Asset Catalog) */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl overflow-hidden flex flex-col h-[480px]">
          <div className="p-card-padding border-b border-precision border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-section-header text-section-header">Data asset catalog</h3>
            <div className="flex items-center gap-4">
              <input 
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 px-3 text-[12px] border border-precision border-outline-variant rounded bg-surface-container-low focus:outline-none focus:border-primary"
              />
              <button className="text-primary text-label-caps font-bold hover:underline">VIEW ALL ASSETS</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full zebra-table border-collapse">
              <thead className="sticky top-0 bg-surface-container-low z-10 shadow-sm shadow-outline-variant/10">
                <tr>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Asset name</th>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Type</th>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Owner dept</th>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Source</th>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Retention</th>
                  <th className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider border-b border-precision border-outline-variant">Updated</th>
                </tr>
              </thead>
              <tbody className="text-body-main divide-y border-precision divide-outline-variant/30">
                {filteredData.map((asset, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-on-surface">{asset.name}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{asset.type}</td>
                    <td className="px-4 py-4">{asset.dept}</td>
                    <td className="px-4 py-4">{asset.source}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-on-tertiary-container/10 text-tertiary text-[11px] font-semibold">{asset.retention}</span>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-on-surface-variant">{asset.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Data Lineage Summary) */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding h-[480px] overflow-auto custom-scrollbar flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-section-header text-section-header">Data lineage summary</h3>
            <Network className="text-primary w-5 h-5" />
          </div>
          
          <LineageCard 
            title="Universal Citizen ID" 
            path="S3_Source -> Spark_ETL -> Redshift_Warehousing"
            status="Active"
          />
          <LineageCard 
            title="Legacy Tax Ledger 2018" 
            path="On-Prem -> Secure_Tunnel -> Glacier_Archive"
            status="Archived"
          />
          <LineageCard 
            title="Direct Benefit Transfer Logs" 
            path="API_Gateway -> Kafka -> Postgres_Live"
            status="Active"
          />
          <LineageCard 
            title="Zonal Land Records (East)" 
            path="GeoNode -> Lambda -> S3_Public_Data"
            status="Active"
          />
        </div>
      </div>

      {/* Governance Health */}
      <div className="mt-stack_gap_md bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding">
        <h3 className="font-section-header text-section-header mb-6">Governance health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <HealthMetric 
            title="Policy coverage"
            value="78%"
            percent={78}
            subtext="4,200/5,384 ASSETS MAPPED"
            barColor="bg-primary"
          />
          <HealthMetric 
            title="Retention compliance"
            value="91%"
            percent={91}
            subtext="892 OUTDATED ENTRIES PURGED"
            barColor="bg-green-600"
            valueColor="text-green-600"
          />
          <HealthMetric 
            title="Catalog completeness"
            value="65%"
            percent={65}
            subtext="META-DATA DRIFT DETECTED IN 12%"
            barColor="bg-amber-500"
            valueColor="text-amber-500"
          />
        </div>
      </div>

      {/* Interactive FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group z-50">
        <Plus className="w-7 h-7" />
        <span className="absolute right-16 bg-on-surface text-surface text-[11px] px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md">
          New Governance Rule
        </span>
      </button>
    </div>
  );
}

function LineageCard({ title, path, status }: { title: string, path: string, status: string }) {
  const isActive = status === 'Active';
  return (
    <div className="p-3 border border-precision border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer group bg-surface-container-lowest">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-body-main font-bold text-on-surface group-hover:text-primary transition-colors">{title}</p>
          <p className="text-[11px] text-on-surface-variant mt-1 font-mono">{path}</p>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight",
          isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
        )}>
          {status}
        </span>
      </div>
    </div>
  );
}

function HealthMetric({ title, value, percent, subtext, barColor, valueColor }: any) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-body-main font-medium">{title}</span>
        <span className={cn("text-body-main font-bold", valueColor || "text-primary")}>{value}</span>
      </div>
      <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: `${percent}%` }}></div>
      </div>
      <p className="text-[10px] text-outline mt-2 uppercase tracking-wide font-medium">{subtext}</p>
    </div>
  );
}
