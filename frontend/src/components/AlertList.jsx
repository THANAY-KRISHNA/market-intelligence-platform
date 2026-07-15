import React from 'react';
import { AlertCircle, CheckCircle, Info, Flame, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertList({ alerts }) {
  const getIcon = (type, severity) => {
    if (type === 'Bullish Spike') return <Flame className="h-4 w-4 text-emerald-400" />;
    if (severity === 'CRITICAL') return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    if (severity === 'WARNING') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    return <Info className="h-4 w-4 text-blue-400" />;
  };

  const getBorderColor = (severity) => {
    if (severity === 'CRITICAL') return 'border-rose-950 bg-rose-950/10';
    if (severity === 'WARNING') return 'border-amber-950 bg-amber-950/10';
    return 'border-zinc-900 bg-zinc-900/10';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-3">
        <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Trading & Sentiment Alerts</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {alerts.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-zinc-900 rounded-lg">
            <span className="text-zinc-600 text-xs">Waiting for live correlation signals...</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id || alert.timestamp}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-3 rounded-lg border flex gap-3 text-xs ${getBorderColor(alert.severity)}`}
              >
                <div className="mt-0.5">
                  {getIcon(alert.type, alert.severity)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">${alert.ticker}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{alert.timestamp.split('T')[1]?.substring(0, 8) || alert.timestamp}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">{alert.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
