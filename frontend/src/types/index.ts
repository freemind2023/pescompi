export interface AdData {
  id: string;
  title?: string;
  body?: string;
  cta?: string;
  media_type?: string;
  start_date?: string;
  status: string;
  impressions_range?: string;
  platform?: string;
  url?: string;
}

export interface SocialMetrics {
  platform: string;
  followers?: number;
  following?: number;
  posts_count?: number;
  recent_posts: Record<string, unknown>[];
  engagement_rate?: number;
  posting_frequency?: string;
  last_post_date?: string;
}

export interface WebsiteData {
  url: string;
  title?: string;
  meta_description?: string;
  cta_buttons: string[];
  courses: Record<string, unknown>[];
  pricing: Record<string, unknown>[];
  testimonials_count: number;
  hero_copy?: string;
  placement_claims: string[];
  trust_signals: string[];
  load_time_ms?: number;
}

export interface BrandData {
  name: string;
  website: WebsiteData;
  ads: AdData[];
  social: SocialMetrics[];
  active_ad_count: number;
  scraped_at: string;
}

export interface CompetitorScores {
  brand: string;
  ad_activity_score: number;
  content_frequency_score: number;
  engagement_score: number;
  brand_authority_score: number;
  trust_score: number;
  placement_positioning_score: number;
  founder_branding_score: number;
  ai_readiness_score: number;
  innovation_score: number;
  overall_score: number;
}

export interface SWOTAnalysis {
  brand: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface StrategicRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_items: string[];
  expected_impact: string;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  brand: string;
  platform: string;
  detected_at: string;
  action_required?: string;
}

export interface AIAnalysis {
  summary: string;
  which_brand_ahead: string;
  why_competitor_ahead?: string;
  funnel_analysis: string;
  emotional_marketing: string;
  cta_effectiveness: Record<string, string>;
  copywriting_comparison: string;
  brand_positioning: Record<string, string>;
  daily_battle_report: string;
  missed_opportunities: string[];
  suggested_campaigns: string[];
  suggested_reel_ideas: string[];
  suggested_ad_hooks: string[];
  suggested_whatsapp_campaigns: string[];
  suggested_landing_page_improvements: string[];
  swot: Record<string, SWOTAnalysis>;
  scores: Record<string, CompetitorScores>;
  recommendations: StrategicRecommendation[];
  alerts: AlertItem[];
  generated_at: string;
}

export interface FullAnalysisResponse {
  session_id: string;
  date_range: string;
  pes_data: BrandData;
  nilaya_data: BrandData;
  ai_analysis: AIAnalysis;
  generated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type DateRange = 'today' | 'last_7_days' | 'last_30_days' | 'custom';

export interface AnalysisRequest {
  date_range: DateRange;
  start_date?: string;
  end_date?: string;
  session_id?: string;
  force_refresh?: boolean;
}

export interface AuthState {
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
}
