import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, 
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, FileText, 
  Trash2, Database, Download, Sparkles, BarChart2, Layers
} from 'lucide-react';

export default function DatasetExplorerTab({ darkMode, onDatasetChanged }) {
  const [activeSubTab, setActiveSubTab] = useState('preview'); // 'preview' | 'quality' | 'statistics'
  const [datasetId, setDatasetId] = useState('default');
  const [versions, setVersions] = useState([]);
  
  // Preview State
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [tickerFilter, setTickerFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');

  // Quality & Profiling State
  const [quality, setQuality] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [cleaningOptions, setCleaningOptions] = useState({
    drop_duplicates: true,
    missing_strategy: 'impute_mean',
    outlier_treatment: 'flag'
  });
  const [cleaningStatus, setCleaningStatus] = useState(null);

  // Statistics State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Upload State
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Dataset Versions
  const fetchVersions = async () => {
    try {
      const res = await axios.get('/api/dataset/versions');
      if (res.data) setVersions(res.data);
    } catch (err) {
      console.error("Error fetching dataset versions:", err);
    }
  };

  // Fetch Preview Data
  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = {
        dataset_id: datasetId,
        page,
        page_size: pageSize,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        ticker_filter: tickerFilter !== 'ALL' ? tickerFilter : undefined,
        sentiment_filter: sentimentFilter !== 'ALL' ? sentimentFilter : undefined
      };
      const res = await axios.get('/api/dataset/preview', { params });
      setPreview(res.data);
    } catch (err) {
      console.error("Error fetching preview:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Quality Profile
  const fetchQuality = async () => {
    setQualityLoading(true);
    try {
      const res = await axios.get(`/api/dataset/quality-profile?dataset_id=${datasetId}`);
      setQuality(res.data);
    } catch (err) {
      console.error("Error fetching quality profile:", err);
    } finally {
      setQualityLoading(false);
    }
  };

  // Fetch Statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`/api/dataset/statistics?dataset_id=${datasetId}`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    fetchPreview();
  }, [datasetId, page, pageSize, search, sortBy, sortOrder, tickerFilter, sentimentFilter]);

  useEffect(() => {
    if (activeSubTab === 'quality') fetchQuality();
    if (activeSubTab === 'statistics') fetchStats();
  }, [activeSubTab, datasetId]);

  // Handle Sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError("Invalid file format. Please upload a standard CSV (.csv) file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum 25MB limit.`);
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/dataset/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(`Successfully uploaded ${res.data.filename} (${res.data.total_records.toLocaleString()} rows).`);
      await fetchVersions();
      setDatasetId(res.data.dataset_id);
      setPage(1);
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Failed to upload and parse CSV dataset.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Clean Execution
  const handleClean = async () => {
    setCleaningStatus({ loading: true, message: "Executing data remediation pipeline..." });
    try {
      const res = await axios.post('/api/dataset/clean', {
        dataset_id: datasetId,
        ...cleaningOptions
      });
      setCleaningStatus({
        success: true,
        data: res.data,
        message: res.data.message
      });
      await fetchVersions();
      setDatasetId(res.data.new_version_id);
      if (onDatasetChanged) onDatasetChanged();
    } catch (err) {
      setCleaningStatus({
        error: true,
        message: err.response?.data?.detail || "Cleaning execution failed."
      });
    }
  };

  const cardBg = darkMode ? 'glass-panel' : 'glass-panel-light';
  const borderLight = darkMode ? 'border-white/5' : 'border-slate-200';
  const textMuted = darkMode ? 'text-zinc-400' : 'text-slate-500';
  const textHeader = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-6">

      {/* 🧭 Top Header & Dataset Version Switcher */}
      <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-black uppercase tracking-tight ${textHeader}`}>
              Dataset Explorer & Quality Profiler
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className={textMuted}>Active Dataset:</span>
              <select
                value={datasetId}
                onChange={(e) => { setDatasetId(e.target.value); setPage(1); }}
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  darkMode ? 'bg-zinc-900 border-white/10 text-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                } focus:outline-none focus:border-cyan-400`}
              >
                {versions.map(v => (
                  <option key={v.dataset_id} value={v.dataset_id}>
                    {v.filename} ({v.records.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Validating...' : 'Upload CSV'}
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              disabled={uploading} 
              className="hidden" 
            />
          </label>
          <a
            href="/api/dataset/export?dataset_id=default"
            download
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              darkMode ? 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm'
            }`}
            title="Download CSV dataset"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Upload Feedback Alerts */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-[10px] font-mono hover:text-white">[DISMISS]</button>
        </div>
      )}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-[10px] font-mono hover:text-white">[DISMISS]</button>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'preview' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : `${textMuted} hover:text-white hover:bg-white/5`
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Data Table Preview
        </button>

        <button
          onClick={() => setActiveSubTab('quality')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'quality' 
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
              : `${textMuted} hover:text-white hover:bg-white/5`
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Data Quality & Profiling
        </button>

        <button
          onClick={() => setActiveSubTab('statistics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'statistics' 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : `${textMuted} hover:text-white hover:bg-white/5`
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Descriptive Statistics
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DATA TABLE PREVIEW SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          {/* Filter & Search Controls Bar */}
          <div className={`p-4 rounded-xl border ${borderLight} ${cardBg} flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search in records..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                    darkMode ? 'bg-zinc-900/60 border-white/10 text-zinc-200 placeholder-zinc-600' : 'bg-white border-slate-300 text-slate-800'
                  } focus:outline-none focus:border-cyan-400`}
                />
              </div>

              {/* Ticker Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className={textMuted}>Ticker:</span>
                <select
                  value={tickerFilter}
                  onChange={(e) => { setTickerFilter(e.target.value); setPage(1); }}
                  className={`text-xs font-mono font-bold px-2 py-1.5 rounded-lg border ${
                    darkMode ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-slate-300 text-slate-800'
                  } focus:outline-none`}
                >
                  <option value="ALL">ALL TICKERS</option>
                  {['TSLA', 'AAPL', 'NVDA', 'MSFT', 'META', 'AMZN', 'GOOGL', 'NFLX'].map(t => (
                    <option key={t} value={t}>${t}</option>
                  ))}
                </select>
              </div>

              {/* Sentiment Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className={textMuted}>Sentiment:</span>
                <select
                  value={sentimentFilter}
                  onChange={(e) => { setSentimentFilter(e.target.value); setPage(1); }}
                  className={`text-xs font-bold px-2 py-1.5 rounded-lg border ${
                    darkMode ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-slate-300 text-slate-800'
                  } focus:outline-none`}
                >
                  <option value="ALL">ALL LABELS</option>
                  <option value="BULLISH">BULLISH</option>
                  <option value="BEARISH">BEARISH</option>
                  <option value="NEUTRAL">NEUTRAL</option>
                </select>
              </div>
            </div>

            {/* Reset Filters & Pagination Size */}
            <div className="flex items-center gap-3">
              {(search || tickerFilter !== 'ALL' || sentimentFilter !== 'ALL' || sortBy) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setTickerFilter('ALL');
                    setSentimentFilter('ALL');
                    setSortBy(null);
                    setPage(1);
                  }}
                  className="text-xs text-cyan-400 hover:underline font-bold"
                >
                  Reset Filters
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs">
                <span className={textMuted}>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className={`text-xs font-mono font-bold px-2 py-1.5 rounded-lg border ${
                    darkMode ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className={`rounded-2xl border ${borderLight} ${cardBg} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${borderLight} ${darkMode ? 'bg-zinc-900/60 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>
                    {preview?.columns?.map(col => {
                      const colType = preview.column_types?.[col] || 'string';
                      const isSorted = sortBy === col;
                      return (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col}</span>
                            <span className="text-[9px] px-1 rounded bg-white/5 text-zinc-500 font-sans uppercase">
                              {colType}
                            </span>
                            <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-cyan-400' : 'opacity-30'}`} />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={preview?.columns?.length || 10} className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                        Querying records...
                      </td>
                    </tr>
                  ) : preview?.records?.length === 0 ? (
                    <tr>
                      <td colSpan={preview?.columns?.length || 10} className="py-12 text-center text-zinc-500">
                        No records match the active query parameters.
                      </td>
                    </tr>
                  ) : (
                    preview?.records?.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-cyan-500/5 transition-colors ${
                          idx % 2 === 0 ? (darkMode ? 'bg-transparent' : 'bg-white') : (darkMode ? 'bg-zinc-950/20' : 'bg-slate-50/50')
                        }`}
                      >
                        {preview.columns.map(col => {
                          const val = row[col];
                          let cellStyle = darkMode ? 'text-zinc-300' : 'text-slate-700';

                          // Highlight Sentiment
                          if (col === 'sentiment_label') {
                            if (val === 'BULLISH') cellStyle = 'text-emerald-400 font-bold';
                            else if (val === 'BEARISH') cellStyle = 'text-rose-400 font-bold';
                            else cellStyle = 'text-zinc-400';
                          } else if (col === 'sentiment_score') {
                            cellStyle = val > 0.15 ? 'text-emerald-400 font-bold' : (val < -0.15 ? 'text-rose-400 font-bold' : 'text-zinc-400');
                          } else if (col === 'ticker') {
                            cellStyle = 'text-cyan-400 font-bold';
                          }

                          return (
                            <td key={col} className={`py-2.5 px-3 whitespace-nowrap text-xs ${cellStyle}`}>
                              {val === null || val === undefined || val === '' ? (
                                <span className="text-zinc-600 italic">null</span>
                              ) : (
                                typeof val === 'number' ? val.toLocaleString() : String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className={`p-4 border-t ${borderLight} flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}>
              <span className={textMuted}>
                Showing <strong className="text-cyan-400">{preview?.filtered_records ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
                <strong className="text-cyan-400">{Math.min(page * pageSize, preview?.filtered_records || 0)}</strong> of{' '}
                <strong className="text-cyan-400">{preview?.filtered_records?.toLocaleString() || 0}</strong> records
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={`p-2 rounded-lg border ${borderLight} disabled:opacity-30 hover:bg-white/5 transition-all`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-2 font-bold">
                  {page} / {preview?.total_pages || 1}
                </span>
                <button
                  disabled={page >= (preview?.total_pages || 1)}
                  onClick={() => setPage(prev => Math.min(preview?.total_pages || 1, prev + 1))}
                  className={`p-2 rounded-lg border ${borderLight} disabled:opacity-30 hover:bg-white/5 transition-all`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DATA QUALITY & PROFILING SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'quality' && (
        <div className="space-y-6">
          {qualityLoading ? (
            <div className="py-16 text-center text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-400" />
              Computing multi-factor data quality matrix...
            </div>
          ) : quality && (
            <div className="space-y-6">
              
              {/* Quality Score Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-2`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Overall Quality Score</span>
                  <div className="text-3xl font-black font-mono text-pink-400">
                    {quality.composite_quality_score}%
                  </div>
                  <span className="text-xs font-black text-emerald-400 block">{quality.grade}</span>
                </div>

                <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-2`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Completeness Factor</span>
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    {quality.metrics.completeness_score}%
                  </div>
                  <span className="text-xs text-zinc-500 block font-medium">40% weighting</span>
                </div>

                <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-2`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Uniqueness Factor</span>
                  <div className="text-3xl font-black font-mono text-purple-400">
                    {quality.metrics.uniqueness_score}%
                  </div>
                  <span className="text-xs text-zinc-500 block font-medium">30% weighting (Duplicates: {quality.duplicate_records})</span>
                </div>

                <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-2`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Statistical Outliers</span>
                  <div className="text-3xl font-black font-mono text-amber-400">
                    {quality.total_outliers}
                  </div>
                  <span className="text-xs text-zinc-500 block font-medium">IQR 1.5x Distribution</span>
                </div>
              </div>

              {/* Quality Warnings Box */}
              <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-3`}>
                <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader} flex items-center gap-2`}>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Automated Data Quality Audit Findings
                </h3>
                <div className="space-y-2 text-xs">
                  {quality.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-zinc-300">
                      <span className="text-cyan-400 font-mono mt-0.5">&bull;</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 text-[10px] text-zinc-500 font-mono border-t border-white/5">
                  Methodology: {quality.methodology}
                </div>
              </div>

              {/* Column-Level Missing Values Table */}
              <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
                <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader}`}>
                  Column-Level Null Value Profiling
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Column Name</th>
                        <th className="py-2.5 px-3">Missing Cells</th>
                        <th className="py-2.5 px-3">Missing Ratio</th>
                        <th className="py-2.5 px-3">Integrity Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(quality.missing_by_column).map(([col, cnt]) => {
                        const pct = quality.missing_percentage_by_column[col] || 0;
                        return (
                          <tr key={col}>
                            <td className="py-2.5 px-3 font-bold text-white">{col}</td>
                            <td className="py-2.5 px-3">{cnt}</td>
                            <td className={`py-2.5 px-3 font-bold ${cnt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {pct}%
                            </td>
                            <td className="py-2.5 px-3 w-48">
                              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full ${cnt > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                                  style={{ width: `${Math.max(2, 100 - pct)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Data Cleaning Operations Module */}
              <div className={`p-6 rounded-2xl border border-cyan-500/20 ${cardBg} space-y-4`}>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider ${textHeader} flex items-center gap-2`}>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Automated Data Remediation Engine
                    </h3>
                    <p className={`text-[11px] ${textMuted} mt-0.5`}>
                      Execute non-destructive data cleaning to produce a sanitized, versioned dataset copy
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Option 1: Drop Duplicates */}
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-zinc-950/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.drop_duplicates}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, drop_duplicates: e.target.checked }))}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Remove Duplicate Records</span>
                      <span className="text-[10px] text-zinc-500">Purge redundant entries ({quality.duplicate_records} found)</span>
                    </div>
                  </label>

                  {/* Option 2: Missing Value Strategy */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-950/40 space-y-1">
                    <span className="text-xs font-bold text-white block">Missing Value Strategy</span>
                    <select
                      value={cleaningOptions.missing_strategy}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, missing_strategy: e.target.value }))}
                      className="w-full text-xs font-bold bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-cyan-400 focus:outline-none"
                    >
                      <option value="impute_mean">Impute Mean (Numerical) / Mode (Categorical)</option>
                      <option value="impute_median">Impute Median</option>
                      <option value="drop">Drop Rows with Nulls</option>
                      <option value="none">Retain Nulls</option>
                    </select>
                  </div>

                  {/* Option 3: Outlier Treatment */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-950/40 space-y-1">
                    <span className="text-xs font-bold text-white block">Outlier Treatment</span>
                    <select
                      value={cleaningOptions.outlier_treatment}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, outlier_treatment: e.target.value }))}
                      className="w-full text-xs font-bold bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-cyan-400 focus:outline-none"
                    >
                      <option value="flag">Flag Outliers (Keep Records)</option>
                      <option value="cap">Cap at 1.5x IQR Bounds</option>
                      <option value="drop">Drop Outlier Rows</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-zinc-500">
                    Creates versioned copy (e.g. <code>cleaned_v1</code>). Original remains intact.
                  </span>
                  <button
                    onClick={handleClean}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-pink-500/20"
                  >
                    Execute Cleaning &rarr;
                  </button>
                </div>

                {/* Remediation Status Feedback */}
                {cleaningStatus && (
                  <div className={`p-4 rounded-xl border text-xs mt-3 ${
                    cleaningStatus.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    <span className="font-bold">{cleaningStatus.message}</span>
                    {cleaningStatus.data && (
                      <div className="mt-1 font-mono text-[11px] text-zinc-300">
                        Duplicates removed: {cleaningStatus.data.duplicates_removed} | Missing remediated: {cleaningStatus.data.missing_values_remediated} | New Quality Score: <strong>{cleaningStatus.data.new_quality_score}% ({cleaningStatus.data.new_grade})</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESCRIPTIVE STATISTICS SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'statistics' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="py-16 text-center text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              Calculating descriptive statistics and frequencies...
            </div>
          ) : stats && (
            <div className="space-y-6">
              
              {/* Numerical Summary Table */}
              <div className={`p-5 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
                <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader}`}>
                  Descriptive Statistics (Numerical Columns)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Column</th>
                        <th className="py-2.5 px-3">Count</th>
                        <th className="py-2.5 px-3">Mean</th>
                        <th className="py-2.5 px-3">Std Dev</th>
                        <th className="py-2.5 px-3">Min</th>
                        <th className="py-2.5 px-3">25% (Q1)</th>
                        <th className="py-2.5 px-3">Median</th>
                        <th className="py-2.5 px-3">75% (Q3)</th>
                        <th className="py-2.5 px-3">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(stats.numeric_summary).map(([col, s]) => (
                        <tr key={col} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-cyan-400">{col}</td>
                          <td className="py-2.5 px-3">{s.count.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-white font-bold">{s.mean}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{s.std}</td>
                          <td className="py-2.5 px-3 text-rose-400">{s.min}</td>
                          <td className="py-2.5 px-3">{s.q25}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{s.median}</td>
                          <td className="py-2.5 px-3">{s.q75}</td>
                          <td className="py-2.5 px-3 text-cyan-400">{s.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Categorical Distribution Cards */}
              <div className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader}`}>
                  Categorical Value Distributions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(stats.categorical_summary).map(([col, cat]) => (
                    <div key={col} className={`p-4 rounded-xl border ${borderLight} ${cardBg} space-y-3`}>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-bold text-white text-xs uppercase">{col}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{cat.distinct_count} distinct</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        {Object.entries(cat.top_frequencies).map(([val, cnt]) => {
                          const pct = ((cnt / (stats.total_records || 1)) * 100).toFixed(1);
                          return (
                            <div key={val} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-300 truncate max-w-[150px]">{val || 'null'}</span>
                                <span className="text-cyan-400">{cnt} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
