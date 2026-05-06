'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Play } from 'lucide-react';
import { useAuthStore, useAnalysisStore, useAlertStore } from '@/lib/store';
import { useAnalysis } from '@/hooks/useAnalysis';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CompetitorScore from '@/components/dashboard/CompetitorScore';
import AdActivityHeatmap from '@/components/dashboard/AdActivityHeatmap';
import SocialGrowthTracker from '@/components/dashboard/SocialGrowthTracker';
import FunnelComparison from '@/components/dashboard/FunnelComparison';
import ContentFrequency from '@/components/dashboard/ContentFrequency';
import BrandSentiment from '@/components/dashboard/BrandSentiment';
import CTAAnalysis from '@/components/dashboard/CTAAnalysis';
import PlatformPerformance from '@/components/dashboard/PlatformPerformance';
import FounderSuggestions from '@/components/dashboard/FounderSuggestions';
import AIAlerts from '@/components/dashboard/AIAlerts';
import JarvisChat from '@/components/jarvis/JarvisChat';

type Section =
  | 'overview' | 'ads' | 'social' | 'website' | 'funnel'
  | 'scores' | 'strategy' | 'alerts' | 'jarvis' | 'export';

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const { analysis, isLoading, error, fetchAnalysis } = useAnalysis();
  const { setAlerts } = useAlertStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    // Attempt to load cached analysis
    fetchAnalysis(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (analysis?.ai_analysis?.alerts) {
      setAlerts(analysis.ai_analysis.alerts);
    }
  }, [analysis, setAlerts]);

  // --- Empty State ---
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/10 to-neon-blue/10 border border-neon-green/20 flex items-center justify-center mb-6">
        <Play className="w-9 h-9 text-neon-green" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Ready to Launch</h2>
      <p className="text-sm text-white/40 max-w-md mb-6">
        Click <span className="text-neon-green font-medium">Analyze Today</span> in the header to scrape live data from all platforms and generate your AI intelligence report.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-white/30 max-w-lg">
        {['Meta Ads Library', 'Instagram', 'YouTube', 'LinkedIn', 'Website CTAs', 'Course Pricing', 'AI Analysis', 'PDF Export'].map((item) => (
          <div key={item} className="px-3 py-2 bg-dark-800 rounded-lg border border-white/5">{item}</div>
        ))}
      </div>
    </motion.div>
  );

  // --- Loading State ---
  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-neon-green/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-neon-green/10 animate-ping" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">War Room Activating</h2>
      <p className="text-sm text-white/40 mb-4">Scraping live data from all platforms...</p>
      <div className="space-y-1.5 text-[11px] text-white/30">
        {['Meta Ads Library', 'Instagram profiles', 'YouTube channels', 'LinkedIn pages', 'Website analysis', 'AI generating report'].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            {step}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // --- Error State ---
  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <AlertCircle className="w-12 h-12 text-neon-red mb-4" />
      <h2 className="text-lg font-bold text-white mb-2">Analysis Failed</h2>
      <p className="text-sm text-white/50 max-w-md mb-4">{error}</p>
      <button
        onClick={() => fetchAnalysis(true)}
        className="px-5 py-2.5 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-medium hover:bg-neon-green/20 transition-all"
      >
        Retry Analysis
      </button>
    </motion.div>
  );

  // --- Section renderer ---
  function renderSection() {
    if (isLoading) return <LoadingState />;
    if (error && !analysis) return <ErrorState />;
    if (!analysis) return <EmptyState />;

    const { pes_data, nilaya_data, ai_analysis } = analysis;

    const sections: Record<Section, React.ReactNode> = {
      overview: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CompetitorScore scores={ai_analysis.scores} whichAhead={ai_analysis.which_brand_ahead} />
          <div className="space-y-4">
            <AdActivityHeatmap pesAds={pes_data.ads} nilayaAds={nilaya_data.ads} />
          </div>
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SocialGrowthTracker pesSocial={pes_data.social} nilayaSocial={nilaya_data.social} />
            <BrandSentiment analysis={ai_analysis} />
            <FounderSuggestions analysis={ai_analysis} />
          </div>
          {/* Daily battle report */}
          <div className="xl:col-span-2 glass-card rounded-xl p-5 border border-white/5">
            <p className="text-[11px] text-neon-green font-bold mb-2">⚔️ TODAY'S BATTLE REPORT</p>
            <p className="text-sm text-white/70 leading-relaxed">{ai_analysis.daily_battle_report}</p>
          </div>
        </div>
      ),
      ads: <AdActivityHeatmap pesAds={pes_data.ads} nilayaAds={nilaya_data.ads} />,
      social: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SocialGrowthTracker pesSocial={pes_data.social} nilayaSocial={nilaya_data.social} />
          <ContentFrequency pesSocial={pes_data.social} nilayaSocial={nilaya_data.social} />
        </div>
      ),
      website: <PlatformPerformance pes={pes_data} nilaya={nilaya_data} />,
      funnel: <FunnelComparison analysis={ai_analysis} />,
      scores: <CompetitorScore scores={ai_analysis.scores} whichAhead={ai_analysis.which_brand_ahead} />,
      strategy: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <FounderSuggestions analysis={ai_analysis} />
          <CTAAnalysis analysis={ai_analysis} pesWebsite={pes_data.website} nilayaWebsite={nilaya_data.website} />
        </div>
      ),
      alerts: <AIAlerts alerts={ai_analysis.alerts} />,
      jarvis: <JarvisChat />,
      export: (
        <div className="glass-card rounded-xl p-8 border border-white/5 text-center">
          <p className="text-lg font-bold text-white mb-2">Export Reports</p>
          <p className="text-sm text-white/40 mb-6">Use the PDF and Excel buttons in the header to download your full intelligence report.</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm">
            {[
              { label: 'PDF Report', desc: 'Charts, SWOT, AI analysis', color: '#bf5af2' },
              { label: 'Excel Report', desc: 'All data in sheets', color: '#00ff88' },
            ].map(({ label, desc, color }) => (
              <div key={label} className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <p className="font-bold mb-1" style={{ color }}>{label}</p>
                <p className="text-[11px] text-white/40">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    };

    return sections[activeSection] || null;
  }

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <Sidebar activeSection={activeSection} onSectionChange={(id) => setActiveSection(id as Section)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
