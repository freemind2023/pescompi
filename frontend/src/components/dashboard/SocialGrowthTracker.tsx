'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SocialMetrics } from '@/types';
import { formatNumber, getPlatformIcon } from '@/lib/utils';
import { Users, Activity } from 'lucide-react';

interface Props {
  pesSocial: SocialMetrics[];
  nilayaSocial: SocialMetrics[];
}

const PLATFORM_ORDER = ['instagram', 'youtube', 'linkedin', 'facebook'];

export default function SocialGrowthTracker({ pesSocial, nilayaSocial }: Props) {
  const pesMap = Object.fromEntries(pesSocial.map((s) => [s.platform, s]));
  const nilayaMap = Object.fromEntries(nilayaSocial.map((s) => [s.platform, s]));

  const chartData = PLATFORM_ORDER.map((p) => ({
    platform: p.charAt(0).toUpperCase() + p.slice(1),
    PES: pesMap[p]?.followers || 0,
    Nilaya: nilayaMap[p]?.followers || 0,
  }));

  const totalPes = pesSocial.reduce((s, m) => s + (m.followers || 0), 0);
  const totalNilaya = nilayaSocial.reduce((s, m) => s + (m.followers || 0), 0);

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Social Growth Tracker</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Cross-platform audience comparison</p>
        </div>
        <Users className="w-4 h-4 text-neon-purple" />
      </div>

      {/* Total reach */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'PES Total Reach', val: totalPes, color: '#00ff88' },
          { label: 'Nilaya Total Reach', val: totalNilaya, color: '#00d4ff' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-dark-800 rounded-lg p-3 border border-white/5">
            <p className="text-[10px] text-white/40">{label}</p>
            <p className="text-xl font-bold mt-1" style={{ color }}>{formatNumber(val)}</p>
            <p className="text-[10px] text-white/30">across all platforms</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="h-44 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number) => formatNumber(v)}
              contentStyle={{ background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="PES" fill="#00ff88" fillOpacity={0.9} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Nilaya" fill="#00d4ff" fillOpacity={0.9} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-platform breakdown */}
      <div className="space-y-2">
        {PLATFORM_ORDER.map((platform, i) => {
          const pesM = pesMap[platform];
          const nilayaM = nilayaMap[platform];
          const pesF = pesM?.followers || 0;
          const nilayaF = nilayaM?.followers || 0;
          const maxF = Math.max(pesF, nilayaF, 1);
          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-dark-800 rounded-lg p-3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getPlatformIcon(platform)}</span>
                  <span className="text-[11px] font-medium text-white/80 capitalize">{platform}</span>
                </div>
                <Activity className="w-3 h-3 text-white/20" />
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'PES', val: pesF, color: '#00ff88', freq: pesM?.posting_frequency },
                  { label: 'Nilaya', val: nilayaF, color: '#00d4ff', freq: nilayaM?.posting_frequency },
                ].map(({ label, val, color, freq }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 w-12">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / maxF) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <span className="text-[10px] font-medium w-12 text-right" style={{ color }}>
                      {formatNumber(val)}
                    </span>
                    {freq && (
                      <span className="text-[9px] text-white/25 hidden xl:inline">{freq}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
