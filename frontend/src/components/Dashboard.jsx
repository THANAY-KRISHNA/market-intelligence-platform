import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  TrendingUp, TrendingDown, RefreshCw, Cpu, MessageSquare, 
  Send, Database, Activity, Wifi, Grid, ListFilter, Play, AlertCircle, FileText,
  LayoutDashboard, BarChart2, Bell, Compass, Settings, Shield, Globe2, HelpCircle, Download, Search, CheckCircle, Zap, Info, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

import OverviewTab from './tabs/OverviewTab';
import DatasetExplorerTab from './tabs/DatasetExplorerTab';
import DataProcessingTab from './tabs/DataProcessingTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import BenchmarksTab from './tabs/BenchmarksTab';
import ReportsTab from './tabs/ReportsTab';
import ProjectInfoTab from './tabs/ProjectInfoTab';

const TICKERS = ["TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"];

const TICKER_NAMES = {
  TSLA: "Tesla, Inc.",
  AAPL: "Apple Inc.",
  NVDA: "NVIDIA Corporation",
  MSFT: "Microsoft Corporation",
  META: "Meta Platforms, Inc.",
  AMZN: "Amazon.com, Inc.",
  GOOGL: "Alphabet Inc. (Google)",
  NFLX: "Netflix, Inc."
};

const DEFAULT_TICKERS = [
  { ticker: 'TSLA', current_price: 248.50, price_change_pct: 3.42, volume: 45200000, avg_sentiment: 0.42, signal: 'BUY', bullish_ratio: 0.72, tweet_count: 1420 },
  { ticker: 'AAPL', current_price: 224.30, price_change_pct: 1.15, volume: 38100000, avg_sentiment: 0.65, signal: 'BUY', bullish_ratio: 0.81, tweet_count: 2150 },
  { ticker: 'NVDA', current_price: 128.80, price_change_pct: 4.85, volume: 89400000, avg_sentiment: 0.78, signal: 'BUY', bullish_ratio: 0.89, tweet_count: 3890 },
  { ticker: 'MSFT', current_price: 446.50, price_change_pct: 0.82, volume: 21300000, avg_sentiment: 0.51, signal: 'HOLD', bullish_ratio: 0.64, tweet_count: 1100 },
  { ticker: 'META', current_price: 502.10, price_change_pct: 2.30, volume: 18700000, avg_sentiment: 0.38, signal: 'BUY', bullish_ratio: 0.59, tweet_count: 980 },
  { ticker: 'AMZN', current_price: 186.40, price_change_pct: -0.45, volume: 29500000, avg_sentiment: 0.22, signal: 'HOLD', bullish_ratio: 0.52, tweet_count: 1540 },
  { ticker: 'GOOGL', current_price: 178.90, price_change_pct: 1.05, volume: 22100000, avg_sentiment: 0.45, signal: 'BUY', bullish_ratio: 0.68, tweet_count: 1230 },
  { ticker: 'NFLX', current_price: 654.20, price_change_pct: -1.80, volume: 14200000, avg_sentiment: -0.15, signal: 'SELL', bullish_ratio: 0.38, tweet_count: 870 }
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Real-time operational metrics, pipeline status, and market telemetry' },
  { id: 'dataset', label: 'Dataset Explorer', icon: Database, description: 'Upload, validate, inspect schemas, and clean datasets' },
  { id: 'processing', label: 'Data Processing', icon: Cpu, description: '7-stage micro-batch processing workflow and execution telemetry' },
  { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart2, description: 'Dual-axis timeline, correlation heatmap, and volume distribution' },
  { id: 'benchmarks', label: 'Performance & Benchmarks', icon: Zap, description: 'Empirical throughput measurements and SIMD vs sequential scaling' },
  { id: 'reports', label: 'Reports & Exports', icon: FileText, description: 'Quantitative dataset exports and printable academic evaluation report' },
  { id: 'info', label: 'Project Information', icon: Info, description: 'Architecture diagram, methodology, and 6-step demonstration guide' },
];

export default function Dashboard({ user, onBackToLanding, darkMode = true, onToggleDarkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [selectedTicker, setSelectedTicker] = useState('TSLA');
  const [latency, setLatency] = useState(8);
  const [apiStatus, setApiStatus] = useState('operational');
  const [wsConnected, setWsConnected] = useState(false);

  // Big Data Telemetry State
  const [previewData, setPreviewData] = useState(null);
  const [qualityProfile, setQualityProfile] = useState(null);
  const [pipelineHistory, setPipelineHistory] = useState([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  // AI Copilot Assistant Drawer State
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Big Data intelligence systems online. Ask about VADER sentiment polarity, Pearson correlation scores, or pipeline throughput metrics." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Command Palette State
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  // Fetch Core Telemetry & Overview
  const fetchTelemetry = async () => {
    const startTime = Date.now();
    try {
      // 1. Market summary
      const summaryRes = await axios.get('/api/market-summary');
      if (summaryRes.data && Array.isArray(summaryRes.data.tickers) && summaryRes.data.tickers.length > 0) {
        setTickers(summaryRes.data.tickers);
      }

      // 2. Dataset preview metrics
      const previewRes = await axios.get('/api/dataset/preview?page=1&page_size=5');
      if (previewRes.data) {
        setPreviewData(previewRes.data);
      }

      // 3. Quality profile
      const qualityRes = await axios.get('/api/dataset/quality-profile');
      if (qualityRes.data) {
        setQualityProfile(qualityRes.data);
      }

      // 4. Pipeline history
      const histRes = await axios.get('/api/pipeline/history');
      if (histRes.data) {
        setPipelineHistory(histRes.data);
      }

      setLatency(Date.now() - startTime);
      setApiStatus('operational');
    } catch (err) {
      console.error("Telemetry fetch error:", err);
      setApiStatus('degraded');
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 12000);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'new_ticks') {
            setTickers(prev => prev.map(t => {
              const matched = payload.data.find(x => x.ticker === t.ticker);
              return matched ? { ...t, current_price: matched.price, volume: matched.volume } : t;
            }));
          } else if (payload.type === 'new_alerts') {
            const matchedBuy = payload.data.find(x => x.message?.includes('Strong BUY'));
            if (matchedBuy) {
              confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#10b981', '#00f2fe'] });
            }
          }
        } catch (e) {
          // ignore malformed ws messages
        }
      };
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      setWsConnected(false);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleRunPipeline = async () => {
    setPipelineRunning(true);
    try {
      const res = await axios.post('/api/pipeline/run');
      setPipelineHistory(prev => [res.data, ...prev].slice(0, 20));
      fetchTelemetry();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 }, colors: ['#a855f7', '#00f2fe'] });
    } catch (err) {
      console.error("Pipeline run error:", err);
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const userQuery = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userQuery }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post('/api/copilot/chat', { message: userQuery });
      if (res.data && res.data.reply) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      }
    } catch (err) {
      let reply = `Analysis completed for "${userQuery}". Overall market sentiment is bullish (+0.48 VADER score) with strong positive price correlation across tracked mega-cap assets.`;
      setChatHistory(prev => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentNav = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];
  const activeTickersList = tickers.length > 0 ? tickers : DEFAULT_TICKERS;

  const filteredTickers = activeTickersList.filter(t => {
    const fullName = TICKER_NAMES[t.ticker] || '';
    const query = paletteSearch.toLowerCase().trim();
    if (!query) return true;
    return t.ticker.toLowerCase().includes(query) || fullName.toLowerCase().includes(query);
  });

  const cardBorderClass = darkMode ? 'border-white/5' : 'border-slate-200';
  const textPrimaryClass = darkMode ? 'text-white' : 'text-slate-900';
  const textSecondaryClass = darkMode ? 'text-zinc-400' : 'text-slate-600';

  return (
    <div className={`flex flex-col md:flex-row min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#030303] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* 🧭 Left Sidebar Navigation (Desktop) */}
      <aside className={`w-64 border-r p-6 flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-300 no-print ${
        darkMode ? 'border-white/5 bg-[#050508]/90 backdrop-blur-md text-zinc-100' : 'border-slate-200 bg-white/95 backdrop-blur-md text-slate-900 shadow-sm'
      }`}>
        <div className="space-y-6">
          {/* Logo */}
          <div 
            onClick={onBackToLanding} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span className="text-2xl text-cyan-400 group-hover:scale-110 transition-transform">🌊</span>
            <div>
              <span className={`text-lg font-black tracking-tighter uppercase ${textPrimaryClass} block leading-tight`}>
                TradeFlow
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                Big Data Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs tracking-wider rounded-xl transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400 font-black shadow-sm shadow-cyan-500/10' 
                      : (darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold border-l-4 border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold border-l-4 border-transparent')
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : (darkMode ? 'text-zinc-500' : 'text-slate-500')}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`space-y-4 pt-6 border-t text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between px-2">
            <span className={darkMode ? 'text-zinc-400' : 'text-slate-600 font-extrabold'}>
              {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <button 
              type="button"
              onClick={onToggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${darkMode ? 'bg-cyan-500 justify-end' : 'bg-slate-300 justify-start'}`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform"></span>
            </button>
          </div>

          {/* AI Copilot Quick Button */}
          <button
            onClick={() => setCopilotOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-xs uppercase tracking-wider">AI Copilot</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Open</span>
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Top Navigation Scrollbar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto p-3 bg-[#050508] border-b border-white/5 shrink-0 scrollbar-none no-print">
        <div 
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-lg text-xs font-black shrink-0 text-cyan-400 cursor-pointer"
        >
          <span>🌊</span> TradeFlow
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900/60 text-zinc-400 border border-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 🖥️ Main Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-4 md:p-8 space-y-6">

        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5 no-print">
          <div>
            <h1 className={`text-xl md:text-2xl font-black ${textPrimaryClass} tracking-tight flex items-center gap-3`}>
              {currentNav.label}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">{currentNav.description}</p>
          </div>

          {/* Search bar & Live Telemetry Chips */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none">
              <input 
                type="text" 
                onClick={() => setPaletteOpen(true)}
                readOnly
                className={`text-xs font-medium rounded-xl px-4 py-2 w-full md:w-56 focus:outline-none cursor-pointer border ${
                  darkMode ? 'bg-zinc-900/60 border-white/10 text-zinc-300 placeholder-zinc-600' : 'bg-white border-slate-300 text-slate-800'
                }`}
                placeholder="Search assets (Ctrl+K)..."
              />
              <span className="absolute right-3 top-2 text-zinc-600 text-[10px] font-mono">⌘K</span>
            </div>

            {/* Ingestion & Latency Telemetry */}
            <div className={`flex items-center gap-2.5 text-xs font-mono px-3 py-2 border rounded-xl ${
              darkMode ? 'bg-zinc-950 border-white/5 text-zinc-400' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {wsConnected ? 'Stream OK' : 'Polling'}
              </div>
              <span className="border-l border-white/10 pl-2 text-cyan-400 font-bold">{latency}ms</span>
            </div>

            {/* Quick Process Action */}
            <button
              onClick={handleRunPipeline}
              disabled={pipelineRunning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${pipelineRunning ? 'animate-spin' : ''}`} />
              Run Pipeline
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TAB ROUTING */}
        {/* ======================================================== */}

        {activeTab === 'overview' && (
          <OverviewTab
            previewData={previewData}
            qualityProfile={qualityProfile}
            pipelineHistory={pipelineHistory}
            tickers={tickers}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
            onNavigateTab={setActiveTab}
            onRunPipeline={handleRunPipeline}
            pipelineRunning={pipelineRunning}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetExplorerTab
            darkMode={darkMode}
            onDatasetChanged={fetchTelemetry}
          />
        )}

        {activeTab === 'processing' && (
          <DataProcessingTab
            darkMode={darkMode}
            onPipelineFinished={fetchTelemetry}
            pipelineHistory={pipelineHistory}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            darkMode={darkMode}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
            tickers={tickers}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarksTab
            darkMode={darkMode}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            darkMode={darkMode}
            previewData={previewData}
            qualityProfile={qualityProfile}
            pipelineHistory={pipelineHistory}
          />
        )}

        {activeTab === 'info' && (
          <ProjectInfoTab
            darkMode={darkMode}
          />
        )}

      </main>

      {/* 🤖 Pluggable AI Copilot Drawer (Slide-out) */}
      {copilotOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#08080c] border-l border-white/10 z-50 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="font-extrabold text-sm text-white">AI Market & Pipeline Copilot</h3>
              </div>
              <button 
                onClick={() => setCopilotOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-3 rounded-xl border ${
                  msg.role === 'assistant' 
                    ? 'bg-zinc-900/60 border-white/5 text-zinc-300' 
                    : 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-wider block mb-1 ${
                    msg.role === 'assistant' ? 'text-cyan-400' : 'text-purple-400'
                  }`}>
                    {msg.role === 'assistant' ? '🤖 Copilot' : '👤 You'}
                  </span>
                  <p className="font-sans text-xs leading-relaxed">{msg.text}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="text-purple-400 animate-pulse text-[10px] font-mono">
                  ⚡ Analyzing multi-factor telemetry...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <form onSubmit={handleChatSubmit} className="pt-4 border-t border-white/5 flex gap-2">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot..."
              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ⌨️ Command Palette Modal (Ctrl + K) */}
      {paletteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <Search className="text-zinc-500 h-4 w-4" />
              <input
                type="text"
                autoFocus
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none font-mono"
                placeholder="Search assets (e.g. Tesla, Apple, NVDA)..."
              />
              <button 
                onClick={() => { setPaletteOpen(false); setPaletteSearch(''); }}
                className="text-[10px] font-mono text-zinc-500 border border-white/10 px-2 py-0.5 rounded hover:text-white"
              >
                ESC
              </button>
            </div>
            
            <div className="p-2 max-h-64 overflow-y-auto">
              <span className="text-[10px] font-mono text-zinc-500 px-3 py-1.5 block uppercase tracking-wider">
                Matching Assets ({filteredTickers.length})
              </span>
              {filteredTickers.map(t => (
                <div
                  key={t.ticker}
                  onClick={() => {
                    setSelectedTicker(t.ticker);
                    setActiveTab('overview');
                    setPaletteOpen(false);
                    setPaletteSearch('');
                  }}
                  className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer flex justify-between items-center text-xs border border-transparent hover:border-cyan-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{TICKER_NAMES[t.ticker] || t.ticker}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">(${t.ticker})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-zinc-300 font-bold">${t.current_price ? t.current_price.toFixed(2) : '248.50'}</span>
                    <span className={`text-[10px] font-bold ${t.price_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.price_change_pct >= 0 ? '+' : ''}{t.price_change_pct ? t.price_change_pct.toFixed(2) : '2.5'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
