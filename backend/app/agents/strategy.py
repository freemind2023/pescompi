import json
import re
from typing import Dict, Any, List
from app.services.claude_service import analyze_with_claude, batch_analyze
from app.models.schemas import (
    AIAnalysis, SWOTAnalysis, CompetitorScores, StrategicRecommendation,
    BrandData, AlertItem
)
import uuid
from datetime import datetime


MASTER_ANALYSIS_PROMPT = """You are the Chief Strategy Officer for Practical EduSkills (PES), an EdTech company in Pune, India competing with Nilaya Education.

You have been given comprehensive competitive intelligence. Your task is to produce a complete strategic war room analysis.

Data:
{all_data}

Produce a JSON response with EXACTLY these keys:
{{
  "summary": "2-3 sentence executive summary of competitive position",
  "which_brand_ahead": "PES or Nilaya — with specific reason",
  "why_competitor_ahead": "If Nilaya is ahead, specific reasons",
  "funnel_analysis": "Complete funnel comparison (awareness → lead → enroll)",
  "emotional_marketing": "Emotional triggers each brand uses",
  "cta_effectiveness": {{"PES": "analysis", "Nilaya": "analysis"}},
  "copywriting_comparison": "Side-by-side copy analysis",
  "brand_positioning": {{"PES": "how they position", "Nilaya": "how they position"}},
  "daily_battle_report": "Today's battlefield status — who's winning and why",
  "missed_opportunities": ["opportunity 1", "opportunity 2", ...],
  "suggested_campaigns": ["campaign idea 1", ...],
  "suggested_reel_ideas": ["reel idea 1", ...],
  "suggested_ad_hooks": ["hook 1", ...],
  "suggested_whatsapp_campaigns": ["campaign 1", ...],
  "suggested_landing_page_improvements": ["improvement 1", ...],
  "swot": {{
    "PES": {{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}},
    "Nilaya": {{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}}
  }},
  "scores": {{
    "PES": {{
      "ad_activity_score": 0-100,
      "content_frequency_score": 0-100,
      "engagement_score": 0-100,
      "brand_authority_score": 0-100,
      "trust_score": 0-100,
      "placement_positioning_score": 0-100,
      "founder_branding_score": 0-100,
      "ai_readiness_score": 0-100,
      "innovation_score": 0-100,
      "overall_score": 0-100
    }},
    "Nilaya": {{ same structure }}
  }},
  "recommendations": [
    {{
      "category": "Advertising|Social|Website|Content|Branding",
      "priority": "high|medium|low",
      "title": "Action title",
      "description": "Detailed description",
      "action_items": ["specific action 1", ...],
      "expected_impact": "Expected result in 30-60 days"
    }}
  ],
  "alerts": [
    {{
      "severity": "critical|warning|info",
      "title": "Alert title",
      "description": "What was detected",
      "brand": "PES or Nilaya",
      "platform": "facebook|instagram|website|youtube"
    }}
  ]
}}

Be specific, data-driven, and action-oriented. Every score must be justified."""


class StrategyAgent:
    async def generate_full_analysis(
        self,
        pes_data: BrandData,
        nilaya_data: BrandData,
        ads_analysis: Dict,
        social_analysis: Dict,
    ) -> AIAnalysis:
        all_data = {
            "PES_website": pes_data.website.model_dump(),
            "Nilaya_website": nilaya_data.website.model_dump(),
            "PES_ads_count": len(pes_data.ads),
            "Nilaya_ads_count": len(nilaya_data.ads),
            "PES_social_summary": self._summarize_social(pes_data),
            "Nilaya_social_summary": self._summarize_social(nilaya_data),
            "ads_analysis_highlights": {
                k: v for k, v in ads_analysis.items()
                if k not in ("raw_analysis", "raw")
            },
            "social_highlights": {
                k: v for k, v in social_analysis.items()
                if k not in ("raw_analysis", "raw")
            },
        }

        prompt = MASTER_ANALYSIS_PROMPT.format(all_data=json.dumps(all_data, indent=2))
        raw = await analyze_with_claude(prompt)
        parsed = self._parse_json(raw)

        return self._build_analysis(parsed)

    def _summarize_social(self, brand: BrandData) -> Dict:
        summary = {}
        for s in brand.social:
            summary[s.platform] = {
                "followers": s.followers,
                "engagement_rate": s.engagement_rate,
                "posting_frequency": s.posting_frequency,
                "recent_posts_count": len(s.recent_posts),
            }
        return summary

    def _build_analysis(self, parsed: Dict) -> AIAnalysis:
        swot = {}
        raw_swot = parsed.get("swot", {})
        for brand_key, brand_name in [("PES", "Practical EduSkills"), ("Nilaya", "Nilaya Education")]:
            s = raw_swot.get(brand_key, {})
            swot[brand_key] = SWOTAnalysis(
                brand=brand_name,
                strengths=s.get("strengths", [])[:6],
                weaknesses=s.get("weaknesses", [])[:6],
                opportunities=s.get("opportunities", [])[:6],
                threats=s.get("threats", [])[:6],
            )

        scores = {}
        raw_scores = parsed.get("scores", {})
        for brand_key, brand_name in [("PES", "Practical EduSkills"), ("Nilaya", "Nilaya Education")]:
            s = raw_scores.get(brand_key, {})
            scores[brand_key] = CompetitorScores(
                brand=brand_name,
                ad_activity_score=float(s.get("ad_activity_score", 50)),
                content_frequency_score=float(s.get("content_frequency_score", 50)),
                engagement_score=float(s.get("engagement_score", 50)),
                brand_authority_score=float(s.get("brand_authority_score", 50)),
                trust_score=float(s.get("trust_score", 50)),
                placement_positioning_score=float(s.get("placement_positioning_score", 50)),
                founder_branding_score=float(s.get("founder_branding_score", 50)),
                ai_readiness_score=float(s.get("ai_readiness_score", 50)),
                innovation_score=float(s.get("innovation_score", 50)),
                overall_score=float(s.get("overall_score", 50)),
            )

        recommendations = []
        for r in parsed.get("recommendations", [])[:8]:
            recommendations.append(
                StrategicRecommendation(
                    category=r.get("category", "General"),
                    priority=r.get("priority", "medium"),
                    title=r.get("title", ""),
                    description=r.get("description", ""),
                    action_items=r.get("action_items", []),
                    expected_impact=r.get("expected_impact", ""),
                )
            )

        alerts = []
        for a in parsed.get("alerts", []):
            alerts.append({
                "id": str(uuid.uuid4())[:8],
                "severity": a.get("severity", "info"),
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "brand": a.get("brand", ""),
                "platform": a.get("platform", ""),
                "detected_at": datetime.utcnow().isoformat(),
            })

        return AIAnalysis(
            summary=parsed.get("summary", "Analysis complete."),
            which_brand_ahead=parsed.get("which_brand_ahead", "Unknown"),
            why_competitor_ahead=parsed.get("why_competitor_ahead"),
            funnel_analysis=parsed.get("funnel_analysis", ""),
            emotional_marketing=parsed.get("emotional_marketing", ""),
            cta_effectiveness=parsed.get("cta_effectiveness", {}),
            copywriting_comparison=parsed.get("copywriting_comparison", ""),
            brand_positioning=parsed.get("brand_positioning", {}),
            daily_battle_report=parsed.get("daily_battle_report", ""),
            missed_opportunities=parsed.get("missed_opportunities", [])[:8],
            suggested_campaigns=parsed.get("suggested_campaigns", [])[:6],
            suggested_reel_ideas=parsed.get("suggested_reel_ideas", [])[:8],
            suggested_ad_hooks=parsed.get("suggested_ad_hooks", [])[:8],
            suggested_whatsapp_campaigns=parsed.get("suggested_whatsapp_campaigns", [])[:5],
            suggested_landing_page_improvements=parsed.get("suggested_landing_page_improvements", [])[:6],
            swot=swot,
            scores=scores,
            recommendations=recommendations,
            alerts=alerts,
        )

    def _parse_json(self, raw: str) -> Dict:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        return {"summary": raw[:500], "parse_error": True}
