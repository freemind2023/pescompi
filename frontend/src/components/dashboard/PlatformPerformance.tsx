'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BrandData } from '@/types';
import { formatNumber, getPlatformIcon } from '@/lib/utils';
import { Globe, ExternalLink } from 'lucide-react';

interface Props {
  pes: BrandData;
  nilaya: BrandData;
}

export default function PlatformPerformance({ pes, nilaya }: Props) {
  const pesMap = Object.fromEntries(pes.social.map((s) => [s.platform, s]));
  const nilayaMap = Object.fromEntries(nilaya.social.map((s) => [s.platform, s]));

  const platforms = ['instagram', 'youtube', 'linkedin'];
  const engagementData = platforms.map((p) => ({
    platform: p.charAt(0).toUpperCase() + p.slice(1),
    'PES Followers': pesMap[p]?.followers || 0,
    'Nilaya Followers': nilayaMap[p]?.followers || 0,
    'PES Engagement': parseFloat((pesMap[p]?.engagement_rate || 0).toFixed(2)),
    'Nilaya Engagement': parseFloat((nilayaMap[p]?.engagement_rate || 0).toFixed(2)),
  }));

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Platform Performance</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Multi-platform audience & engagement</p>
        </div>
        <Globe className="w-4 h-4 text-neon-blue" />
      </div>

      {/* Followers chart */}
      <p className="text-[10px] text-white/30 mb-2">Follower Comparison</p>
      <div className="h-44 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData} barGap={4}>
            <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number, name: string) => [formatNumber(v), name]}
              contentStyle={{ background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="PES Followers" fill="#00ff88" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={24} />
            <Bar dataKey="Nilaya Followers" fill="#00d4ff" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform cards */}
      <div className="space-y-2">
        {platforms.map((platform, i) => {
          const pesM = pesMap[platform];
          const nilayaM = nilayaMap[platform];
          const pesF = pesM?.followers || 0;
          const nilayaF = nilayaM?.followers || 0;
          const leader = pesF >= nilayaF ? 'PES' : 'Nilaya';

          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-dark-800 rounded-lg p-3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getPlatformIcon(platform)}</span>
                  <span className="text-[11px] font-medium text-white/80 capitalize">{platform}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${leader === 'PES' ? 'text-neon-green bg-neon-green/10' : 'text-neon-blue bg-neon-blue/10'}`}>
                  {leader} leads
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <p className="text-white/30 mb-0.5">PES</p>
                  <p className="text-neon-green font-bold">{formatNumber(pesF)}</p>
                  {pesM?.engagement_rate !== undefined && (
                    <p className="text-white/30">{pesM.engagement_rate}% eng.</p>
                  )}
                  {pesM?.posting_frequency && (
                    <p className="text-white/25">{pesM.posting_frequency}</p>
                  )}
                </div>
                <div>
                  <p className="text-white/30 mb-0.5">Nilaya</p>
                  <p className="text-neon-blue font-bold">{formatNumber(nilayaF)}</p>
                  {nilayaM?.engagement_rate !== undefined && (
                    <p className="text-white/30">{nilayaM.engagement_rate}% eng.</p>
                  )}
                  {nilayaM?.posting_frequency && (
                    <p className="text-white/25">{nilayaM.posting_frequency}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Website comparison */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-[11px] text-white/40 mb-2">Website Intelligence</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            { label: 'PES', data: pes.website, color: '#00ff88' },
            { label: 'Nilaya', data: nilaya.website, color: '#00d4ff' },
          ].map(({ label, data, color }) => (
            <div key={label} className="bg-dark-800 rounded-lg p-2.5 border border-white/5">
              <p className="font-bold mb-1.5" style={{ color }}>{label}</p>
              <div className="space-y-1 text-white/50">
                <p>Load: {data.load_time_ms ? `${data.load_time_ms}ms` : 'N/A'}</p>
                <p>CTAs: {data.cta_buttons.length}</p>
                <p>Courses: {data.courses.length}</p>
                <p>Testimonials: {data.testimonials_count}</p>
                <p>Trust signals: {data.trust_signals.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
