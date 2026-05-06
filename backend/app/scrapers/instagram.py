import asyncio
import re
import json
from typing import Dict, Any, List, Optional
from app.scrapers.base import BaseScraper
from app.models.schemas import SocialMetrics
from duckduckgo_search import DDGS


class InstagramScraper(BaseScraper):
    async def scrape_profile(self, username: str, brand_name: str) -> SocialMetrics:
        clean_username = username.rstrip("/").split("/")[-1].replace("@", "").split("?")[0]
        profile_url = f"https://www.instagram.com/{clean_username}/"

        # Try direct scrape via public API endpoint
        data = await self._try_public_api(clean_username)
        if data:
            return self._build_metrics(data, brand_name, profile_url)

        # Fallback: Playwright render
        data = await self._scrape_with_playwright(profile_url, clean_username, brand_name)
        if data:
            return data

        # Final fallback: DuckDuckGo
        return await self._fallback_duckduckgo(clean_username, brand_name, profile_url)

    async def _try_public_api(self, username: str) -> Optional[Dict]:
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
        headers = {
            "x-ig-app-id": "936619743392459",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": f"https://www.instagram.com/{username}/",
        }
        import httpx
        try:
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    raw = resp.json()
                    user = raw.get("data", {}).get("user", {})
                    if user:
                        return user
        except Exception:
            pass
        return None

    def _build_metrics(self, user: Dict, brand_name: str, url: str) -> SocialMetrics:
        edge_media = user.get("edge_owner_to_timeline_media", {})
        posts_count = edge_media.get("count", 0)
        recent_edges = edge_media.get("edges", [])

        recent_posts = []
        for edge in recent_edges[:6]:
            node = edge.get("node", {})
            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = caption_edges[0]["node"]["text"] if caption_edges else ""
            recent_posts.append({
                "type": node.get("__typename", "GraphImage"),
                "likes": node.get("edge_media_preview_like", {}).get("count", 0),
                "comments": node.get("edge_media_to_comment", {}).get("count", 0),
                "caption": caption[:200],
                "timestamp": node.get("taken_at_timestamp"),
            })

        followers = user.get("edge_followed_by", {}).get("count", 0)
        following = user.get("edge_follow", {}).get("count", 0)

        avg_engagement = 0
        if recent_posts and followers:
            avg_likes = sum(p.get("likes", 0) for p in recent_posts) / len(recent_posts)
            avg_comments = sum(p.get("comments", 0) for p in recent_posts) / len(recent_posts)
            avg_engagement = round((avg_likes + avg_comments) / followers * 100, 2)

        return SocialMetrics(
            platform="instagram",
            followers=followers,
            following=following,
            posts_count=posts_count,
            recent_posts=recent_posts,
            engagement_rate=avg_engagement,
            posting_frequency=self._estimate_frequency(recent_posts),
        )

    async def _scrape_with_playwright(self, url: str, username: str, brand_name: str) -> Optional[SocialMetrics]:
        html = await self.get_page_html(url, timeout=30000)
        if not html:
            return None
        soup = self.parse_html(html)
        metrics = SocialMetrics(platform="instagram")

        # Instagram embeds profile data in window.__additionalDataLoaded or _sharedData
        for script in soup.find_all("script"):
            text = script.string or ""
            if "edge_followed_by" in text:
                try:
                    follower_match = re.search(r'"edge_followed_by":\{"count":(\d+)\}', text)
                    if follower_match:
                        metrics.followers = int(follower_match.group(1))
                    following_match = re.search(r'"edge_follow":\{"count":(\d+)\}', text)
                    if following_match:
                        metrics.following = int(following_match.group(1))
                    posts_match = re.search(r'"edge_owner_to_timeline_media":\{"count":(\d+)', text)
                    if posts_match:
                        metrics.posts_count = int(posts_match.group(1))
                except Exception:
                    pass

        return metrics if metrics.followers else None

    async def _fallback_duckduckgo(self, username: str, brand_name: str, url: str) -> SocialMetrics:
        metrics = SocialMetrics(platform="instagram", posts_count=0)
        try:
            with DDGS() as ddgs:
                results = list(
                    ddgs.text(
                        f"site:instagram.com {username} followers posts India edtech",
                        region="in-en",
                        max_results=5,
                    )
                )
                combined = " ".join(r.get("body", "") + r.get("title", "") for r in results)
                k_match = re.search(r"([\d,]+\.?\d*)\s*[Kk]\s*[Ff]ollowers", combined)
                if k_match:
                    val = float(k_match.group(1).replace(",", "")) * 1000
                    metrics.followers = int(val)
                plain_match = re.search(r"([\d,]+)\s+[Ff]ollowers", combined)
                if plain_match and not metrics.followers:
                    metrics.followers = int(plain_match.group(1).replace(",", ""))
        except Exception:
            pass
        return metrics

    def _estimate_frequency(self, recent_posts: List[Dict]) -> str:
        if len(recent_posts) < 2:
            return "Unknown"
        timestamps = [p.get("timestamp") for p in recent_posts if p.get("timestamp")]
        if len(timestamps) < 2:
            return "Unknown"
        timestamps.sort(reverse=True)
        diffs = [(timestamps[i] - timestamps[i + 1]) / 86400 for i in range(len(timestamps) - 1)]
        avg_days = sum(diffs) / len(diffs) if diffs else 7
        if avg_days <= 1:
            return "Daily"
        elif avg_days <= 3:
            return "2-3x per week"
        elif avg_days <= 7:
            return "Weekly"
        elif avg_days <= 14:
            return "Bi-weekly"
        return "Monthly"
