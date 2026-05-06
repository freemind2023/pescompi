'use client';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AIAnalysis } from '@/types';
import { Heart, Zap, Target, Star } from 'lucide-react';
import { scoreColor } from '@/lib/utils';

interface Props {
  analysis: AIAnalysis;
}

const METRIC_ICONS = [Heart, Zap, Target, Star];

export default function BrandSentiment({ analysis }: Props) {
  const pesScore = analysis.scores['PES'];
  const nilayaScore = analysis.scores['Nilaya'];

  const pieData = [
    { name: 'PES', value: Math.round(pesScore?.overall_score ?? 50), color: '#00ff88' },
    { name: 'Nilaya', value: Math.round(nilayaScore?.overall_score ?? 50), color: '#00d4ff' },
  ];

  const sentimentMetrics = [
    {
      label: 'Trust Score',
      pes: Math.round(pesScore?.trust_score ?? 0),
      nilaya: Math.round(nilayaScore?.trust_score ?? 0),
    },
    {
      label: 'Brand Authority',
      pes: Math.round(pesScore?.brand_authority_score ?? 0),
      nilaya: Math.round(nilayaScore?.brand_authority_score ?? 0),
    },
    {
      label: 'Founder Branding',
      pes: Math.round(pesScore?.founder_branding_score ?? 0),
      nilaya: Math.round(nilayaScore?.founder_branding_score ?? 0),
    },
    {
      label: 'Innovation',
      pes: Math.round(pesScore?.innovation_score ?? 0),
      nilaya: Math.round(nilayaScore?.innovation_score ?? 0),
    },
  ];

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Brand Sentiment Meter</h2>
          <p className="text-[11px] text-white/40 mt-0.5">AI-assessed brand perception</p>
        </div>
        <Heart className="w-4 h-4 text-neon-red" />
      </div>

      {/* Pie chart */}
      <div className="h-44 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  fillOpacity={0.9}
                  stroke={entry.color}
                  strokeWidth={1}
                  style={{ filter: `drop-shadow(0 0 8px ${entry.color}66)` }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`${v}/100`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[10px] text-white/40">Leader</p>
            <p className="text-base font-bold text-neon-green">
              {(pesScore?.overall_score ?? 0) >= (nilayaScore?.overall_score ?? 0) ? 'PES' : 'Nilaya'}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 mb-5">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-[10px] text-white/50">{d.name} ({d.value}%)</span>
          </div>
        ))}
      </div>

      {/* Sentiment metrics */}
      <div className="space-y-3">
        {sentimentMetrics.map(({ label, pes, nilaya }, i) => {
          const Icon = METRIC_ICONS[i];
          const pesLeads = pes >= nilaya;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-neon-green">{pes}</span>
                  <span className="text-white/20">vs</span>
                  <span className="text-neon-blue">{nilaya}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pes}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-neon-green"
                  />
                </div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nilaya}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 + 0.05 }}
                    className="h-full rounded-full bg-neon-blue"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emotional marketing */}
      {analysis.emotional_marketing && (
        <div className="mt-4 p-3 bg-dark-800 rounded-lg border border-white/5">
          <p className="text-[10px] text-neon-purple mb-1 font-medium">Emotional Marketing Analysis</p>
          <p className="text-[11px] text-white/60 line-clamp-3">{analysis.emotional_marketing}</p>
        </div>
      )}
    </div>
  );
}
