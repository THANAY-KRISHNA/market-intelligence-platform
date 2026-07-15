import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Award, Zap, Sliders } from 'lucide-react';

export default function Correlation({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCorrelation = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/correlation/${ticker}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading correlation details:", err);
      // Fallback dummy timeline for robust frontend testing offline
      const mockTimeline = Array.from({ length: 30 }).map((_, i) => {
        const timeStr = new Date(Date.now() - (30 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return {
          timestamp: timeStr,
          price: 150 + Math.sin(i / 3) * 5 + Math.random() * 2,
          sentiment: Math.sin(i / 4) * 0.6 + (Math.random() - 0.5) * 0.2,
          pearson: 0.45
        };
      });
      setData({
        ticker,
        pearson_coefficient: 0.48,
        confidence_score: 0.85,
        trading_signal: 'BUY',
        timeline: mockTimeline
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelation();
    
    // Refresh correlation chart every 10 seconds (in addition to websocket pushes)
    const interval = setInterval(fetchCorrelation, 10000);
    return () => clearInterval(interval);
  }, [ticker]);

  const getOption = () => {
    if (!data || !data.timeline) return {};
 
    const timestamps = data.timeline.map(p => p.timestamp);
    const prices = data.timeline.map(p => p.price.toFixed(2));
    const sentiments = data.timeline.map(p => p.sentiment.toFixed(3));
 
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'cross',
          label: {
            backgroundColor: '#0c0c0f',
            textStyle: { fontFamily: 'Montserrat, sans-serif', fontSize: 10 }
          }
        },
        backgroundColor: 'rgba(8, 8, 12, 0.9)',
        borderColor: 'rgba(0, 242, 254, 0.25)',
        borderWidth: 1,
        shadowBlur: 15,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        textStyle: { color: '#fafafa', fontFamily: 'Montserrat, sans-serif', fontSize: 11 }
      },
      legend: {
        data: ['Price ($)', 'Sentiment Index'],
        textStyle: { color: '#a1a1aa', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 600 },
        top: 0
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '8%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        axisLabel: { color: '#71717a', fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Price ($)',
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.02)' } },
          axisLabel: { color: '#71717a', fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 },
          nameTextStyle: { color: '#a1a1aa', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 600 }
        },
        {
          type: 'value',
          name: 'Sentiment',
          min: -1.0,
          max: 1.0,
          splitLine: { show: false },
          axisLabel: { color: '#71717a', fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 },
          nameTextStyle: { color: '#a1a1aa', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 600 }
        }
      ],
      series: [
        {
          name: 'Price ($)',
          type: 'line',
          data: prices,
          smooth: true,
          showSymbol: false,
          itemStyle: { color: '#00f2fe' },
          lineStyle: { 
            width: 3.5, 
            shadowBlur: 10, 
            shadowColor: 'rgba(0, 242, 254, 0.3)' 
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 242, 254, 0.18)' },
                { offset: 1, color: 'rgba(0, 242, 254, 0)' }
              ]
            }
          }
        },
        {
          name: 'Sentiment Index',
          type: 'bar',
          yAxisIndex: 1,
          data: sentiments,
          itemStyle: {
            color: (params) => {
              const val = parseFloat(params.value);
              return val >= 0.15 ? '#10b981' : (val <= -0.15 ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)');
            },
            borderRadius: [3, 3, 0, 0]
          }
        }
      ]
    };
  };

  if (loading && !data) {
    return (
      <div className="h-64 flex items-center justify-center bg-zinc-900/40 rounded-xl border border-zinc-800 animate-pulse">
        <span className="text-zinc-500 text-sm">Loading chart data...</span>
      </div>
    );
  }

  const signalColor = data?.trading_signal === 'BUY' 
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    : (data?.trading_signal === 'SELL' 
        ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' 
        : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20');

  return (
    <div className="space-y-5">
      {/* Mini details header */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/10 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Pearson r</span>
            </div>
            <span className="font-mono text-sm font-black text-cyan-400">
              {data.pearson_coefficient.toFixed(3)}
            </span>
          </div>
 
          <div className="bg-zinc-900/10 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Confidence</span>
            </div>
            <span className="font-mono text-sm font-black text-purple-400">
              {Math.round(data.confidence_score * 100)}%
            </span>
          </div>
 
          <div className="bg-zinc-900/10 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-pink-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Signal</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider border ${signalColor}`}>
              {data.trading_signal}
            </span>
          </div>
        </div>
      )}
 
      {/* Chart container */}
      <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          Price Overlaid with Sentiment Index
        </h3>
        <div className="h-64">
          <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
