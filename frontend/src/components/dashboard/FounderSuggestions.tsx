'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AIAnalysis } from '@/types';
import { Lightbulb, Film, MessageCircle, Megaphone, Globe, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { priorityColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  analysis: AIAnalysis;
}

type Tab = 'campaigns' | 'reels' | 'hooks' | 'whatsapp' | 'website';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'reels',     label: 'Reel Ideas', icon: Film },
  { id: 'hooks',     label: 'Ad Hooks', icon: Lightbulb },
  { id: 'whatsapp',  label: 'WhatsApp', icon: MessageCircle },
  { id: 'website',   label: 'Website', icon: Globe },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded text-white/30 hover:text-neon-green transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function FounderSuggestions({ analysis }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const CONTENT: Record<Tab, string[]> = {
    campaigns: analysis.suggested_campaigns,
    reels: analysis.suggested_reel_ideas,
    hooks: analysis.suggested_ad_hooks,
    whatsapp: analysis.suggested_whatsapp_campaigns,
    website: analysis.suggested_landing_page_improvements,
  };

  const items = CONTENT[activeTab] || [];

  return (
    <div className="glass-card rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Founder Decision Suggestions</h2>
          <p className="text-[11px] text-white/40 mt-0.5">AI-generated strategic recommendations</p>
        </div>
        <Lightbulb className="w-4 h-4 text-neon-yellow" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {items.length > 0 ? (
            items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 bg-dark-800 rounded-lg p-3 border border-white/5 group"
              >
                <span className="text-[10px] font-bold text-neon-green/60 w-4 flex-shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-white/70 flex-1 leading-relaxed">{item}</p>
                <CopyButton text={item} />
              </motion.div>
            ))
          ) : (
            <p className="text-[11px] text-white/30 text-center py-6">
              Run analysis to generate AI suggestions
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Strategic recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-[11px] text-white/40 mb-3 font-medium">Priority Action Items</p>
          <div className="space-y-2">
            {analysis.recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="bg-dark-800 rounded-lg border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: priorityColor(rec.priority),
                        background: `${priorityColor(rec.priority)}15`,
                        border: `1px solid ${priorityColor(rec.priority)}30`,
                      }}
                    >
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-white/80 font-medium">{rec.title}</span>
                  </div>
                  {expandedRec === i ? (
                    <ChevronUp className="w-3 h-3 text-white/30" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-white/30" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedRec === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 px-3 pb-3"
                    >
                      <p className="text-[11px] text-white/60 mt-2 mb-2">{rec.description}</p>
                      <ul className="space-y-1">
                        {rec.action_items.slice(0, 3).map((action, j) => (
                          <li key={j} className="text-[10px] text-white/50 flex items-start gap-1">
                            <span className="text-neon-green mt-0.5">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                      {rec.expected_impact && (
                        <p className="text-[10px] text-neon-purple mt-2 font-medium">
                          Impact: {rec.expected_impact}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
