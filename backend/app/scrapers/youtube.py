import re
from typing import Dict, Any, List, Optional
from app.scrapers.base import BaseScraper
from app.models.schemas import SocialMetrics
from duckduckgo_search import DDGS


class YouTubeScraper(BaseScraper):
    async def scrape_channel(self, channel_url: str, brand_name: str) -> SocialMetrics:
        html = await self.get_page_with_scroll(channel_url, scroll_count=3, timeout=35000)
        metrics = SocialMetrics(platform="youtube")

        if html:
            soup = self.parse_html(html)
            metrics = self._parse_youtube_data(soup, brand_name)

        if not metrics.followers and not metrics.posts_count:
            metrics = await self._fallback_duckduckgo(channel_url, brand_name)

        return metrics

    def _parse_youtube_data(self, soup, brand_name: str) -> SocialMetrics:
        metrics = SocialMetrics(platform="youtube")
        full_text = soup.get_text()

        # Subscriber count patterns
        sub_patterns = [
            r"([\d.]+[KMB]?)\s*subscribers?",
            r"([\d,]+)\s*subscribers?",
        ]
        for pattern in sub_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                metrics.followers = self._parse_count(match.group(1))
                break

        # Video count
        vid_pattern = re.search(r"([\d,]+)\s*(?:videos?|uploads?)", full_text, re.IGNORECASE)
        if vid_pattern:
            metrics.posts_count = int(vid_pattern.group(1).replace(",", ""))

        # Recent videos from scripts
        for script in soup.find_all("script"):
            text = script.string or ""
            if "videoRenderer" in text or "compactVideoRenderer" in text:
                titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"\}', text)
                view_counts = re.findall(r'"viewCountText":\{"simpleText":"([^"]+)"\}', text)
                recent_posts = []
                for i, title in enumerate(titles[:6]):
                    post = {"title": title}
                    if i < len(view_counts):
                        post["views"] = view_counts[i]
                    recent_posts.append(post)
                if recent_posts:
                    metrics.recent_posts = recent_posts
                break

        return metrics

    async def _fallback_duckduckgo(self, channel_url: str, brand_name: str) -> SocialMetrics:
        metrics = SocialMetrics(platform="youtube")
        try:
            with DDGS() as ddgs:
                results = list(
                    ddgs.text(
                        f"{brand_name} YouTube channel subscribers India edtech",
                        region="in-en",
                        max_results=5,
                    )
                )
                combined = " ".join(r.get("body", "") + r.get("title", "") for r in results)
                sub_match = re.search(r"([\d,]+\.?\d*)\s*[Kk]\s*[Ss]ubscribers", combined)
                if sub_match:
                    val = float(sub_match.group(1).replace(",", "")) * 1000
                    metrics.followers = int(val)
                plain_sub = re.search(r"([\d,]+)\s+[Ss]ubscribers", combined)
                if plain_sub and not metrics.followers:
                    metrics.followers = int(plain_sub.group(1).replace(",", ""))
        except Exception:
            pass
        return metrics

    def _parse_count(self, raw: str) -> Optional[int]:
        raw = raw.strip().upper().replace(",", "")
        try:
            if "B" in raw:
                return int(float(raw.replace("B", "")) * 1_000_000_000)
            elif "M" in raw:
                return int(float(raw.replace("M", "")) * 1_000_000)
            elif "K" in raw:
                return int(float(raw.replace("K", "")) * 1_000)
            return int(raw)
        except (ValueError, TypeError):
            return None
