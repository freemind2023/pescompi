'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertItem } from '@/types';
import { Bell, AlertTriangle, Info, ShieldAlert, RefreshCw } from 'lucide-react';
import { severityColor, timeAgo } from '@/lib/utils';
import { useAlertStore } from '@/lib/store';
import { detectNewAlerts } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  alerts: AlertItem[];
}

function AlertIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <ShieldAlert className="w-3.5 h-3.5 text-neon-red" />;
  if (severity === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-neon-yellow" />;
  return <Info className="w-3.5 h-3.5 text-neon-blue" />;
}

export default function AIAlerts({ alerts }: Props) {
  const { setAlerts, markAllRead } = useAlertStore();
  const [detecting, setDetecting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  async function handleDetect() {
    setDetecting(true);
    try {
      const result = await detectNewAlerts();
      setAlerts(result.alerts as AlertItem[]);
      toast.success(`${result.count} alerts detected`, {
        style: { background: '#0d0d1e', color: '#00ff88' },
      });
    } catch {
      toast.error('Alert detection failed', { style: { background: '#0d0d1e', color: '#ff3b3b' } });
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white">AI Alert System</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Real-time competitor monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Mark read
          </button>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-[11px] hover:bg-neon-red/20 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${detecting ? 'animate-spin' : ''}`} />
            Detect
          </button>
        </div>
      </div>

      {/* Severity filter pills */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'critical', label: 'Critical', count: counts.critical },
          { key: 'warning', label: 'Warning', count: counts.warning },
          { key: 'info', label: 'Info', count: counts.info },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              filter === f.key
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-white/40 border border-transparent hover:border-white/10'
            }`}
          >
            {f.label}
            <span className="bg-white/10 px-1 rounded text-[9px]">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        <AnimatePresence>
          {filtered.length > 0 ? (
            filtered.map((alert, i) => {
              const color = severityColor(alert.severity);
              return (
                <motion.div
                  key={alert.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative rounded-lg p-3 border overflow-hidden ${
                    alert.severity === 'critical' ? 'alert-critical' : ''
                  }`}
                  style={{
                    background: `${color}08`,
                    borderColor: `${color}25`,
                  }}
                >
                  {/* Severity stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l"
                    style={{ background: color }}
                  />

                  <div className="flex items-start gap-2 ml-1">
                    <AlertIcon severity={alert.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-white/90 truncate">{alert.title}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
                          >
                            {alert.platform}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5 line-clamp-2">{alert.description}</p>
                      {alert.action_required && (
                        <p className="text-[10px] mt-1 font-medium" style={{ color }}>
                          → {alert.action_required}
                        </p>
                      )}
                      <p className="text-[9px] text-white/25 mt-1">
                        {alert.brand} · {alert.detected_at ? timeAgo(alert.detected_at) : 'Just now'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-[11px] text-white/30">No alerts detected</p>
              <p className="text-[10px] text-white/20 mt-1">Run analysis to detect threats</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
