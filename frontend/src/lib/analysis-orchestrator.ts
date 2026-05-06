import { scrapeWebsite } from './scrapers/website';
import { scrapeInstagram } from './scrapers/instagram';
import { scrapeYouTube } from './scrapers/youtube';
import { scrapeMetaAds } from './scrapers/meta-ads';
import { analyzeWithClaude, parseJsonFromClaude, parseArrayFromClaude } from './claude';

const PES = {
  name: 'Practical EduSkills',
  website: 'https://www.practicaleduskills.com/',
  instagram: 'https://www.instagram.com/practical_eduskills/',
  youtube: 'https://www.youtube.com/@practicaleduskills2338',
  adsPageId: '1918954478374979',
};
const NILAYA = {
  name: 'Nilaya Education',
  website: 'https://nilayaeducation.org/',
  instagram: 'https://www.instagram.com/nilayaeducationpune/',
  youtube: 'https://www.youtube.com/@nilayaeducationpune',
  adsPageId: '673182602853634',
};

export async function runFullAnalysis(dateRange: string) {
  // Scrape both brands fully concurrently
  const [pesWebsite, nilayaWebsite, pesIG, nilayaIG, pesYT, nilayaYT, pesAds, nilayaAds] =
    await Promise.allSettled([
      scrapeWebsite(PES.website),
      scrapeWebsite(NILAYA.website),
      scrapeInstagram(PES.instagram),
      scrapeInstagram(NILAYA.instagram),
      scrapeYouTube(PES.youtube),
      scrapeYouTube(NILAYA.youtube),
      scrapeMetaAds(PES.adsPageId, PES.name),
      scrapeMetaAds(NILAYA.adsPageId, NILAYA.name),
    ]);

  const resolved = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value : fallback;

  const pesData = {
    name: PES.name,
    website: resolved(pesWebsite, { url: PES.website, cta_buttons: [], courses: [], pricing: [], placement_claims: [], trust_signals: [], testimonials_count: 0 }),
    social: [resolved(pesIG, { platform: 'instagram', followers: 0, recent_posts: [] }), resolved(pesYT, { platform: 'youtube', followers: 0, recent_posts: [] })],
    ads: resolved(pesAds, { ads: [], active_count: 0 }).ads,
    active_ad_count: resolved(pesAds, { ads: [], active_count: 0 }).active_count,
  };

  const nilayaData = {
    name: NILAYA.name,
    website: resolved(nilayaWebsite, { url: NILAYA.website, cta_buttons: [], courses: [], pricing: [], placement_claims: [], trust_signals: [], testimonials_count: 0 }),
    social: [resolved(nilayaIG, { platform: 'instagram', followers: 0, recent_posts: [] }), resolved(nilayaYT, { platform: 'youtube', followers: 0, recent_posts: [] })],
    ads: resolved(nilayaAds, { ads: [], active_count: 0 }).ads,
    active_ad_count: resolved(nilayaAds, { ads: [], active_count: 0 }).active_count,
  };

  // Single comprehensive Claude analysis
  const aiAnalysis = await generateAIAnalysis(pesData, nilayaData, dateRange);

  return {
    date_range: dateRange,
    pes_data: pesData,
    nilaya_data: nilayaData,
    ai_analysis: aiAnalysis,
    generated_at: new Date().toISOString(),
  };
}

async function generateAIAnalysis(pes: Record<string, unknown>, nilaya: Record<string, unknown>, dateRange: string) {
  const context = {
    analysis_date: new Date().toISOString(),
    date_range: dateRange,
    pes: {
      active_ads: (pes.active_ad_count as number) || 0,
      website_ctas: ((pes.website as Record<string, unknown>)?.cta_buttons as string[])?.slice(0, 5) || [],
      website_courses: ((pes.website as Record<string, unknown>)?.courses as unknown[])?.length || 0,
      placement_claims: ((pes.website as Record<string, unknown>)?.placement_claims as string[]) || [],
      instagram_followers: ((pes.social as Record<string, unknown>[])?.[0]?.followers as number) || 0,
      youtube_subscribers: ((pes.social as Record<string, unknown>[])?.[1]?.followers as number) || 0,
    },
    nilaya: {
      active_ads: (nilaya.active_ad_count as number) || 0,
      website_ctas: ((nilaya.website as Record<string, unknown>)?.cta_buttons as string[])?.slice(0, 5) || [],
      website_courses: ((nilaya.website as Record<string, unknown>)?.courses as unknown[])?.length || 0,
      placement_claims: ((nilaya.website as Record<string, unknown>)?.placement_claims as string[]) || [],
      instagram_followers: ((nilaya.social as Record<string, unknown>[])?.[0]?.followers as number) || 0,
      youtube_subscribers: ((nilaya.social as Record<string, unknown>[])?.[1]?.followers as number) || 0,
    },
  };

  const prompt = `Analyze this competitive intelligence data for Practical EduSkills (PES) vs Nilaya Education.

Data: ${JSON.stringify(context, null, 2)}

Return a comprehensive JSON with EXACTLY these keys:
{
  "summary": "2-3 sentence executive summary",
  "which_brand_ahead": "PES or Nilaya — with reason",
  "why_competitor_ahead": "specific reasons if Nilaya leads",
  "funnel_analysis": "complete funnel comparison",
  "emotional_marketing": "emotional triggers each brand uses",
  "cta_effectiveness": {"PES": "analysis", "Nilaya": "analysis"},
  "copywriting_comparison": "side-by-side analysis",
  "brand_positioning": {"PES": "positioning", "Nilaya": "positioning"},
  "daily_battle_report": "today's battlefield status — who's winning and why",
  "missed_opportunities": ["opp1", "opp2", "opp3", "opp4", "opp5"],
  "suggested_campaigns": ["campaign1", "campaign2", "campaign3"],
  "suggested_reel_ideas": ["reel1", "reel2", "reel3", "reel4", "reel5"],
  "suggested_ad_hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "suggested_whatsapp_campaigns": ["msg1", "msg2", "msg3"],
  "suggested_landing_page_improvements": ["imp1", "imp2", "imp3"],
  "swot": {
    "PES": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
    "Nilaya": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}
  },
  "scores": {
    "PES": {"ad_activity_score": 0-100, "content_frequency_score": 0-100, "engagement_score": 0-100, "brand_authority_score": 0-100, "trust_score": 0-100, "placement_positioning_score": 0-100, "founder_branding_score": 0-100, "ai_readiness_score": 0-100, "innovation_score": 0-100, "overall_score": 0-100},
    "Nilaya": {"ad_activity_score": 0-100, "content_frequency_score": 0-100, "engagement_score": 0-100, "brand_authority_score": 0-100, "trust_score": 0-100, "placement_positioning_score": 0-100, "founder_branding_score": 0-100, "ai_readiness_score": 0-100, "innovation_score": 0-100, "overall_score": 0-100}
  },
  "recommendations": [
    {"category": "Advertising", "priority": "high", "title": "...", "description": "...", "action_items": [], "expected_impact": "..."}
  ],
  "alerts": [
    {"id": "a1", "severity": "critical|warning|info", "title": "...", "description": "...", "brand": "...", "platform": "...", "detected_at": "${new Date().toISOString()}"}
  ]
}`;

  const raw = await analyzeWithClaude(prompt, context);
  const parsed = parseJsonFromClaude(raw);

  // Ensure scores have numeric values
  for (const brand of ['PES', 'Nilaya']) {
    const scores = (parsed.scores as Record<string, Record<string, unknown>>)?.[brand] || {};
    for (const key of Object.keys(scores)) {
      scores[key] = parseFloat(String(scores[key])) || 50;
    }
  }

  return parsed;
}
