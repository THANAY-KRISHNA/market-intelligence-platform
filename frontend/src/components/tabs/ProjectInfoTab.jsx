import React from 'react';
import { 
  Info, Cpu, Database, Network, GitBranch, Terminal, 
  ExternalLink, CheckCircle, Layers, Shield, Sparkles, ArrowRight 
} from 'lucide-react';

export default function ProjectInfoTab({ darkMode }) {
  const cardBg = darkMode ? 'glass-panel' : 'glass-panel-light';
  const borderLight = darkMode ? 'border-white/5' : 'border-slate-200';
  const textMuted = darkMode ? 'text-zinc-400' : 'text-slate-500';
  const textHeader = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-8 max-w-5xl">

      {/* 🧭 Header */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-2`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full">
          <Info className="w-3 h-3 text-cyan-400" />
          Academic Project Documentation
        </div>
        <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${textHeader}`}>
          TradeFlow — Project Architecture & Evaluation Guide
        </h1>
        <p className={`text-xs ${textMuted} leading-relaxed max-w-3xl`}>
          A comprehensive technical overview for evaluators, faculty members, and researchers reviewing this Big Data Analytics & Sentiment Correlation Platform.
        </p>
        <div className="flex flex-wrap gap-4 pt-3 text-xs font-mono">
          <a 
            href="https://github.com/THANAY-KRISHNA/market-intelligence-platform" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1.5"
          >
            <GitBranch className="w-4 h-4" />
            GitHub Repository &rarr;
          </a>
          <a 
            href="https://bigdata-bbkkgxxyy-thanaykrishnas-projects.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            Live Vercel Deployment &rarr;
          </a>
        </div>
      </div>

      {/* 🎯 1. Problem Statement & Objective */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
        <h2 className={`text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          1. Problem Statement & Objectives
        </h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            <strong>Problem Statement:</strong> Retail and institutional market sentiment on social media (Twitter/X, Reddit, StockTwits) moves at extreme velocity. Traditional batch analytics pipelines suffer from hours of processing latency, leaving investors unable to correlate sentiment shifts with high-frequency stock price movements in real time.
          </p>
          <p>
            <strong>Project Objective:</strong> Engineer a resilient, low-latency Big Data pipeline that ingests, cleans, classifies, and aligns unstructured financial social streams with structured market ticks using natural language processing (VADER) and rolling Pearson correlation scoring.
          </p>
        </div>
      </div>

      {/* 🏗️ 2. System Architecture Diagram */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
        <h2 className={`text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          2. End-to-End System Architecture
        </h2>
        <div className="p-4 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto border border-white/5 leading-relaxed">
          <pre>{`
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           DATA SOURCES                                │
  │   Social Streams (Twitter/X, StockTwits)   +   Equities Market Ticks  │
  └──────────────────────────────┬─────────────────────────┬──────────────┘
                                 │                         │
                                 ▼                         ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    INGESTION & BUFFERING LAYER                         │
  │   • Apache Kafka Message Broker (Topics: stock_prices, social_tweets)  │
  │   • Local Multi-Threaded In-Memory Stream Buffer (Fallback/Vercel)     │
  └──────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                     BIG DATA PROCESSING PIPELINE                       │
  │   1. Schema Validation  ──> 2. Deduplication & Null Imputation         │
  │   3. NLTK VADER Scoring ──> 4. 5-Min Tumbling Windows & Velocity        │
  │   5. Pearson r Matrix   ──> 6. Signal & Anomaly Threshold Rules        │
  │   • Engine: PySpark Structured Streaming (Cluster) / NumPy SIMD Engine │
  └──────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         STORAGE & API LAYER                            │
  │   • SQLite (14.2 MB with 18,968 historical ticks) / PostgreSQL DB      │
  │   • FastAPI REST Endpoints & WebSocket Broadcaster (/api/ws)           │
  └──────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                      INTERACTIVE PRESENTATION                          │
  │   • React 18 + Vite + TailwindCSS + ECharts + Three.js WebGL           │
  │   • Dataset Explorer + Quality Profiling + Benchmarks + PDF Exports    │
  └────────────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </div>

      {/* 🛠️ 3. Technology Stack Breakdown */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
        <h2 className={`text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          3. Technology Stack & Component Responsibilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2">
            <span className="font-bold text-cyan-400 block text-sm">Frontend Presentation</span>
            <ul className="space-y-1 text-zinc-300 font-mono text-[11px]">
              <li>• <strong>React 18 & Vite:</strong> Lightning-fast client-side routing</li>
              <li>• <strong>TailwindCSS:</strong> Minimal modern dashboard tokens</li>
              <li>• <strong>Apache ECharts:</strong> Dual-axis timeline & heatmaps</li>
              <li>• <strong>Three.js / R3F:</strong> 3D Financial exchange markers</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2">
            <span className="font-bold text-purple-400 block text-sm">Backend & REST APIs</span>
            <ul className="space-y-1 text-zinc-300 font-mono text-[11px]">
              <li>• <strong>FastAPI & Uvicorn:</strong> Async REST endpoints</li>
              <li>• <strong>SQLAlchemy 2.0:</strong> ORM query execution & migrations</li>
              <li>• <strong>WebSockets:</strong> Real-time price & alert push</li>
              <li>• <strong>Pydantic v2:</strong> Strict request/response validation</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2">
            <span className="font-bold text-emerald-400 block text-sm">Data Processing & NLP</span>
            <ul className="space-y-1 text-zinc-300 font-mono text-[11px]">
              <li>• <strong>PySpark 3.4.0:</strong> Distributed streaming windows</li>
              <li>• <strong>NLTK VADER:</strong> Financial polarity intensity scoring</li>
              <li>• <strong>NumPy & SciPy:</strong> Pearson correlation & SIMD math</li>
              <li>• <strong>Pandas:</strong> In-memory dataset profiling & cleaning</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-2">
            <span className="font-bold text-amber-400 block text-sm">Deployment & Infrastructure</span>
            <ul className="space-y-1 text-zinc-300 font-mono text-[11px]">
              <li>• <strong>Vercel Serverless:</strong> Global edge distribution</li>
              <li>• <strong>Docker Compose:</strong> Kafka, Zookeeper, Spark, DB</li>
              <li>• <strong>SQLite:</strong> High-speed zero-latency local store</li>
              <li>• <strong>PostgreSQL:</strong> Production relational DB target</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🧭 4. Guided Demonstration Workflow for Evaluators */}
      <div className={`p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-4`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className={`text-sm font-black uppercase tracking-wider text-white`}>
            4. Step-by-Step Evaluator Demonstration Workflow
          </h2>
        </div>
        <p className={`text-xs ${textMuted}`}>
          To demonstrate this platform during an academic presentation or viva, walk through these 6 steps in sequence:
        </p>

        <div className="space-y-3 pt-2">
          {[
            {
              step: 'Step 1: Inspect Overview & Macro Telemetry',
              desc: 'Show total records analyzed (10,020 rows), dataset size, Data Quality Score (99.3%), and the active dual-axis sentiment-vs-price stream.'
            },
            {
              step: 'Step 2: Explore Dataset & Data Quality Profiler',
              desc: 'Open Dataset Explorer. Demonstrate column types, sorting, filtering, and the Quality Audit tab showing missing value percentages and duplicates.'
            },
            {
              step: 'Step 3: Execute Data Remediation (Cleaning Engine)',
              desc: 'Under the Quality tab, click "Execute Cleaning" to remove duplicates and impute null values. Show how it non-destructively creates a new versioned dataset (e.g. cleaned_v1).'
            },
            {
              step: 'Step 4: Execute the 7-Stage Processing Pipeline',
              desc: 'Navigate to Data Processing. Click "Process Dataset Now". Observe the real measured execution duration (~28ms) across all 7 stages and historical audit logs.'
            },
            {
              step: 'Step 5: Review Empirical Hardware Benchmarks',
              desc: 'Open Performance & Benchmarks. Show the measured throughput curves comparing NumPy SIMD vectorization against sequential loops (7.2x speedup).'
            },
            {
              step: 'Step 6: Export Data & Print Academic Dossier',
              desc: 'In Reports & Exports, download the CSV/JSON data files and click "Print / PDF Report" to preview the formal evaluation report.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/60 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <strong className="text-white text-xs block">{item.step}</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚠️ 5. Known Limitations & Future Roadmap */}
      <div className={`p-6 rounded-2xl border ${borderLight} ${cardBg} space-y-4`}>
        <h2 className={`text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          5. Known Architectural Limitations & Future Scope
        </h2>
        <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
          <p>
            • <strong>Serverless Timeout Boundary:</strong> When hosted on Vercel free tier, serverless execution is capped at 15 seconds per request. Long-running cluster aggregations run via local Docker PySpark workers instead of serverless lambda handlers.
          </p>
          <p>
            • <strong>NLP Transformer Scaling:</strong> Currently uses NLTK VADER for microsecond inference speed. Future work includes quantizing a FinBERT model with ONNX Runtime to enable deeper contextual nuance with sub-50ms latency.
          </p>
          <p>
            • <strong>Real-World Stream Integration:</strong> Live Twitter API v2 endpoints require enterprise tier licensing; the current pipeline supports real financial stream simulation and manual real-time news injection via the <code>/api/log-tweet</code> endpoint.
          </p>
        </div>
      </div>

    </div>
  );
}
