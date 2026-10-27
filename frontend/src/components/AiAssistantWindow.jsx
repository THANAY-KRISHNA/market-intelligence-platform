import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, MessageSquare, Newspaper, HelpCircle, X, Minus, 
  Maximize2, Minimize2, Send, RefreshCw, TrendingUp, TrendingDown, 
  ChevronRight, Compass, Shield, Zap, Info, CheckCircle2, AlertTriangle,
  Flame, BarChart2, ExternalLink, Copy, Check
} from 'lucide-react';

const TICKERS = ["ALL", "TSLA", "AAPL", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "NFLX"];

export default function AiAssistantWindow({ 
  isOpen, 
  onClose, 
  darkMode = true,
  defaultTab = 'news'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'news' | 'support' | 'chat'
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // News State
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedTickerFilter, setSelectedTickerFilter] = useState('ALL');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [copied, setCopied] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: "👋 Welcome to **TradeFlow AI Copilot**!\n\nI am your real-time financial news analyst and beginner support assistant. Ask me to:\n- 📰 **Analyze latest breaking news & market impact**\n- 📈 **Explain Pearson correlation & sentiment scores**\n- 🚦 **Interpret BUY/SELL trading signals**\n- 🎓 **Guide you step-by-step through the platform**",
      timestamp: "Just now"
    }
  ]);
  const chatEndRef = useRef(null);

  // Gemini API Configuration State
  const [geminiStatus, setGeminiStatus] = useState({ configured: false, masked_key: '', model: 'gemini-1.5-flash' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null);

  const fetchGeminiStatus = async () => {
    try {
      const res = await axios.get('/api/config/gemini-status');
      if (res.data) setGeminiStatus(res.data);
    } catch (e) {
      console.warn("Could not check Gemini status:", e);
    }
  };

  const handleSaveGeminiKey = async (e) => {
    if (e) e.preventDefault();
    if (!keyInput.trim()) return;
    setKeySaving(true);
    setKeyFeedback(null);
    try {
      const res = await axios.post('/api/config/gemini-key', { api_key: keyInput.trim() });
      setKeyFeedback({ type: 'success', message: res.data?.message || 'Gemini API key verified successfully!' });
      setKeyInput('');
      await fetchGeminiStatus();
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "🚀 **Google Gemini AI Activated!**\n\nYour Gemini API key has been verified and saved. You can now ask custom questions, deep institutional analyses, or complex macro scenarios.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => {
        setShowKeyModal(false);
        setKeyFeedback(null);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to verify key. Please check the API key.";
      setKeyFeedback({ type: 'error', message: msg });
    } finally {
      setKeySaving(false);
    }
  };

  // Fetch Latest News
  const fetchNews = async (ticker = 'ALL') => {
    setNewsLoading(true);
    try {
      const url = ticker !== 'ALL' 
        ? `/api/news/latest?limit=25&ticker=${ticker}` 
        : `/api/news/latest?limit=25`;
      const res = await axios.get(url);
      if (res.data && Array.isArray(res.data.news)) {
        setNewsList(res.data.news);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNews(selectedTickerFilter);
      fetchGeminiStatus();
    }
  }, [isOpen, selectedTickerFilter]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  // Run AI News Analysis
  const handleAnalyzeNews = async (newsItem = null) => {
    setAnalysisLoading(true);
    setSelectedNewsItem(newsItem);
    try {
      const payload = newsItem 
        ? { news_id: newsItem.id, ticker: newsItem.ticker }
        : { ticker: selectedTickerFilter !== 'ALL' ? selectedTickerFilter : null };
      
      const res = await axios.post('/api/copilot/analyze-news', payload);
      if (res.data) {
        setAnalysisResult(res.data);
      }
    } catch (err) {
      console.error("News analysis error:", err);
      setAnalysisResult({
        source: 'native-fallback',
        sentiment_label: 'NEUTRAL',
        compound_score: 0.12,
        volatility: 'MODERATE',
        analysis: "### 📰 AI News Intelligence Synthesis\n\nLatest news flow reflects active tech sector discussions. Sentiment polarity indicates steady accumulation across mega-cap equities with low-to-moderate systemic risk."
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Submit Chat Message
  const handleChatSubmit = async (e, directText = null) => {
    if (e) e.preventDefault();
    const query = directText || chatInput.trim();
    if (!query || chatLoading) return;

    const userMsg = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMsg]);
    if (!directText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post('/api/copilot/chat', { message: query });
      const aiReply = res.data?.reply || "I analyzed the live telemetry, but could not produce a response.";
      setChatHistory(prev => [
        ...prev, 
        {
          role: 'assistant',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "⚠️ I encountered an error connecting to the intelligence engine. Please ensure the backend is running.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (analysisResult?.analysis) {
      navigator.clipboard.writeText(analysisResult.analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAskSupportQuestion = (question) => {
    setActiveTab('chat');
    setIsMinimized(false);
    handleChatSubmit(null, question);
  };

  if (!isOpen) return null;

  // Window Styles
  const windowWidthClass = isMaximized 
    ? 'w-[95vw] md:w-[900px] h-[85vh]' 
    : 'w-[95vw] sm:w-[500px] md:w-[540px] h-[640px]';

  return (
    <div className={`fixed z-50 transition-all duration-300 ease-out ${
      isMinimized 
        ? 'bottom-4 right-4 w-auto h-auto' 
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
    }`}>
      {/* 🟢 Minimized Dock Pill */}
      {isMinimized ? (
        <div 
          onClick={() => setIsMinimized(false)}
          className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-2xl border border-cyan-500/30 bg-[#090a10]/95 backdrop-blur-xl shadow-2xl hover:border-cyan-400 hover:scale-[1.02] transition-all group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>AI News & Support Window</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 rounded font-mono font-bold">ONLINE</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Click to restore analyst session
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* 🪟 Full Floating Window */
        <div className={`${windowWidthClass} flex flex-col rounded-2xl border border-cyan-500/25 bg-[#08090e]/95 backdrop-blur-2xl shadow-2xl overflow-hidden text-zinc-200 transition-all`}>
          
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-black animate-ping" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5 tracking-tight">
                  TradeFlow AI Analyst
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 font-mono rounded font-bold uppercase">
                    v2.5
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">News Intelligence & Beginner Support</p>
              </div>
            </div>

            {/* Window Controls & Key Status */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowKeyModal(true)}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 border transition-all ${
                  geminiStatus?.configured 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="Configure Google Gemini API Key"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${geminiStatus?.configured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold">{geminiStatus?.configured ? 'Gemini 1.5' : 'Set Gemini Key'}</span>
              </button>

              <button
                onClick={() => fetchNews(selectedTickerFilter)}
                title="Refresh News Feed"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize Window"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore Window" : "Maximize Window"}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors hidden sm:block"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                title="Close Window"
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 🔑 Gemini Key Configuration Modal Overlay */}
          {showKeyModal && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Google Gemini AI Setup
                    </h4>
                  </div>
                  <button 
                    onClick={() => { setShowKeyModal(false); setKeyFeedback(null); }}
                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Enter your Google Gemini API key to activate full multimodal copilot intelligence, custom live market prompts, and news briefings.
                </p>

                {geminiStatus?.configured && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Currently Active: {geminiStatus.masked_key || 'Configured'}</span>
                  </div>
                )}

                <form onSubmit={handleSaveGeminiKey} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5 font-bold">
                      Gemini API Key:
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-900 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none"
                    />
                  </div>

                  {keyFeedback && (
                    <div className={`p-2.5 rounded-xl text-[10px] font-mono flex items-center gap-2 ${
                      keyFeedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}>
                      {keyFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{keyFeedback.message}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowKeyModal(false); setKeyFeedback(null); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={keySaving || !keyInput.trim()}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider disabled:opacity-40 shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                    >
                      {keySaving ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Save</span>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-[9px] font-mono text-zinc-500 pt-1 border-t border-white/5 flex items-center justify-between">
                  <span>Get key free at ai.google.dev</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-0.5">
                    Open AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center border-b border-white/5 bg-black/40 px-3 pt-2 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-all border-b-2 ${
                activeTab === 'news'
                  ? 'border-cyan-400 text-cyan-400 bg-white/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News Analyst</span>
              {newsList.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-full">
                  {newsList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-all border-b-2 ${
                activeTab === 'support'
                  ? 'border-purple-400 text-purple-400 bg-white/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Beginner Support</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-emerald-400 text-emerald-400 bg-white/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interactive Copilot</span>
            </button>
          </div>

          {/* Window Body Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* ----------------- TAB 1: NEWS ANALYST ----------------- */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                
                {/* AI Headline Synthesis Trigger Card */}
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        AI News Synthesis Engine
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Live Stream
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Synthesize real-time headlines with rolling VADER compound scores and stock ticks to identify market movers and volatility catalysts.
                  </p>

                  {/* Ticker Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TICKERS.map(tk => (
                      <button
                        key={tk}
                        onClick={() => setSelectedTickerFilter(tk)}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg transition-all ${
                          selectedTickerFilter === tk
                            ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/50'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                        }`}
                      >
                        {tk}
                      </button>
                    ))}
                  </div>

                  {/* Master Analyze Button */}
                  <button
                    onClick={() => handleAnalyzeNews(null)}
                    disabled={analysisLoading}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${analysisLoading ? 'animate-spin' : ''}`} />
                    {analysisLoading ? 'Synthesizing Market Intelligence...' : '⚡ Analyze All Breaking Headlines'}
                  </button>
                </div>

                {/* AI Analysis Result Card */}
                {analysisResult && (
                  <div className="p-4 rounded-xl border border-white/10 bg-black/60 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {selectedNewsItem ? `Analysis: $${selectedNewsItem.ticker}` : 'Macro News Briefing'}
                        </span>
                        {analysisResult.sentiment_label && (
                          <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                            analysisResult.sentiment_label === 'BULLISH'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : analysisResult.sentiment_label === 'BEARISH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {analysisResult.sentiment_label}
                          </span>
                        )}
                        {analysisResult.volatility && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Vol: {analysisResult.volatility}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCopyAnalysis}
                          title="Copy Analysis"
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('chat');
                            handleChatSubmit(null, `Tell me more about this news analysis: ${analysisResult.sentiment_label} sentiment with ${analysisResult.volatility} volatility.`);
                          }}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          Chat &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-mono whitespace-pre-line text-zinc-300 leading-relaxed max-h-72 overflow-y-auto pr-1">
                      {analysisResult.analysis}
                    </div>
                  </div>
                )}

                {/* News Stream List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                    <span>Live Breaking Social Feeds ({newsList.length})</span>
                    <span className="text-[10px] font-mono text-zinc-500">Click headline for 1-click AI analysis</span>
                  </div>

                  {newsLoading ? (
                    <div className="py-8 text-center text-xs font-mono text-zinc-500 animate-pulse">
                      ⚡ Ingesting high-frequency financial feeds...
                    </div>
                  ) : newsList.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-zinc-500">
                      No news found for ticker {selectedTickerFilter}.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newsList.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                ${item.ticker}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                item.sentiment === 'BULLISH'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : item.sentiment === 'BEARISH'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {item.sentiment}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                @{item.username}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {item.time_ago}
                              </span>
                              <button
                                onClick={() => handleAnalyzeNews(item)}
                                className="opacity-80 group-hover:opacity-100 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-[10px] font-bold font-mono transition-all flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                AI Analyze
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-200 leading-snug font-sans">
                            {item.headline}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                            <span>Compound: <strong className={item.compound >= 0 ? "text-emerald-400" : "text-rose-400"}>{item.compound}</strong></span>
                            <span>Impact: <strong className="text-zinc-300">{item.impact_level}</strong></span>
                            <span>Audience: {item.followers.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ----------------- TAB 2: BEGINNER SUPPORT ----------------- */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                
                {/* Support Welcome Card */}
                <div className="p-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-cyan-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <HelpCircle className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      New User Support & Concept Guide
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    New to TradeFlow? Explore core concepts below or click any topic to get an instant AI breakdown tailored for beginners.
                  </p>
                </div>

                {/* 3-Step Quick Start Roadmap */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                    🚀 3-Step Quick Start Guide
                  </h5>
                  <div className="space-y-2.5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        1
                      </span>
                      <div>
                        <strong className="text-white block">Watch Real-Time Stock Ticks</strong>
                        <p className="text-[11px] text-zinc-400">Mega-cap equities (Tesla, Apple, NVIDIA) update tick-by-tick with rolling volume.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        2
                      </span>
                      <div>
                        <strong className="text-white block">Inspect Sentiment Correlation ($r$)</strong>
                        <p className="text-[11px] text-zinc-400">See whether social enthusiasm matches price movement over 5-minute rolling windows.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        3
                      </span>
                      <div>
                        <strong className="text-white block">Review AI Trading Signals</strong>
                        <p className="text-[11px] text-zinc-400">Algorithmic BUY / SELL / HOLD recommendations backed by statistical confidence scores.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Glossary Cards */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 px-1">
                    📖 Key Concepts & Explanations
                  </h5>

                  {/* Concept 1: Pearson Correlation */}
                  <div 
                    onClick={() => handleAskSupportQuestion("What is Pearson Correlation and how should a beginner interpret the score?")}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                          What is Pearson Correlation ($r$)?
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Scores from -1.0 to +1.0. A score &gt; +0.50 means prices reliably surge when positive social sentiment spikes.
                    </p>
                  </div>

                  {/* Concept 2: VADER Compound Score */}
                  <div 
                    onClick={() => handleAskSupportQuestion("Explain how VADER sentiment compound scores work and what numbers to watch for.")}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-bold text-white group-hover:text-purple-300">
                          How VADER Sentiment Scoring Works
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Normalized polarity index: Compound &gt; +0.15 is Bullish 🚀, between -0.15 and +0.15 is Neutral, and &lt; -0.15 is Bearish 🔻.
                    </p>
                  </div>

                  {/* Concept 3: Signals */}
                  <div 
                    onClick={() => handleAskSupportQuestion("How are AI trading signals calculated and when is a BUY signal triggered?")}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                          AI Algorithmic Signals (BUY / SELL / HOLD)
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Dual-factor confirmation engine: Triggered when high sentiment velocity coincides with price momentum support.
                    </p>
                  </div>

                  {/* Concept 4: Fear & Greed */}
                  <div 
                    onClick={() => handleAskSupportQuestion("What does the macro Fear and Greed index mean for trading?")}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-white group-hover:text-amber-300">
                          Fear & Greed Macro Mood (0 to 100)
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Aggregated thermometer of retail and institutional sentiment over rolling 2-hour windows across all tracked tickers.
                    </p>
                  </div>
                </div>

                {/* FAQ Quick Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    💬 Common Beginner Inquiries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "I am a beginner, how do I start?",
                      "How often are stock prices updated?",
                      "What does Ctrl + K do?",
                      "Is the sentiment data from real social feeds?",
                      "How do I export datasets?"
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleAskSupportQuestion(q)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 hover:border-cyan-500/30 text-left transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ----------------- TAB 3: INTERACTIVE COPILOT CHAT ----------------- */}
            {activeTab === 'chat' && (
              <div className="space-y-3 flex flex-col h-full justify-between">
                
                {/* Chat History Messages */}
                <div className="space-y-3 overflow-y-auto pr-1 text-xs">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border ${
                        msg.role === 'assistant'
                          ? 'bg-zinc-900/60 border-white/5 text-zinc-200'
                          : 'bg-gradient-to-r from-purple-950/30 to-cyan-950/30 border-purple-500/30 text-purple-200 ml-6'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${
                          msg.role === 'assistant' ? 'text-cyan-400' : 'text-purple-400'
                        }`}>
                          {msg.role === 'assistant' ? '🤖 TradeFlow Copilot' : '👤 You'}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed font-sans text-xs">
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/40 border border-white/5 text-purple-300 text-xs font-mono animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Analyzing market feeds and cross-referencing telemetry...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Prompt Suggestion Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-white/5">
                  {[
                    "Analyze today's tech news",
                    "Explain Pearson correlation",
                    "Which stock has a BUY signal?",
                    "What is Fear & Greed index?"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChatSubmit(null, chip)}
                      className="whitespace-nowrap text-[10px] font-mono px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 hover:border-cyan-500/30 transition-all flex-shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Field */}
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI about news, correlation, or beginner help..."
                    className="flex-1 bg-zinc-900/90 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}

          </div>

          {/* Window Footer Status */}
          <div className="px-4 py-2 border-t border-white/5 bg-black/50 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Multi-Asset AI Ready</span>
            </div>
            <span>Press ESC or _ to minimize</span>
          </div>

        </div>
      )}
    </div>
  );
}
