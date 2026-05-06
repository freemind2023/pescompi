'use client';
import { motion } from 'framer-motion';
import { AIAnalysis } from '@/types';
import { Target, ChevronDown } from 'lucide-react';

interface Props {
  analysis: AIAnalysis;
}

const FUNNEL_STAGES = [
  { stage: 'Awareness', desc: 'Ads, social content, SEO' },
  { stage: 'Interest', desc: 'Lead magnets, demos, webinars' },
  { stage: 'Desire', desc: 'Testimonials, placement claims' },
  { stage: 'Action', desc: 'CTA, enrollment, WhatsApp' },
];

export default function FunnelComparison({ analysis }: Props) {
  const pesPosition = analysis.brand_positioning['PES'] || '';
  const nilayaPosition = analysis.brand_positioning['Nilaya'] || '';

  const width = [100, 80, 62, 46];

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Funnel Comparison</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Awareness → Conversion analysis</p>
        </div>
        <Target className="w-4 h-4 text-neon-purple" />
      </div>

      {/* Funnel visualization */}
      <div className="flex gap-6 mb-5">
        {[
          { label: 'PES', color: '#00ff88', positioning: pesPosition },
          { label: 'Nilaya', color: '#00d4ff', positioning: nilayaPosition },
        ].map(({ label, color, positioning }) => (
          <div key={label} className="flex-1">
            <p className="text-[10px] font-bold mb-3" style={{ color }}>{label}</p>
            <div className="flex flex-col items-center gap-0.5">
              {FUNNEL_STAGES.map((s, i) => (
                <div key={s.stage} className="w-full flex flex-col items-center">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.5 }}
                    className="rounded-sm flex items-center justify-center py-2"
                    style={{
                      width: `${width[i]}%`,
                      background: `${color}${i === 0 ? '20' : i === 1 ? '16' : i === 2 ? '12' : '0c'}`,
                      border: `1px solid ${color}${i === 0 ? '35' : '20'}`,
                    }}
                  >
                    <span className="text-[9px] font-medium" style={{ color }}>
                      {s.stage}
                    </span>
                  </motion.div>
                  {i < FUNNEL_STAGES.length - 1 && (
                    <ChevronDown className="w-3 h-3 my-0.5" style={{ color: `${color}40` }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="space-y-2 mb-4">
        {FUNNEL_STAGES.map((s) => (
          <div key={s.stage} className="flex items-center gap-3 text-[11px]">
            <span className="text-neon-green/60 font-mono text-[10px] w-20 flex-shrink-0">{s.stage}</span>
            <span className="text-white/40">{s.desc}</span>
          </div>
        ))}
      </div>

      {/* Funnel analysis text */}
      {analysis.funnel_analysis && (
        <div className="bg-dark-800 rounded-lg p-3 border border-neon-purple/10">
          <p className="text-[10px] text-neon-purple mb-1 font-medium">AI Funnel Analysis</p>
          <p className="text-[11px] text-white/60 leading-relaxed line-clamp-5">
            {analysis.funnel_analysis}
          </p>
        </div>
      )}

      {/* Brand positioning */}
      {(pesPosition || nilayaPosition) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: 'PES Positioning', text: pesPosition, color: '#00ff88' },
            { label: 'Nilaya Positioning', text: nilayaPosition, color: '#00d4ff' },
          ].map(({ label, text, color }) => (
            <div key={label} className="bg-dark-800 rounded-lg p-3 border border-white/5">
              <p className="text-[9px] font-bold mb-1" style={{ color }}>{label}</p>
              <p className="text-[10px] text-white/55 line-clamp-4">{text || 'No positioning data'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Missed opportunities */}
      {analysis.missed_opportunities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-[11px] text-neon-yellow font-medium mb-2">Missed Opportunities</p>
          <ul className="space-y-1.5">
            {analysis.missed_opportunities.slice(0, 4).map((opp, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/60">
                <span className="text-neon-yellow mt-0.5 flex-shrink-0">◆</span>
                {opp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
