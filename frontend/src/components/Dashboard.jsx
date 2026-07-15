import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  TrendingUp, TrendingDown, RefreshCw, Cpu, MessageSquare, 
  Send, Database, Activity, Wifi, Grid, ListFilter, Play, AlertCircle, FileText,
  LayoutDashboard, BarChart2, Bell, Compass, Settings, Shield, Globe2, HelpCircle
} from 'lucide-react';
import Correlation from './Correlation';
import AlertList from './AlertList';
import confetti from 'canvas-confetti';

const TICKERS = ["TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"];

const CORRELATION_MATRIX = {
  TSLA: { TSLA: 1.0, AAPL: 0.24, NVDA: 0.58, MSFT: 0.12, META: 0.35, AMZN: 0.44, GOOGL: 0.18, NFLX: 0.22 },
  AAPL: { TSLA: 0.24, AAPL: 1.0, NVDA: 0.45, MSFT: 0.72, META: 0.52, AMZN: 0.61, GOOGL: 0.68, NFLX: 0.38 },
  NVDA: { TSLA: 0.58, AAPL: 0.45, NVDA: 1.0, MSFT: 0.48, META: 0.62, AMZN: 0.55, GOOGL: 0.51, NFLX: 0.29 },
  MSFT: { TSLA: 0.12, AAPL: 0.72, NVDA: 0.48, MSFT: 1.0, META: 0.58, AMZN: 0.65, GOOGL: 0.81, NFLX: 0.42 },
  META: { TSLA: 0.35, AAPL: 0.52, NVDA: 0.62, MSFT: 0.58, META: 1.0, AMZN: 0.59, GOOGL: 0.60, NFLX: 0.47 },
  AMZN: { TSLA: 0.44, AAPL: 0.61, NVDA: 0.55, MSFT: 0.65, META: 0.59, AMZN: 1.0, GOOGL: 0.66, NFLX: 0.51 },
  GOOGL: { TSLA: 0.18, AAPL: 0.68, NVDA: 0.51, MSFT: 0.81, META: 0.60, AMZN: 0.66, GOOGL: 1.0, NFLX: 0.39 },
  NFLX: { TSLA: 0.22, AAPL: 0.38, NVDA: 0.29, MSFT: 0.42, META: 0.47, AMZN: 0.51, GOOGL: 0.39, NFLX: 1.0 }
};

export default function Dashboard({ user, onBackToLanding }) {
  const [tickers, setTickers] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('TSLA');
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dataSource, setDataSource] = useState('mock'); // mock | live
  const [latency, setLatency] = useState(8);
  const [apiStatus, setApiStatus] = useState('operational');
  
  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Systems online. Ask me about stock correlations, VADER/FinBERT sentiment scoring, or macro Fear & Greed levels." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Ingestion metrics
  const [ingestRate, setIngestRate] = useState(124);
  const [wsConnected, setWsConnected] = useState(false);

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  const fetchDashboardData = async () => {
    const startTime = Date.now();
    try {
      const summaryRes = await axios.get('/api/market-summary');
      setTickers(summaryRes.data.tickers);
      
      const dashRes = await axios.get('/api/dashboard');
      setDashboardSummary(dashRes.data);
      
      const alertRes = await axios.get('/api/alerts');
      setAlerts(alertRes.data);
      
      setLatency(Date.now() - startTime);
      setApiStatus('operational');
    } catch (err) {
      console.error(err);
      setApiStatus('degraded');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);

    // Ingestion speed volatility simulation
    const speedInterval = setInterval(() => {
      setIngestRate(prev => Math.max(80, Math.min(250, prev + Math.floor(Math.random() * 21) - 10)));
    }, 2000);

    // Keyboard Shortcuts (Cmd/Ctrl + K)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // WS Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
    };
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'new_ticks') {
        setTickers(prev => prev.map(t => {
          const matched = payload.data.find(x => x.ticker === t.ticker);
          return matched ? { ...t, current_price: matched.price, volume: matched.volume } : t;
        }));
      } else if (payload.type === 'new_alerts') {
        setAlerts(prev => [...payload.data, ...prev].slice(0, 50));
        const matchedBuy = payload.data.find(x => x.message.includes('Strong BUY'));
        if (matchedBuy) {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6'] });
        }
      }
    };
    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      clearInterval(interval);
      clearInterval(speedInterval);
      window.removeEventListener('keydown', handleKeyDown);
      ws.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleDataSource = async () => {
    const nextSource = dataSource === 'mock' ? 'live' : 'mock';
    setDataSource(nextSource);
    try {
      await axios.post('/api/reset');
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const userQuery = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userQuery }]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      let reply = "I analyzed the database. ";
      const queryLower = userQuery.toLowerCase();
      
      if (queryLower.includes('nvda') || queryLower.includes('nvidia')) {
        reply = "NVDA correlation coefficient is currently at +0.58. The rolling VADER sentiment score shows strong bullish accumulation (+0.72) linked to high social view counts, triggering momentum BUY signals.";
      } else if (queryLower.includes('tsla') || queryLower.includes('tesla')) {
        reply = "TSLA Pearson coefficient shows negative divergence (-0.28). Social volume is extremely high, but high bot probabilities (42%) and weak VADER scores suggest taking caution ahead of key technical thresholds.";
      } else if (queryLower.includes('fear') || queryLower.includes('greed') || queryLower.includes('mood')) {
        reply = `The aggregate market sentiment index is currently at ${dashboardSummary?.fear_greed_score || 54} (${dashboardSummary?.market_mood || 'NEUTRAL'}). Discussions are concentrated heavily in tech tickers, with NVDA and TSLA leading volume.`;
      } else {
        reply = "I ran Pearson correlation scans across active streams. Sentiment momentum has turned positive for tech giants (AAPL, MSFT) but remains neutral for media streams (NFLX). Use the matrix below to spot sector discrepancies.";
      }
      
      setChatHistory(prev => [...prev, { role: 'assistant', text: reply }]);
      setChatLoading(false);
    }, 1000);
  };

  const handleCSVExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,Ticker,Price,Volume,AvgSentiment,Signal\n";
    tickers.forEach(t => {
      csvContent += `${t.ticker},${t.current_price},${t.volume},${t.avg_sentiment},${t.signal}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "market_sentiment_correlation_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickers = tickers.filter(t => t.ticker.toLowerCase().includes(paletteSearch.toLowerCase()));
  const f_g_score = dashboardSummary?.fear_greed_score || 50;
  const f_g_mood = dashboardSummary?.market_mood || 'NEUTRAL';
  const f_g_rotation = (f_g_score / 100) * 180 - 90;

  return (
    <div className="flex min-h-screen bg-[#030303] text-zinc-100 font-sans">
      
      {/* 🧭 Left Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#050508]/80 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div 
            onClick={onBackToLanding} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span className="text-2xl text-cyan-400 group-hover:scale-110 transition-transform">🌊</span>
            <span className="text-lg font-black text-white tracking-tighter uppercase">TradeFlow</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-400 text-[11px] font-black uppercase tracking-wider rounded-r-lg">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <BarChart2 className="h-4 w-4" />
              Markets
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <Compass className="h-4 w-4" />
              Sentiment
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <Cpu className="h-4 w-4" />
              Signals
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <ListFilter className="h-4 w-4" />
              Watchlist
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <Bell className="h-4 w-4" />
              Alerts
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <FileText className="h-4 w-4" />
              News
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <Activity className="h-4 w-4" />
              Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all">
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-6 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center justify-between px-2 text-zinc-500">
            <span>Dark Mode</span>
            <span className="text-cyan-400 font-black">Active</span>
          </div>

          <div 
            onClick={onBackToLanding} 
            className="flex items-center gap-3 p-2 bg-zinc-950 border border-white/5 hover:border-cyan-400/30 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-black">
              TF
            </div>
            <div className="text-left font-sans">
              <span className="text-white block font-extrabold text-[10px]">TradeFlow Pro</span>
              <span className="text-zinc-500 text-[8px] block font-medium mt-0.5">Upgrade Account &rarr;</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 🖥️ Main Scrollable Grid Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-6 md:p-8 space-y-8">
        
        {/* Top Header bar */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              Market Overview
            </h1>
            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">Real-time snapshot of market sentiment and performance</p>
          </div>

          {/* Search bar & Live Toggle Telemetry */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                onClick={() => setPaletteOpen(true)}
                className="bg-zinc-900/40 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 placeholder-zinc-600 rounded-xl px-4 py-2.5 w-60 focus:outline-none focus:border-cyan-400"
                placeholder="Search assets, markets, news..."
              />
              <span className="absolute right-3 top-2.5 text-zinc-600 text-xs">Ctrl+K</span>
            </div>

            {/* Status Telemetry */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 bg-zinc-950 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Market Open
              </div>
              <div className="text-zinc-400 border-l border-white/10 pl-3">
                09:41 AM
              </div>
            </div>

            {/* Live Feed Toggle */}
            <button 
              onClick={toggleDataSource}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/25"
            >
              Toggle {dataSource === 'live' ? 'Sim' : 'Live'}
            </button>
          </div>
        </section>

        {/* 📈 Indexes Cards row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: S&P 500 */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-cyan-400">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">S&P 500</span>
              <span className="text-lg font-black text-white font-mono block">5,278.40</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">+1.32%</span>
            </div>
            <svg className="w-14 h-8 text-emerald-400 opacity-60" viewBox="0 0 50 20">
              <path d="M0 16 Q 12 18, 25 8 T 50 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card 2: NASDAQ 100 */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">NASDAQ 100</span>
              <span className="text-lg font-black text-white font-mono block">18,405.59</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">+1.85%</span>
            </div>
            <svg className="w-14 h-8 text-emerald-400 opacity-60" viewBox="0 0 50 20">
              <path d="M0 18 Q 15 15, 30 10 T 50 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card 3: Bitcoin */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-pink-500">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Bitcoin</span>
              <span className="text-lg font-black text-white font-mono block">$66,384.21</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">+2.91%</span>
            </div>
            <svg className="w-14 h-8 text-emerald-400 opacity-60" viewBox="0 0 50 20">
              <path d="M0 18 Q 12 12, 25 6 T 50 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card 4: VIX */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-zinc-500">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">VIX</span>
              <span className="text-lg font-black text-white font-mono block">12.45</span>
              <span className="text-[10px] font-bold text-rose-500 font-mono flex items-center gap-1">-3.21%</span>
            </div>
            <svg className="w-14 h-8 text-rose-500 opacity-60" viewBox="0 0 50 20">
              <path d="M0 2 Q 12 8, 25 15 T 50 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </section>

        {/* 📊 Main Charts Layout (Sentiment vs Price & Gauge) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main timeline */}
          <div className="lg:col-span-8 glass-panel border-neon-glow rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  Sentiment vs Price (Rolling Analysis)
                </h2>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide mt-1">Stock price overlaid with sentiment indexes</p>
              </div>
            </div>
            <Correlation ticker={selectedTicker} />
          </div>

          {/* Market mood dial */}
          <div className="lg:col-span-4 glass-panel border-violet-glow rounded-2xl p-6 flex flex-col justify-between">
            <div className="border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">Market Sentiment</h2>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide mt-1">Aggregated fear & greed mood dials</p>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-4 my-auto">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Circular indicator ring */}
                <div className="absolute inset-0 rounded-full border-[10px] border-zinc-900"></div>
                <div className="absolute inset-0 rounded-full border-[10px] border-cyan-400/20" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                {/* Glowing center text */}
                <div className="text-center">
                  <span className="text-5xl font-black text-white font-mono block leading-none">{f_g_score}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1 block">{f_g_mood}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-wide">+12.4% vs last hour</p>
            </div>

            {/* Micro rolling sentiment line */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sentiment Trend (1H)</span>
              <svg className="w-20 h-6 text-emerald-400" viewBox="0 0 50 20">
                <path d="M0 18 L 10 16 L 20 18 L 30 10 L 40 12 L 50 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </section>

        {/* 🖥️ Watchlist, Heatmap & Signal List Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Movers List (4 Columns) */}
          <div className="lg:col-span-4 glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 border-b border-white/5 pb-3">
              <ListFilter className="h-4.5 w-4.5 text-cyan-400" />
              Top Movers
            </h3>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {tickers.slice(0, 5).map(t => {
                const changeColor = t.price_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
                return (
                  <div key={t.ticker} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-white/5 rounded-xl hover:border-cyan-400/20 transition-all">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-xs text-white block">${t.ticker}</span>
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">vol {t.volume.toLocaleString()}</span>
                    </div>
                    <div className="text-right space-y-0.5 font-mono">
                      <span className="text-xs font-bold text-zinc-200 block">${t.current_price.toFixed(2)}</span>
                      <span className={`text-[9px] font-bold ${changeColor}`}>{t.price_change_pct >= 0 ? '+' : ''}{t.price_change_pct.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correlation Matrix Heatmap (5 Columns) */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 border-b border-white/5 pb-3">
              <Grid className="h-4.5 w-4.5 text-purple-400" />
              Correlation Heatmap (24H)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500">
                    <th className="pb-2">ID</th>
                    {TICKERS.slice(0, 4).map(t => <th key={t} className="pb-2 text-center">{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TICKERS.slice(0, 4).map(t1 => (
                    <tr key={t1} className="border-b border-white/5">
                      <td className="py-2 font-bold text-zinc-300">${t1}</td>
                      {TICKERS.slice(0, 4).map(t2 => {
                        const corr = CORRELATION_MATRIX[t1][t2];
                        const isDiagonal = t1 === t2;
                        let cellColor = corr > 0.5 ? 'text-emerald-400 bg-emerald-500/10' : (corr < 0.2 ? 'text-rose-400 bg-rose-500/5' : 'text-zinc-500 bg-zinc-950/40');
                        if (isDiagonal) cellColor = 'text-cyan-400 bg-cyan-500/15 font-black';
                        return (
                          <td key={t2} className={`py-2 text-center border border-white/5 ${cellColor}`}>
                            {corr.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Trading Signals list (3 Columns) */}
          <div className="lg:col-span-3 glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="h-4.5 w-4.5 text-pink-400" />
              AI Trading Signals
            </h3>
            <div className="space-y-3 text-[10px] font-bold uppercase tracking-wider">
              {tickers.slice(0, 5).map(t => {
                const signalColor = t.signal === 'BUY' ? 'text-emerald-400' : (t.signal === 'SELL' ? 'text-rose-400' : 'text-zinc-400');
                const confidence = Math.round(50 + Math.random() * 45);
                return (
                  <div key={t.ticker} className="flex items-center justify-between p-2.5 bg-zinc-950/40 border border-white/5 rounded-xl">
                    <span className="text-zinc-300 font-mono font-black">${t.ticker}</span>
                    <span className={`font-black ${signalColor}`}>{t.signal}</span>
                    <span className="text-zinc-500 font-mono">{confidence}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 📰 News & Events & Upgrade to Pro Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* News Feed Grid (8 Columns) */}
          <div className="lg:col-span-8 glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-3">
              News & Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* News Item 1 */}
              <div className="glass-panel p-3 rounded-xl space-y-3 flex flex-col justify-between">
                <img src="/images/news_nvidia.png" alt="NVIDIA" className="w-full h-24 object-cover rounded-lg border border-white/5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug">NVIDIA hits new all-time high driven by AI demand surge</h4>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">2m ago &bull; Reuters</span>
                </div>
              </div>
              {/* News Item 2 */}
              <div className="glass-panel p-3 rounded-xl space-y-3 flex flex-col justify-between">
                <img src="/images/news_tesla.png" alt="Tesla" className="w-full h-24 object-cover rounded-lg border border-white/5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug">Tesla Q2 deliveries beat wall street expectations</h4>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">5m ago &bull; Bloomberg</span>
                </div>
              </div>
              {/* News Item 3 */}
              <div className="glass-panel p-3 rounded-xl space-y-3 flex flex-col justify-between">
                <img src="/images/news_fed.png" alt="Fed Rate Cuts" className="w-full h-24 object-cover rounded-lg border border-white/5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug">Fed hints at potential interest rate cuts in September</h4>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">15m ago &bull; CNBC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade to Pro card (4 Columns) */}
          <div 
            className="lg:col-span-4 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between bg-cover bg-center border border-white/5 min-h-[220px]"
            style={{ backgroundImage: `url('/images/pro_banner.png')` }}
          >
            <div className="absolute inset-0 bg-[#000000]/45 backdrop-blur-xs pointer-events-none"></div>
            <div className="relative z-10 space-y-2">
              <span className="px-2 py-0.5 bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-[8px] font-black tracking-widest rounded uppercase">PRO PACK</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-snug pt-1">Upgrade to Pro</h3>
              <p className="text-[10px] text-zinc-300 font-medium leading-relaxed">Unlock advanced sentiment models, custom portfolios, alerts, and correlation scanning APIs.</p>
            </div>
            <button className="relative z-10 w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-[#030303] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-400/20 mt-4">
              Upgrade Now &rarr;
            </button>
          </div>
        </section>

        {/* 🔮 Pluggable AI Chat Terminal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <div className="glass-panel border-violet-glow rounded-2xl p-6 space-y-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-3.5">
                <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
                Pluggable AI Copilot Assistant
              </h3>
              <div className="h-48 overflow-y-auto space-y-4 pr-2 text-[11px] font-mono scrollbar-thin">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 p-3.5 rounded-xl border ${msg.role === 'assistant' ? 'bg-zinc-900/40 border-white/5 text-zinc-300 rounded-tl-none' : 'bg-purple-950/20 border-purple-500/30 text-purple-200 rounded-tr-none shadow-md shadow-purple-500/5'}`}>
                    <span className={`font-black uppercase tracking-widest text-[8px] ${msg.role === 'assistant' ? 'text-cyan-400' : 'text-purple-400'}`}>
                      {msg.role === 'assistant' ? '🤖 AI Copilot' : '👤 You'}
                    </span>
                    <p className="leading-relaxed font-sans text-xs mt-1">{msg.text}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-purple-400 animate-pulse text-[9px] font-black uppercase tracking-widest pl-1">
                    ⚡ COMPILING MACRO PARAMETERS...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-755 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                  placeholder="Ask AI Copilot (e.g., 'Why is NVDA bullish?' or 'Explain current Fear & Greed level')..."
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-black rounded-xl text-xs transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/25"
                >
                  <Send className="h-3.5 w-3.5" />
                  QUERY
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 glass-panel border-violet-glow rounded-2xl p-5 h-[340px] overflow-hidden flex flex-col justify-between">
            <AlertList alerts={alerts} />
          </div>
        </section>

        {/* 🔐 Footer Row */}
        <footer className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-white/5 pt-8 text-left text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
              <Wifi className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white block uppercase tracking-wider">Lightning Fast</span>
              <span className="text-[8px] font-medium block mt-0.5">&lt;150ms real-time telemetry</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-purple-400">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white block uppercase tracking-wider">Institutional Grade</span>
              <span className="text-[8px] font-medium block mt-0.5">Secure, scalable environment</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-pink-400">
              <Globe2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white block uppercase tracking-wider">Multi-Asset Support</span>
              <span className="text-[8px] font-medium block mt-0.5">Stocks, Crypto, Indices, Forex</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-white block uppercase tracking-wider">Advanced AI Models</span>
              <span className="text-[8px] font-medium block mt-0.5">NLP Sentiment & Correlation</span>
            </div>
          </div>
        </footer>

      </main>

      {/* ⌨️ Command Palette Toggle Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 bg-[#030303]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 p-4 border-b border-white/5">
              <span className="text-zinc-500 text-sm">🔍</span>
              <input
                type="text"
                autoFocus
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none"
                placeholder="Search tickers or commands (type ticker name)..."
              />
              <button 
                onClick={() => setPaletteOpen(false)}
                className="text-[10px] font-mono text-zinc-500 border border-white/10 px-2 py-0.5 rounded"
              >
                ESC
              </button>
            </div>
            
            <div className="p-2 max-h-60 overflow-y-auto">
              <span className="text-[10px] font-mono text-zinc-600 p-2 block uppercase tracking-wider">Tickers Found</span>
              {filteredTickers.map(t => (
                <div
                  key={t.ticker}
                  onClick={() => {
                    setSelectedTicker(t.ticker);
                    setPaletteOpen(false);
                  }}
                  className="p-3 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between items-center text-xs"
                >
                  <span className="font-bold text-zinc-200">${t.ticker}</span>
                  <span className="text-zinc-500 font-mono">${t.current_price.toFixed(2)}</span>
                </div>
              ))}
              {filteredTickers.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-700">No results found matching search query.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cmd+K Helper Badge */}
      <div className="fixed bottom-6 left-6 z-40 bg-zinc-950/80 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 pointer-events-none">
        <span className="px-1.5 py-0.5 bg-white/5 rounded">Ctrl + K</span>
        <span>Search Everywhere</span>
      </div>

    </div>
  );
}
