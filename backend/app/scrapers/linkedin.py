import re
from typing import Dict, Any, List, Optional
from app.scrapers.base import BaseScraper
from app.models.schemas import SocialMetrics
from duckduckgo_search import DDGS


class LinkedInScraper(BaseScraper):
    async def scrape_company(self, url: str, brand_name: str) -> SocialMetrics:
        # LinkedIn blocks most automated access — DuckDuckGo is primary source
        metrics = await self._duckduckgo_scrape(url, brand_name)
        if not metrics.followers:
            # Try direct scrape as fallback (often gets blocked)
            html = await self.get_page_html(url, timeout=25000)
            if html:
                parsed = self._parse_linkedin_html(html)
                if parsed.followers:
                    return parsed
        return metrics

    def _parse_linkedin_html(self, html: str) -> SocialMetrics:
        soup = self.parse_html(html)
        metrics = SocialMetrics(platform="linkedin")
        full_text = soup.get_text()

        follower_match = re.search(r"([\d,]+(?:\.\d+)?[KMk]?)\s*followers?", full_text, re.IGNORECASE)
        if follower_match:
            raw = follower_match.group(1).replace(",", "").upper()
            metrics.followers = self._parse_count(raw)

        employee_match = re.search(r"([\d,-]+)\s*employees?", full_text, re.IGNORECASE)
        if employee_match:
            metrics.following = None  # use as proxy field

        # Recent posts
        post_elements = soup.select("[data-urn*='activity']") or soup.select(".feed-shared-update-v2")
        recent_posts = []
        for el in post_elements[:5]:
            text = el.get_text(strip=True)[:200]
            if text:
                recent_posts.append({"content": text})
        metrics.recent_posts = recent_posts

        return metrics

    async def _duckduckgo_scrape(self, url: str, brand_name: str) -> SocialMetrics:
        metrics = SocialMetrics(platform="linkedin")
        queries = [
            f"site:linkedin.com {brand_name} company followers India",
            f"{brand_name} LinkedIn followers employees India edtech",
        ]
        try:
            with DDGS() as ddgs:
                for query in queries[:2]:
                    results = list(ddgs.text(query, region="in-en", max_results=5))
                    combined = " ".join(r.get("body", "") + r.get("title", "") for r in results)

                    k_match = re.search(r"([\d,]+\.?\d*)\s*[Kk]\s*[Ff]ollowers?", combined)
                    if k_match:
                        val = float(k_match.group(1).replace(",", "")) * 1000
                        metrics.followers = int(val)
                        break
                    plain_match = re.search(r"([\d,]+)\s*[Ff]ollowers?", combined)
                    if plain_match:
                        metrics.followers = int(plain_match.group(1).replace(",", ""))
                        break
        except Exception:
            pass
        return metrics

    def _parse_count(self, raw: str) -> Optional[int]:
        try:
            if "M" in raw:
                return int(float(raw.replace("M", "")) * 1_000_000)
            elif "K" in raw:
                return int(float(raw.replace("K", "")) * 1_000)
            return int(raw.replace(",", ""))
        except (ValueError, TypeError):
            return None
