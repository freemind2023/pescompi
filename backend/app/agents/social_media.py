import json
import re
from typing import Dict, Any, List
from app.services.claude_service import analyze_with_claude
from app.models.schemas import SocialMetrics


SOCIAL_ANALYSIS_PROMPT = """You are a social media strategist specialized in Indian EdTech brands.

Analyze the social media data below for Practical EduSkills (PES) vs Nilaya Education.

Provide a comprehensive analysis including:
1. **Platform-wise Comparison** — Who dominates each platform?
2. **Content Strategy** — What content types are they producing?
3. **Engagement Analysis** — Who has better audience quality?
4. **Posting Frequency** — Who is more consistent?
5. **Growth Trajectory** — Who is growing faster?
6. **Content Gaps** — What opportunities is the competitor missing?
7. **Viral Content Patterns** — What content performs best?
8. **Community Building** — Who has stronger community?
9. **Reel Strategy** — Instagram Reels analysis
10. **Platform Recommendations** — Where should PES focus?

Social Data:
{social_data}

Return detailed JSON with: platform_comparison, content_strategy, engagement_analysis, posting_frequency_score (dict), growth_trajectory, content_gaps, viral_patterns, community_strength, reel_ideas (list of 8), platform_priority (ranked list for PES)
"""


class SocialMediaAgent:
    async def analyze(
        self,
        pes_social: List[SocialMetrics],
        nilaya_social: List[SocialMetrics],
    ) -> Dict[str, Any]:
        social_data = {
            "PES": {s.platform: s.model_dump() for s in pes_social},
            "Nilaya": {s.platform: s.model_dump() for s in nilaya_social},
        }

        prompt = SOCIAL_ANALYSIS_PROMPT.format(social_data=json.dumps(social_data, indent=2))
        raw = await analyze_with_claude(prompt)
        result = self._parse_json(raw)
        result["raw_analysis"] = raw

        # Calculate scores
        result["pes_total_reach"] = self._total_followers(pes_social)
        result["nilaya_total_reach"] = self._total_followers(nilaya_social)
        result["platform_scores"] = self._compute_platform_scores(pes_social, nilaya_social)

        return result

    def _total_followers(self, metrics: List[SocialMetrics]) -> int:
        return sum(m.followers or 0 for m in metrics)

    def _compute_platform_scores(
        self,
        pes: List[SocialMetrics],
        nilaya: List[SocialMetrics],
    ) -> Dict[str, Dict]:
        scores = {}
        pes_map = {m.platform: m for m in pes}
        nilaya_map = {m.platform: m for m in nilaya}

        for platform in ["instagram", "youtube", "linkedin", "facebook"]:
            p = pes_map.get(platform)
            n = nilaya_map.get(platform)
            pes_f = p.followers or 0 if p else 0
            nilaya_f = n.followers or 0 if n else 0
            total = max(pes_f + nilaya_f, 1)
            scores[platform] = {
                "pes_followers": pes_f,
                "nilaya_followers": nilaya_f,
                "pes_share": round(pes_f / total * 100, 1),
                "nilaya_share": round(nilaya_f / total * 100, 1),
                "leader": "PES" if pes_f >= nilaya_f else "Nilaya",
            }
        return scores

    def _parse_json(self, raw: str) -> Dict:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        return {"raw": raw}

    async def generate_reel_ideas(self, brand_data: Dict, competitor_data: Dict) -> List[str]:
        prompt = f"""Competitor context: {json.dumps(competitor_data, indent=2)[:2000]}

Generate 10 viral Instagram Reel ideas specifically for Practical EduSkills (Indian EdTech company).
Each idea should be:
- Trend-aware (2025 trends)
- Specific to the skill training/placement niche
- Include hook text and concept
- Designed to drive enrollment inquiries

Return a JSON array of reel ideas."""

        raw = await analyze_with_claude(prompt)
        arr_match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if arr_match:
            try:
                return json.loads(arr_match.group())
            except Exception:
                pass
        lines = [l.strip().lstrip("•-*0123456789. ") for l in raw.split("\n") if len(l.strip()) > 30]
        return lines[:10]
