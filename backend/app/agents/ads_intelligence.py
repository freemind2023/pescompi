import json
from typing import Dict, Any, List
from app.services.claude_service import analyze_with_claude
from app.models.schemas import AdData


ADS_ANALYSIS_PROMPT = """You are an expert Meta Ads analyst specializing in the Indian EdTech market.

Analyze the following ad data from TWO competitors and provide:

1. **Ad Activity Assessment** — How aggressive is each brand's ad spending?
2. **Creative Analysis** — What angles/hooks are they using?
3. **CTA Psychology** — Break down their call-to-action strategy
4. **Emotional Triggers** — Fear, aspiration, social proof, urgency?
5. **Messaging Shifts** — Any pattern changes detected?
6. **Placement Claims** — What achievements do they highlight?
7. **Winning Ad Formula** — What's working for the competitor?
8. **Counter Strategy** — Specific ad recommendations for Practical EduSkills

Competitor Data:
{ads_data}

Return a detailed JSON with keys: activity_assessment, creative_analysis, cta_psychology, emotional_triggers, messaging_shifts, placement_claims, winning_formula, counter_strategy, pes_ad_recommendations (list of 5 specific ad copy suggestions), ad_spend_tier_comparison
"""


class AdsIntelligenceAgent:
    async def analyze(
        self,
        pes_ads: List[AdData],
        nilaya_ads: List[AdData],
    ) -> Dict[str, Any]:
        ads_data = {
            "PES_ads": [ad.model_dump() for ad in pes_ads[:10]],
            "Nilaya_ads": [ad.model_dump() for ad in nilaya_ads[:10]],
            "pes_active_count": len(pes_ads),
            "nilaya_active_count": len(nilaya_ads),
        }

        prompt = ADS_ANALYSIS_PROMPT.format(ads_data=json.dumps(ads_data, indent=2))
        raw = await analyze_with_claude(prompt)

        # Parse JSON from Claude response
        result = self._parse_json_response(raw)
        result["raw_analysis"] = raw
        result["pes_ad_count"] = len(pes_ads)
        result["nilaya_ad_count"] = len(nilaya_ads)

        # Score ad activity (0-100)
        result["pes_score"] = self._score_activity(len(pes_ads))
        result["nilaya_score"] = self._score_activity(len(nilaya_ads))

        return result

    def _score_activity(self, ad_count: int) -> float:
        if ad_count == 0:
            return 0.0
        elif ad_count <= 3:
            return min(ad_count * 10.0, 30.0)
        elif ad_count <= 10:
            return 30.0 + (ad_count - 3) * 7.0
        elif ad_count <= 25:
            return 79.0 + (ad_count - 10) * 1.4
        return min(100.0, 79.0 + 15 * 1.4)

    def _parse_json_response(self, raw: str) -> Dict:
        import re
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except Exception:
                pass
        return {"raw": raw, "parse_error": True}

    async def generate_ad_hooks(self, brand_data: Dict, competitor_ads: List[AdData]) -> List[str]:
        competitor_copy = [ad.body or ad.title or "" for ad in competitor_ads[:5]]
        prompt = f"""Based on these competitor ad copies from Indian EdTech:
{chr(10).join(f'- {c}' for c in competitor_copy if c)}

Generate 8 high-converting ad hooks for Practical EduSkills targeting job-seekers in India.
Format: Return a JSON array of strings. Each hook should be under 150 characters, emotionally resonant, and specific."""

        raw = await analyze_with_claude(prompt)
        import re
        arr_match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if arr_match:
            try:
                return json.loads(arr_match.group())
            except Exception:
                pass
        lines = [l.strip().lstrip("•-*123456789. ") for l in raw.split("\n") if len(l.strip()) > 20]
        return lines[:8]
