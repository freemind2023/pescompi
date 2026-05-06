'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AdData } from '@/types';
import { Zap, TrendingUp, Eye } from 'lucide-react';

interface Props {
  pesAds: AdData[];
  nilayaAds: AdData[];
}

const PLATFORMS = ['Facebook', 'Instagram', 'All'];

function groupByPlatform(ads: AdData[]): Record<string, number> {
  return ads.reduce<Record<string, number>>((acc, ad) => {
    const p = (ad.platform || 'unknown').toLowerCase();
    const key = p.includes('instagram') ? 'Instagram' : p.includes('facebook') ? 'Facebook' : 'Other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export default function AdActivityHeatmap({ pesAds, nilayaAds }: Props) {
  const pesGroups = groupByPlatform(pesAds);
  const nilayaGroups = groupByPlatform(nilayaAds);

  const chartData = ['Facebook', 'Instagram', 'Other'].map((p) => ({
    platform: p,
    PES: pesGroups[p] || 0,
    Nilaya: nilayaGroups[p] || 0,
  }));

  const pesTotal = pesAds.length;
  const nilayaTotal = nilayaAds.length;
  const leader = nilayaTotal > pesTotal ? 'Nilaya' : 'PES';

  const recentAds = [...nilayaAds.slice(0, 3), ...pesAds.slice(0, 2)].slice(0, 5);

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Ad Activity Intelligence</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Meta Ads Library live data</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-neon-yellow">
          <Zap className="w-3.5 h-3.5" />
          Live Tracking
        </div>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'PES Active Ads', count: pesTotal, color: '#00ff88' },
          { label: 'Nilaya Active Ads', count: nilayaTotal, color: '#00d4ff' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-dark-800 rounded-lg p-3 border border-white/5">
            <p className="text-[10px] text-white/40">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>
              {count}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">active campaigns</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="h-40 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="PES" fill="#00ff88" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="Nilaya" fill="#00d4ff" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent ad samples */}
      <div>
        <p className="text-[11px] text-white/40 mb-2 flex items-center gap-1">
          <Eye className="w-3 h-3" /> Sample Ad Copies
        </p>
        <div className="space-y-2">
          {recentAds.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-dark-800 rounded-lg p-2.5 border border-white/5"
            >
              <p className="text-[10px] text-white/30 mb-1">{ad.platform || 'Meta'}</p>
              <p className="text-[11px] text-white/70 line-clamp-2">{ad.body || ad.title || 'Ad copy not available'}</p>
              {ad.cta && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue text-[10px] border border-neon-blue/20">
                  {ad.cta}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Spend estimate */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="text-[11px] text-white/40">Estimated spend leader:</div>
        <div className={`text-[11px] font-bold ${leader === 'PES' ? 'text-neon-green' : 'text-neon-red'}`}>
          <TrendingUp className="w-3 h-3 inline mr-1" />
          {leader} outspending
        </div>
      </div>
    </div>
  );
}
