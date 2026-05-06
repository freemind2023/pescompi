'use client';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { CompetitorScores } from '@/types';
import { scoreColor, scoreLabel, cn } from '@/lib/utils';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

const SCORE_KEYS: { key: keyof CompetitorScores; label: string }[] = [
  { key: 'ad_activity_score',          label: 'Ad Activity' },
  { key: 'content_frequency_score',    label: 'Content' },
  { key: 'engagement_score',           label: 'Engagement' },
  { key: 'brand_authority_score',      label: 'Authority' },
  { key: 'trust_score',                label: 'Trust' },
  { key: 'placement_positioning_score',label: 'Placement' },
  { key: 'founder_branding_score',     label: 'Founder Brand' },
  { key: 'ai_readiness_score',         label: 'AI Ready' },
  { key: 'innovation_score',           label: 'Innovation' },
];

interface Props {
  scores: Record<string, CompetitorScores>;
  whichAhead: string;
}

export default function CompetitorScore({ scores, whichAhead }: Props) {
  const pes = scores['PES'];
  const nilaya = scores['Nilaya'];

  const radarData = SCORE_KEYS.map(({ key, label }) => ({
    metric: label,
    PES: pes ? Math.round(pes[key] as number) : 0,
    Nilaya: nilaya ? Math.round(nilaya[key] as number) : 0,
  }));

  const pesAhead = (pes?.overall_score ?? 0) >= (nilaya?.overall_score ?? 0);

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Competitor Scores</h2>
          <p className="text-[11px] text-white/40 mt-0.5">9-dimensional battle analysis</p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border',
          pesAhead
            ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
            : 'bg-neon-red/10 text-neon-red border-neon-red/20'
        )}>
          <Trophy className="w-3.5 h-3.5" />
          {whichAhead} Leading
        </div>
      </div>

      {/* Overall score cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { key: 'PES', label: 'Practical EduSkills', data: pes, color: '#00ff88' },
          { key: 'Nilaya', label: 'Nilaya Education', data: nilaya, color: '#00d4ff' },
        ].map(({ key, label, data, color }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-800 rounded-lg p-4 border border-white/5"
          >
            <p className="text-[10px] text-white/40 mb-1">{label}</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold" style={{ color }}>
                {data ? Math.round(data.overall_score) : '—'}
              </span>
              <span className="text-xs text-white/30 mb-1">/100</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color }}>
              {data ? scoreLabel(data.overall_score) : 'No data'}
            </p>
            {/* Score bar */}
            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data?.overall_score ?? 0}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Radar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            />
            <Radar
              name="PES"
              dataKey="PES"
              stroke="#00ff88"
              fill="#00ff88"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Radar
              name="Nilaya"
              dataKey="Nilaya"
              stroke="#00d4ff"
              fill="#00d4ff"
              fillOpacity={0.08}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: '#0d0d1e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#e0e0e0',
                fontSize: 11,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Individual score bars */}
      <div className="mt-4 space-y-2">
        {SCORE_KEYS.map(({ key, label }) => {
          const pesVal = pes ? Math.round(pes[key] as number) : 0;
          const nilayaVal = nilaya ? Math.round(nilaya[key] as number) : 0;
          return (
            <div key={key} className="flex items-center gap-3 text-[11px]">
              <span className="text-white/40 w-24 flex-shrink-0">{label}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pesVal}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full bg-neon-green"
                    style={{ boxShadow: '0 0 4px #00ff8866' }}
                  />
                </div>
                <span className="text-neon-green w-7 text-right">{pesVal}</span>
                <span className="text-white/20">|</span>
                <span className="text-neon-blue w-7">{nilayaVal}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nilayaVal}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full bg-neon-blue"
                    style={{ boxShadow: '0 0 4px #00d4ff66' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] text-neon-green">
          <div className="w-3 h-0.5 bg-neon-green rounded" />
          Practical EduSkills
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neon-blue">
          <div className="w-3 h-0.5 bg-neon-blue rounded" />
          Nilaya Education
        </div>
      </div>
    </div>
  );
}
