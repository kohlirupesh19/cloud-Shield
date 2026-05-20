import { PlayCircle, Filter, TrendingUp, TrendingDown, Minus, Download, MoreVertical, ChevronLeft, ChevronRight, Verified } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function DataQuality() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="p-container-margin max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-title-lg text-title-lg text-on-surface tracking-tight">Data quality</h1>
          <p className="text-body-main text-on-surface-variant mt-1">Real-time integrity monitoring across central ministry databases.</p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="bg-primary-container text-on-primary h-[36px] px-6 rounded-lg font-section-header hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm disabled:opacity-80"
        >
          <PlayCircle className={cn("w-[18px] h-[18px]", isScanning && "animate-spin")} />
          <span>{isScanning ? 'Scanning...' : 'Run quality check'}</span>
        </button>
      </div>

      {/* Filter Row */}
      <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-label-caps text-on-surface-variant uppercase opacity-60 font-medium">Department</span>
          <select className="bg-surface-container-low border-none rounded-lg text-body-main py-1.5 pr-8 pl-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none">
            <option>All Ministries</option>
            <option>Ministry of Finance</option>
            <option>Agriculture & Farmers Welfare</option>
            <option>Home Affairs</option>
          </select>
        </div>
        
        <div className="w-[1px] h-8 bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-label-caps text-on-surface-variant uppercase opacity-60 font-medium">Dataset type</span>
          <select className="bg-surface-container-low border-none rounded-lg text-body-main py-1.5 pr-8 pl-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none">
            <option>Relational SQL</option>
            <option>NoSQL Document</option>
            <option>Time-series</option>
          </select>
        </div>
        
        <div className="w-[1px] h-8 bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-label-caps text-on-surface-variant uppercase opacity-60 font-medium">Date range</span>
          <select className="bg-surface-container-low border-none rounded-lg text-body-main py-1.5 pr-8 pl-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
        
        <div className="flex-1"></div>
        
        <button className="flex items-center gap-2 text-primary font-section-header px-4 py-1.5 rounded-lg hover:bg-primary-fixed transition-colors font-medium">
          <Filter className="w-[18px] h-[18px]" />
          More Filters
        </button>
      </section>

      {/* Metric Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accuracy Score */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header font-medium">Accuracy score</span>
            <div className="bg-green-100 text-green-700 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" />
              +2.4%
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium">91%</span>
            <span className="text-body-main text-on-surface-variant opacity-60">vs prev week</span>
          </div>
        </div>
        
        {/* Completeness */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header font-medium">Completeness</span>
            <div className="bg-red-100 text-red-700 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <TrendingDown className="w-3 h-3" />
              -1.1%
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium">84%</span>
            <span className="text-body-main text-on-surface-variant opacity-60">missing keys detected</span>
          </div>
        </div>
        
        {/* Duplicate Records */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header font-medium">Duplicate records</span>
            <div className="bg-gray-100 text-gray-600 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Minus className="w-3 h-3" />
              STABLE
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium">342</span>
            <span className="text-body-main text-on-surface-variant opacity-60">entries flagged</span>
          </div>
        </div>
      </section>

      {/* Main Data Table Container */}
      <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-card-padding py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
          <h2 className="font-section-header text-on-surface font-medium">Dataset Quality Audit</h2>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors"><Download className="w-5 h-5" /></button>
            <button className="p-1.5 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table">
            <thead>
              <tr className="bg-surface-container-low border-b border-precision border-outline-variant">
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Dataset name</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Department</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Last checked</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Accuracy</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Completeness</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Duplicates</th>
                <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-body-main divide-y border-precision divide-outline-variant/30">
              <DataTableRow name="Aadhaar Vault Core" dept="UIDAI" time="2h ago" accuracy="99.8%" completeness="98.2%" duplicates="0.01%" status="Passed" />
              <DataTableRow name="PM-Kisan Beneficiaries" dept="Agriculture" time="5h ago" accuracy="82.1%" accuracyDanger completeness="91.0%" duplicates="2.4%" status="Failed" />
              <DataTableRow name="GST Revenue Logs" dept="Finance" time="12m ago" accuracy="94.5%" completeness="88.2%" completenessWarning duplicates="0.12%" status="Warning" />
              <DataTableRow name="DBT Transaction Ledger" dept="NPCI" time="1h ago" accuracy="99.1%" completeness="99.5%" duplicates="0.05%" status="Passed" />
              <DataTableRow name="National Health Stack" dept="Health & Family Welfare" time="3h ago" accuracy="87.4%" completeness="84.2%" duplicates="1.2%" status="Warning" />
              <DataTableRow name="MGNREGA Payrolls" dept="Rural Development" time="1d ago" accuracy="92.0%" completeness="79.5%" duplicates="3.1%" status="Failed" />
              <DataTableRow name="Vahan Vehicle Registry" dept="Road Transport" time="4h ago" accuracy="96.8%" completeness="97.1%" duplicates="0.08%" status="Passed" />
              <DataTableRow name="Passport Seva Logs" dept="External Affairs" time="20m ago" accuracy="99.9%" completeness="99.7%" duplicates="0.00%" status="Passed" />
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pagination Left */}
        <div className="flex items-center gap-4">
          <span className="text-body-main text-on-surface-variant">Showing 1-8 of 48 results</span>
          <div className="flex border border-precision border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
            <button className="px-3 py-1.5 border-r border-precision border-outline-variant hover:bg-surface-container-low transition-colors text-on-surface-variant"><ChevronLeft className="w-4 h-4" /></button>
            <button className="px-3 py-1.5 hover:bg-surface-container-low transition-colors text-on-surface-variant"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        
        {/* Compliance Status Card Right */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-section-header text-on-surface flex items-center gap-2 font-medium">
              <Verified className="text-primary w-5 h-5 fill-primary/10" />
              Compliance Status
            </h3>
            <span className="text-label-caps text-on-surface-variant opacity-60 font-medium">Updated 1h ago</span>
          </div>
          
          <div className="space-y-4">
            {/* Standard 1 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-body-main">
                <span className="font-medium text-on-surface">NITI Aayog Standards</span>
                <span className="text-primary font-bold">94%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            
            {/* Standard 2 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-body-main">
                <span className="font-medium text-on-surface">Ministry Directives</span>
                <span className="text-on-surface-variant font-bold">78%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DataTableRow({ 
  name, dept, time, accuracy, completeness, duplicates, status, 
  accuracyDanger, completenessWarning 
}: any) {
  const isFailed = status === 'Failed';
  const isWarning = status === 'Warning';
  
  return (
    <tr className="hover:bg-primary/5 transition-colors cursor-pointer group active:scale-[0.998]">
      <td className="px-card-padding py-4 font-medium text-on-surface">{name}</td>
      <td className="px-card-padding py-4 text-on-surface-variant">{dept}</td>
      <td className="px-card-padding py-4 text-on-surface-variant">{time}</td>
      <td className={cn("px-card-padding py-4", accuracyDanger && "text-error font-medium")}>{accuracy}</td>
      <td className={cn("px-card-padding py-4", completenessWarning && "text-orange-600 font-medium")}>{completeness}</td>
      <td className="px-card-padding py-4 text-on-surface-variant">{duplicates}</td>
      <td className="px-card-padding py-4">
        {status === 'Passed' && <span className="bg-green-100 text-green-700 text-label-caps px-2 py-1 rounded-full font-bold">Passed</span>}
        {status === 'Warning' && <span className="bg-orange-100 text-orange-700 text-label-caps px-2 py-1 rounded-full font-bold">Warning</span>}
        {status === 'Failed' && <span className="bg-red-100 text-red-700 text-label-caps px-2 py-1 rounded-full font-bold">Failed</span>}
      </td>
    </tr>
  );
}
