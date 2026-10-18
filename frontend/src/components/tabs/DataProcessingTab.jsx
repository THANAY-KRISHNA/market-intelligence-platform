import React, { useState } from 'react';
import axios from 'axios';
import { 
  Play, RefreshCw, CheckCircle, Clock, Zap, AlertCircle, 
  Layers, Database, ArrowRight, Cpu, BarChart2, Shield 
} from 'lucide-react';

export default function DataProcessingTab({ darkMode, onPipelineFinished, pipelineHistory, defaultDatasetId = 'default' }) {
  const [running, setRunning] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [history, setHistory] = useState(pipelineHistory || []);
  const [selectedDataset, setSelectedDataset] = useState(defaultDatasetId);

  const handleRunPipeline = async () => {
    setRunning(true);
    try {
      const res = await axios.post(`/api/pipeline/run?dataset_id=${selectedDataset}`);
      setActiveRun(res.data);
      setHistory(prev => [res.data, ...prev].slice(0, 20));
      if (onPipelineFinished) onPipelineFinished();
    } catch (err) {
      console.error("Pipeline run error:", err);
    } finally {
      setRunning(false);
    }
  };

  const currentDisplayRun = activeRun || (history.length > 0 ? history[0] : null);

  const cardBg = darkMode ? 'glass-panel' : 'glass-panel-light';
  const borderLight = darkMode ? 'border-white/5' : 'border-slate-200';
  const textMuted = darkMode ? 'text-zinc-400' : 'text-slate-500';
  const textHeader = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-6">

      {/* 🚀 Header & Run Pipeline Action */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-full">
            <Zap className="w-3 h-3 text-purple-400" />
            7-Stage Micro-Batch Processing Architecture
          </div>
          <h2 className={`text-xl md:text-2xl font-black tracking-tight ${textHeader}`}>
            Big Data Processing Pipeline Workflow
          </h2>
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Executes end-to-end ingestion, schema validation, data deduplication, NLTK VADER sentiment scoring, 5-minute sliding window aggregations, Pearson correlation matrices, and signal dispatching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Executing Pipeline...' : 'Process Dataset Now'}
          </button>
        </div>
      </div>

      {/* ⚡ Visual Pipeline Stages Flow Diagram */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-6`}>
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader} flex items-center gap-2`}>
            <Layers className="w-4 h-4 text-cyan-400" />
            Live Pipeline Stage Breakdown
          </h3>
          {currentDisplayRun && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Run ID: {currentDisplayRun.run_id} &bull; Total: {currentDisplayRun.duration_ms} ms
            </span>
          )}
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {[
            { num: 1, name: 'Ingestion', sub: 'Buffer & Stream', color: 'cyan', rec: currentDisplayRun?.records_processed || 10020 },
            { num: 2, name: 'Validation', sub: 'Schema Check', color: 'purple', rec: currentDisplayRun?.records_processed || 10020 },
            { num: 3, name: 'Deduplication', sub: 'Sanitization', color: 'pink', rec: currentDisplayRun?.records_processed || 10000 },
            { num: 4, name: 'NLP Scoring', sub: 'VADER Engine', color: 'emerald', rec: currentDisplayRun?.records_processed || 10000 },
            { num: 5, name: '5-Min Windows', sub: 'Rolling Velocity', color: 'amber', rec: 1288 },
            { num: 6, name: 'Correlation', sub: 'Pearson Score', color: 'cyan', rec: 8 },
            { num: 7, name: 'Signals & Alerts', sub: 'Rule Trigger', color: 'purple', rec: 8 }
          ].map((stage, idx) => (
            <div 
              key={stage.num} 
              className={`p-3.5 rounded-xl border relative transition-all ${
                running 
                  ? 'border-cyan-400/50 bg-cyan-500/10 animate-pulse' 
                  : (darkMode ? 'bg-zinc-950/60 border-white/5' : 'bg-slate-50 border-slate-200')
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-black text-[10px] flex items-center justify-center">
                  {stage.num}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400">OK</span>
              </div>
              <h4 className="font-extrabold text-xs text-white leading-tight">{stage.name}</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">{stage.sub}</p>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span>Records:</span>
                <strong className="text-white">{stage.rec.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Stage Execution Telemetry */}
        {currentDisplayRun && currentDisplayRun.stages && (
          <div className="overflow-x-auto pt-4 border-t border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Pipeline Stage</th>
                  <th className="py-2.5 px-3">Operation Details</th>
                  <th className="py-2.5 px-3">Execution Latency</th>
                  <th className="py-2.5 px-3">Records In</th>
                  <th className="py-2.5 px-3">Records Out</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentDisplayRun.stages.map((st, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{st.stage}</td>
                    <td className="py-2.5 px-3 text-zinc-300 font-sans">{st.description}</td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">{st.duration_ms} ms</td>
                    <td className="py-2.5 px-3">{st.records_in.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{st.records_out.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📜 Historical Pipeline Processing Runs Log */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${textHeader}`}>
              Execution Audit Log (Past Pipeline Runs)
            </h3>
            <p className={`text-[10px] ${textMuted} mt-0.5`}>
              Verified processing runs recorded with start/completion timestamps and record throughput
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">{history.length} Runs Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Dataset</th>
                <th className="py-2.5 px-3">Start Timestamp</th>
                <th className="py-2.5 px-3">Records In</th>
                <th className="py-2.5 px-3">Duration (ms)</th>
                <th className="py-2.5 px-3">Throughput</th>
                <th className="py-2.5 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((run, i) => (
                <tr key={run.run_id || i} className="hover:bg-white/5">
                  <td className="py-2.5 px-3 font-bold text-white">{run.run_id}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{run.dataset_id}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{new Date(run.start_time).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3">{run.records_processed?.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-purple-400 font-bold">{run.duration_ms} ms</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {run.throughput_records_sec?.toLocaleString()} rec/s
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
