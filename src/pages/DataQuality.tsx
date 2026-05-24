import { PlayCircle, Filter, TrendingUp, TrendingDown, Minus, Download, MoreVertical, ChevronLeft, ChevronRight, Verified, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface DatasetItem {
  id: string;
  name: string;
  fileType: string;
  rowCount: number;
  createdAt: string;
  metadata: {
    mimetype: string;
    qualityScore?: number;
    anomalyScore?: number;
    issues?: string[];
    recommendations?: string[];
    department?: string;
  };
}

export function DataQuality() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const loadDatasets = () => {
    setLoading(true);
    apiFetch('/datasets')
      .then((res) => {
        setDatasets(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load datasets:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleScanDataset = async (datasetId: string) => {
    setIsScanning(true);
    setActiveScanId(datasetId);
    try {
      await apiFetch(`/datasets/${datasetId}/validate`);
      // Refresh listing
      loadDatasets();
    } catch (err) {
      console.error('Failed to validate dataset:', err);
    } finally {
      setIsScanning(false);
      setActiveScanId(null);
    }
  };

  // Compute stats dynamically
  let avgAccuracy = 0;
  let avgCompleteness = 0;
  let totalDuplicates = 0;

  if (datasets.length > 0) {
    const validScores = datasets.map(d => d.metadata?.qualityScore).filter(s => s !== undefined && s !== null) as number[];
    if (validScores.length > 0) {
      avgCompleteness = Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1));
    }

    const anomalies = datasets.map(d => d.metadata?.anomalyScore).filter(a => a !== undefined && a !== null) as number[];
    if (anomalies.length > 0) {
      const avgAnomaly = anomalies.reduce((a, b) => a + b, 0) / anomalies.length;
      avgAccuracy = Number((100.0 - avgAnomaly * 100).toFixed(1));
    }

    totalDuplicates = datasets.reduce((acc, curr) => {
      const anom = curr.metadata?.anomalyScore || 0;
      return acc + Math.round(anom * (curr.rowCount || 0));
    }, 0);
  }

  const totalRows = datasets.reduce((acc, curr) => acc + (curr.rowCount || 0), 0);
  const anomalyContainment = totalRows > 0 ? Number((Math.max(0, 100 - ((totalDuplicates / totalRows) * 100))).toFixed(1)) : 0;
  const latestCheckAt = datasets
    .map((dataset) => dataset.metadata?.lastCheckedAt || dataset.createdAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <div className="p-container-margin max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-title-lg text-title-lg text-on-surface tracking-tight">Data quality</h1>
          <p className="text-body-main text-on-surface-variant mt-1">Real-time integrity monitoring across central ministry databases.</p>
        </div>
        <button 
          onClick={loadDatasets}
          className="bg-primary-container text-on-primary h-[36px] px-6 rounded-lg font-section-header hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
        >
          <span>Refresh check status</span>
        </button>
      </div>

      {/* Filter Row */}
      <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-label-caps text-on-surface-variant uppercase opacity-60 font-medium text-xs">Department</span>
          <select className="bg-surface-container-low border-none rounded-lg text-xs py-1.5 pr-8 pl-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none">
            <option>All Ministries</option>
            <option>Ministry of Finance</option>
            <option>Agriculture & Farmers Welfare</option>
            <option>Home Affairs</option>
          </select>
        </div>
        
        <div className="w-[1px] h-8 bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-label-caps text-on-surface-variant uppercase opacity-60 font-medium text-xs">Dataset type</span>
          <select className="bg-surface-container-low border-none rounded-lg text-xs py-1.5 pr-8 pl-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none">
            <option>Relational SQL</option>
            <option>NoSQL Document</option>
            <option>Time-series</option>
          </select>
        </div>
        
        <div className="flex-1"></div>
        
        <button className="flex items-center gap-2 text-primary font-section-header px-4 py-1.5 rounded-lg hover:bg-primary-fixed transition-colors font-medium text-xs">
          <Filter className="w-[18px] h-[18px]" />
          More Filters
        </button>
      </section>

      {/* Metric Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accuracy Score */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header text-xs font-semibold">Accuracy score</span>
            <div className="bg-green-100 text-green-700 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
              <TrendingUp className="w-3 h-3" />
              +2.4%
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium text-[32px] tracking-tight">{avgAccuracy}%</span>
            <span className="text-xs text-on-surface-variant opacity-60">vs prev week</span>
          </div>
        </div>
        
        {/* Completeness */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header text-xs font-semibold">Completeness score</span>
            <div className="bg-red-100 text-red-700 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
              <TrendingDown className="w-3 h-3" />
              -1.1%
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium text-[32px] tracking-tight">{avgCompleteness}%</span>
            <span className="text-xs text-on-surface-variant opacity-60">evaluated fields</span>
          </div>
        </div>
        
        {/* Duplicate Records */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding flex flex-col justify-between h-[120px] shadow-sm group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant font-section-header text-xs font-semibold">Duplicates flagged</span>
            <div className="bg-gray-100 text-gray-600 font-label-caps px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
              <Minus className="w-3 h-3" />
              STABLE
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-metric-display text-metric-display font-medium text-[32px] tracking-tight">{totalDuplicates}</span>
            <span className="text-xs text-on-surface-variant opacity-60">isolated outlier entries</span>
          </div>
        </div>
      </section>

      {/* Main Data Table Container */}
      <section className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
        <div className="px-card-padding py-4 border-b border-precision border-outline-variant flex justify-between items-center bg-transparent">
          <h2 className="font-section-header text-on-surface font-medium">Dataset Quality Audit</h2>
          <div className="text-xs text-on-surface-variant font-medium">Outliers mapped via Isolation Forest</div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <Verified className="w-12 h-12 text-outline-variant/60 mb-2" />
              <h4 className="text-body-main font-bold">No active datasets</h4>
              <p className="text-xs text-on-surface-variant max-w-[280px] mt-1">Ingest a new dataset on the Dashboard to run live scikit-learn check.</p>
            </div>
          ) : (
            <table className="w-full text-left zebra-table">
              <thead>
                <tr className="bg-surface-container-low border-b border-precision border-outline-variant">
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Dataset name</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Rows Ingested</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Last checked</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Anomaly Score</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Quality Score</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs">Isolated Outliers</th>
                  <th className="px-card-padding py-3 text-label-caps text-on-surface-variant uppercase font-medium text-xs text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="text-body-main divide-y border-precision divide-outline-variant/30">
                {datasets.map((ds) => {
                  const qual = ds.metadata.qualityScore !== undefined ? ds.metadata.qualityScore : 95.0;
                  const anom = ds.metadata.anomalyScore !== undefined ? ds.metadata.anomalyScore : 0.05;
                  const dupes = Math.round(anom * ds.rowCount);
                  
                  let status = 'Passed';
                  if (qual < 85.0) status = 'Failed';
                  else if (qual < 95.0) status = 'Warning';

                  const checkedAt = ds.metadata.lastCheckedAt ? new Date(ds.metadata.lastCheckedAt) : new Date(ds.createdAt);
                  const checkedTime = checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <DataTableRow 
                      key={ds.id}
                      id={ds.id}
                      name={ds.name} 
                      dept={String(ds.rowCount)} 
                      time={checkedTime} 
                      accuracy={`${(100 - anom * 100).toFixed(1)}%`}
                      completeness={`${qual.toFixed(1)}%`} 
                      duplicates={String(dupes)} 
                      status={status}
                      isScanning={isScanning && activeScanId === ds.id}
                      onScan={() => handleScanDataset(ds.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-4">
          <span className="text-xs text-on-surface-variant">Showing {datasets.length} monitored registries</span>
        </div>
        
        {/* Live ML Controls Card */}
        <div className="bg-surface-container-lowest border border-precision border-outline-variant rounded-xl p-card-padding shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-section-header text-on-surface flex items-center gap-2 font-medium text-xs">
              <Verified className="text-primary w-5 h-5 fill-primary/10" />
              Live ML controls
            </h3>
            <span className="text-label-caps text-on-surface-variant opacity-60 font-medium text-[10px]">
              {latestCheckAt ? `Last check ${new Date(latestCheckAt).toLocaleString()}` : 'Waiting for first scan'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-on-surface">Average quality coverage</span>
                <span className="text-primary font-bold">{avgCompleteness.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${avgCompleteness}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-on-surface">Anomaly containment</span>
                <span className="text-on-surface-variant font-bold">{anomalyContainment.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${anomalyContainment}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DataTableRow({ 
  id, name, dept, time, accuracy, completeness, duplicates, status, onScan, isScanning
}: any) {
  return (
    <tr className="hover:bg-primary/5 transition-colors cursor-pointer group">
      <td className="px-card-padding py-4 font-bold text-on-surface text-xs">{name}</td>
      <td className="px-card-padding py-4 text-xs font-medium text-on-surface-variant">{dept}</td>
      <td className="px-card-padding py-4 text-xs text-on-surface-variant font-medium">{time}</td>
      <td className="px-card-padding py-4 text-xs font-semibold">{accuracy}</td>
      <td className="px-card-padding py-4 text-xs font-semibold">{completeness}</td>
      <td className="px-card-padding py-4 text-xs font-medium text-on-surface-variant">{duplicates}</td>
      <td className="px-card-padding py-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-[70px] text-center shrink-0">
            {status === 'Passed' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Passed</span>}
            {status === 'Warning' && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Warning</span>}
            {status === 'Failed' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Failed</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScan();
            }}
            disabled={isScanning}
            className="h-7 px-3 bg-primary text-on-primary rounded text-[10px] font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3 h-3" />
                <span>Run ML Check</span>
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
