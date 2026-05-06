from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DateRange(str, Enum):
    TODAY = "today"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    CUSTOM = "custom"


class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AnalysisRequest(BaseModel):
    date_range: DateRange = DateRange.TODAY
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    session_id: Optional[str] = None
    force_refresh: bool = False


class AdData(BaseModel):
    id: str
    title: Optional[str] = None
    body: Optional[str] = None
    cta: Optional[str] = None
    media_type: Optional[str] = None
    start_date: Optional[str] = None
    status: str = "active"
    impressions_range: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None


class SocialMetrics(BaseModel):
    platform: str
    followers: Optional[int] = None
    following: Optional[int] = None
    posts_count: Optional[int] = None
    recent_posts: List[Dict[str, Any]] = []
    engagement_rate: Optional[float] = None
    posting_frequency: Optional[str] = None
    last_post_date: Optional[str] = None


class WebsiteData(BaseModel):
    url: str
    title: Optional[str] = None
    meta_description: Optional[str] = None
    cta_buttons: List[str] = []
    courses: List[Dict[str, Any]] = []
    pricing: List[Dict[str, Any]] = []
    testimonials_count: int = 0
    hero_copy: Optional[str] = None
    placement_claims: List[str] = []
    trust_signals: List[str] = []
    load_time_ms: Optional[int] = None


class BrandData(BaseModel):
    name: str
    website: WebsiteData
    ads: List[AdData] = []
    social: List[SocialMetrics] = []
    active_ad_count: int = 0
    scraped_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CompetitorScores(BaseModel):
    brand: str
    ad_activity_score: float = Field(ge=0, le=100)
    content_frequency_score: float = Field(ge=0, le=100)
    engagement_score: float = Field(ge=0, le=100)
    brand_authority_score: float = Field(ge=0, le=100)
    trust_score: float = Field(ge=0, le=100)
    placement_positioning_score: float = Field(ge=0, le=100)
    founder_branding_score: float = Field(ge=0, le=100)
    ai_readiness_score: float = Field(ge=0, le=100)
    innovation_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)


class SWOTAnalysis(BaseModel):
    brand: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    opportunities: List[str] = []
    threats: List[str] = []


class StrategicRecommendation(BaseModel):
    category: str
    priority: str  # high, medium, low
    title: str
    description: str
    action_items: List[str] = []
    expected_impact: str


class AIAnalysis(BaseModel):
    summary: str
    which_brand_ahead: str
    why_competitor_ahead: Optional[str] = None
    funnel_analysis: str
    emotional_marketing: str
    cta_effectiveness: Dict[str, str] = {}
    copywriting_comparison: str
    brand_positioning: Dict[str, str] = {}
    daily_battle_report: str
    missed_opportunities: List[str] = []
    suggested_campaigns: List[str] = []
    suggested_reel_ideas: List[str] = []
    suggested_ad_hooks: List[str] = []
    suggested_whatsapp_campaigns: List[str] = []
    suggested_landing_page_improvements: List[str] = []
    swot: Dict[str, SWOTAnalysis] = {}
    scores: Dict[str, CompetitorScores] = {}
    recommendations: List[StrategicRecommendation] = []
    alerts: List[Dict[str, str]] = []
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class FullAnalysisResponse(BaseModel):
    session_id: str
    date_range: str
    pes_data: BrandData
    nilaya_data: BrandData
    ai_analysis: AIAnalysis
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    response: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AlertItem(BaseModel):
    id: str
    severity: str  # critical, warning, info
    title: str
    description: str
    brand: str
    platform: str
    detected_at: str
    action_required: Optional[str] = None


class ExportRequest(BaseModel):
    session_id: str
    format: str  # pdf | excel
    include_charts: bool = True
    include_swot: bool = True
    include_recommendations: bool = True
