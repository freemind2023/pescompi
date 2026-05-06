'use client';
import { motion } from 'framer-motion';
import { AIAnalysis, WebsiteData } from '@/types';
import { MousePointerClick, ArrowRight, Star } from 'lucide-react';

interface Props {
  analysis: AIAnalysis;
  pesWebsite: WebsiteData;
  nilayaWebsite: WebsiteData;
}

const CTA_COLORS = ['#00ff88', '#00d4ff', '#bf5af2', '#ffd60a', '#ff9500'];

export default function CTAAnalysis({ analysis, pesWebsite, nilayaWebsite }: Props) {
  const pesCtas = pesWebsite.cta_buttons.slice(0, 6);
  const nilayaCtas = nilayaWebsite.cta_buttons.slice(0, 6);
  const ctaEffectiveness = analysis.cta_effectiveness;

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">CTA Strategy Analysis</h2>
          <p className="text-[11px] text-white/40 mt-0.5">Call-to-action psychology comparison</p>
        </div>
        <MousePointerClick className="w-4 h-4 text-neon-yellow" />
      </div>

      {/* CTA effectiveness summary */}
      {ctaEffectiveness && (
        <div className="grid grid-cols-1 gap-3 mb-5">
          {Object.entries(ctaEffectiveness).map(([brand, analysis_text]) => (
            <div key={brand} className="bg-dark-800 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] font-bold text-neon-green mb-1">{brand}</p>
              <p className="text-[11px] text-white/60 line-clamp-3">{analysis_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA buttons per brand */}
      <div className="space-y-4">
        {[
          { brand: 'Practical EduSkills', ctas: pesCtas, color: '#00ff88' },
          { brand: 'Nilaya Education', ctas: nilayaCtas, color: '#00d4ff' },
        ].map(({ brand, ctas, color }, bi) => (
          <div key={brand}>
            <p className="text-[11px] text-white/40 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {brand} CTAs Detected
            </p>
            <div className="flex flex-wrap gap-2">
              {ctas.length > 0 ? (
                ctas.map((cta, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: bi * 0.1 + i * 0.05 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border"
                    style={{
                      color,
                      borderColor: `${color}30`,
                      background: `${color}08`,
                    }}
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                    {cta}
                  </motion.span>
                ))
              ) : (
                <span className="text-[11px] text-white/20 italic">No CTAs detected</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Placement claims */}
      <div className="mt-5 pt-4 border-t border-white/5">
        <p className="text-[11px] text-white/40 mb-2 flex items-center gap-1.5">
          <Star className="w-3 h-3 text-neon-yellow" />
          Placement Claims Detected
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { brand: 'PES', claims: pesWebsite.placement_claims, color: '#00ff88' },
            { brand: 'Nilaya', claims: nilayaWebsite.placement_claims, color: '#00d4ff' },
          ].map(({ brand, claims, color }) => (
            <div key={brand} className="bg-dark-800 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] font-bold mb-2" style={{ color }}>{brand}</p>
              {claims.length > 0 ? (
                <ul className="space-y-1">
                  {claims.slice(0, 4).map((claim, i) => (
                    <li key={i} className="text-[10px] text-white/60 flex items-start gap-1">
                      <span className="text-neon-yellow mt-0.5">•</span>
                      {claim}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-white/20 italic">None detected</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Copywriting comparison */}
      {analysis.copywriting_comparison && (
        <div className="mt-4 p-3 bg-dark-800 rounded-lg border border-neon-purple/10">
          <p className="text-[10px] text-neon-purple mb-1 font-medium">Copywriting Comparison</p>
          <p className="text-[11px] text-white/60 line-clamp-4">{analysis.copywriting_comparison}</p>
        </div>
      )}
    </div>
  );
}
