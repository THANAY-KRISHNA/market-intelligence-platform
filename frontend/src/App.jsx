import React, { useState, useEffect, useRef } from 'react';
import Landing3D from './components/Landing3D';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, CheckCircle, Database, Network } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('tradeflow_theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('tradeflow_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-300 overflow-x-hidden ${darkMode ? 'bg-[#030303] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 🔮 Master 3D WebGL Backdrop (always active, darkens in dashboard view) */}
      <Landing3D chapter={view === 'landing' ? 1 : 8} onSelectExchange={setSelectedExchange} />

      {/* 🚀 TradeFlow App View Controller */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 min-h-screen w-full flex flex-col justify-between p-6 md:p-12"
          >
            {/* Header Navbar */}
            <header className={`flex items-center justify-between max-w-7xl w-full mx-auto pb-6 border-b ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black tracking-tighter uppercase flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-cyan-400">🌊</span> TradeFlow
                </span>
              </div>
              
              <nav className={`hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                <a href="#product" className="hover:text-cyan-400 transition-colors">Product</a>
                <a href="#markets" className="hover:text-cyan-400 transition-colors">Markets</a>
                <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
                <a href="#docs" className="hover:text-cyan-400 transition-colors">Docs</a>
                <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDarkMode}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    darkMode ? 'bg-zinc-900 text-cyan-400 border-white/10' : 'bg-white text-slate-800 border-slate-300 shadow-sm'
                  }`}
                  title="Toggle Theme Mode"
                >
                  {darkMode ? '🌙 Dark' : '☀️ Light'}
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-[10px] rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/25 uppercase tracking-widest"
                >
                  Launch App
                </button>
              </div>
            </header>

            {/* Hero Main Content */}
            <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-16">
              {/* Left Hero Texts */}
              <div className="lg:col-span-7 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Real-Time Intelligence for Smarter Trades
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none uppercase">
                  Predict markets. <br />
                  Track sentiment. <br />
                  Trade with <span className="text-neon-gradient">edge.</span>
                </h1>

                <p className="text-base md:text-lg text-zinc-400 max-w-xl font-medium leading-relaxed">
                  AI-powered sentiment analysis meets real-time market data to deliver actionable trading insights before the crowd moves.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                  >
                    Explore Dashboard &rarr;
                  </button>
                  <button 
                    onClick={() => setView('dashboard')}
                    className="px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all hover:bg-white/10 active:scale-95"
                  >
                    Watch Demo
                  </button>
                </div>
              </div>

              {/* Right Hero Planet Image */}
              <div className="lg:col-span-5 flex justify-center relative select-none">
                <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent blur-2xl pointer-events-none"></div>
                <motion.img 
                  initial={{ y: -10 }}
                  animate={{ y: 10 }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  src="/images/hero_planet.png" 
                  alt="TradeFlow Globe" 
                  className="w-full max-w-[420px] object-contain drop-shadow-[0_0_50px_rgba(0,242,254,0.15)]"
                />
              </div>
            </main>

            {/* Features & Telemetry Row */}
            <div className="max-w-7xl w-full mx-auto space-y-16 pb-12">
              
              {/* Section: Built for traders who demand more */}
              <section className="py-8 space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Built for traders who demand more</h2>
                  <p className="text-xs md:text-sm text-zinc-400 max-w-2xl mx-auto font-medium">TradeFlow combines real-time social sentiment, advanced AI models, and market data correlation to help you anticipate moves and trade confidently.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-t border-t-cyan-400/20 text-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto text-cyan-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Real-Time Sentiment</h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Analyze millions of messages in real-time with AI-powered sentiment engines.</p>
                  </div>

                  <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-t border-t-purple-500/20 text-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400">
                      <Network className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Price Correlation</h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Identify strong sentiment-price correlations across multiple timeframes.</p>
                  </div>

                  <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-t border-t-emerald-400/20 text-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Trading Signals</h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Get actionable BUY / SELL signals with confidence scores.</p>
                  </div>

                  <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-t border-t-pink-500/20 text-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto text-pink-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Smart Alerts</h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Never miss opportunities with intelligent, real-time alert notifications.</p>
                  </div>
                </div>
              </section>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-b border-white/5 py-8 text-center bg-zinc-950/10 backdrop-blur-sm rounded-2xl p-4">
                <div>
                  <span className="text-3xl font-black text-white block font-mono">1.2M+</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">Messages Analyzed</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white block font-mono">98.7%</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">Model Accuracy</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white block font-mono">50+</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">Data Sources</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white block font-mono">&lt; 150ms</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">Real-time Latency</span>
                </div>
              </div>

              {/* Trusted row */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-600 text-xs font-bold uppercase tracking-widest pt-4">
                <span className="text-[9px] text-zinc-500 font-black tracking-widest">TRUSTED BY TRADERS & INSTITUTIONS</span>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-50 text-[10px] font-black uppercase tracking-wider">
                  <span className="hover:text-white transition-colors cursor-default">Bloomberg</span>
                  <span className="hover:text-white transition-colors cursor-default">Refinitiv</span>
                  <span className="hover:text-white transition-colors cursor-default">Nasdaq</span>
                  <span className="hover:text-white transition-colors cursor-default">CoinDesk</span>
                  <span className="hover:text-white transition-colors cursor-default">Yahoo Finance</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full"
          >
            <Dashboard onBackToLanding={() => setView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌍 3D Clicked Exchange Detail Overlay Dialog */}
      <AnimatePresence>
        {selectedExchange && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-panel p-6 rounded-xl border border-white/10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-white text-lg">{selectedExchange.name} Exchange</span>
                <button 
                  onClick={() => setSelectedExchange(null)}
                  className="text-zinc-500 hover:text-white text-xs font-mono"
                >
                  [CLOSE]
                </button>
              </div>
              
              <div className="space-y-2 text-xs font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Network Latency:</span>
                  <strong className="text-emerald-400">{selectedExchange.latency}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Transaction Load:</span>
                  <strong className="text-white">{selectedExchange.load}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Routing Cluster:</span>
                  <strong className="text-white">US-EAST-4B</strong>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
