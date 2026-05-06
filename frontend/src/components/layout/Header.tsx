'use client';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, Download, Bell, Wifi, WifiOff } from 'lucide-react';
import { useAlertStore } from '@/lib/store';
import { useAnalysis } from '@/hooks/useAnalysis';
import { exportPDF, exportExcel } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
] as const;

export default function Header() {
  const { analysis, isLoading, lastUpdated, dateRange, changeDateRange } = useAnalysis();
  const { refresh } = useAnalysis();
  const { unreadCount, markAllRead } = useAlertStore();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: 'pdf' | 'excel') {
    if (!analysis) return;
    setExporting(true);
    try {
      if (format === 'pdf') await exportPDF();
      else await exportExcel();
      toast.success(`${format.toUpperCase()} downloaded!`, {
        style: { background: '#0d0d1e', color: '#00ff88' },
      });
    } catch {
      toast.error('Export failed', { style: { background: '#0d0d1e', color: '#ff3b3b' } });
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-dark-900/80 backdrop-blur border-b border-white/5">
      {/* Left: title + status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-bold text-white">Competitor Intelligence War Room</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {analysis ? (
              <>
                <Wifi className="w-3 h-3 text-neon-green" />
                <span className="text-[10px] text-neon-green">Live · Updated {lastUpdated ? timeAgo(lastUpdated) : 'N/A'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/30">No data — click Analyze</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-dark-700 border border-white/8 rounded-lg p-1">
          <Calendar className="w-3.5 h-3.5 text-white/40 ml-1" />
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => changeDateRange(r.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                dateRange === r.value
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Alert bell */}
        <button
          onClick={markAllRead}
          className="relative p-2 rounded-lg bg-dark-700 border border-white/8 text-white/50 hover:text-neon-yellow transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-red text-white text-[9px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Export */}
        {analysis && (
          <div className="flex gap-1">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-700 border border-white/8 text-white/60 hover:text-white hover:border-neon-purple/30 text-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-700 border border-white/8 text-white/60 hover:text-white hover:border-neon-green/30 text-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        )}

        {/* Analyze button */}
        <motion.button
          onClick={() => refresh()}
          disabled={isLoading}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-bold hover:bg-neon-green/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing…' : 'Analyze Today'}
        </motion.button>
      </div>
    </header>
  );
}
