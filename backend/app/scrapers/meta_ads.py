import asyncio
import json
import re
from typing import List, Dict, Any, Optional
from app.scrapers.base import BaseScraper
from app.models.schemas import AdData
from duckduckgo_search import DDGS


META_ADS_API = "https://www.facebook.com/ads/library/api/?fields=id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_snapshot_url,currency,impressions,page_name,spend&active_status=active&ad_type=all&country=IN&search_type=page&view_all_page_id={page_id}&access_token={token}"


class MetaAdsScraper(BaseScraper):
    async def scrape_ads_library(self, page_id: str, brand_name: str) -> List[AdData]:
        url = (
            f"https://www.facebook.com/ads/library/?active_status=active"
            f"&ad_type=all&country=IN&is_targeted_country=false"
            f"&media_type=all&search_type=page"
            f"&sort_data[direction]=desc&sort_data[mode]=total_impressions"
            f"&view_all_page_id={page_id}"
        )
        html = await self.get_page_with_scroll(url, scroll_count=5, timeout=45000)
        ads = []
        if html:
            ads = self._parse_ads_from_html(html, brand_name)

        if not ads:
            ads = await self._fallback_duckduckgo(brand_name, page_id)

        return ads

    def _parse_ads_from_html(self, html: str, brand_name: str) -> List[AdData]:
        soup = self.parse_html(html)
        ads = []

        # Meta Ads Library renders with React — look for JSON blobs in script tags
        for script in soup.find_all("script"):
            text = script.string or ""
            if "ad_archive_id" in text or "ad_creative" in text:
                try:
                    # Extract JSON embedded in script
                    match = re.search(r'"ads_data"\s*:\s*(\[.*?\])', text, re.DOTALL)
                    if match:
                        raw = json.loads(match.group(1))
                        for item in raw[:20]:
                            ads.append(self._parse_ad_item(item, brand_name))
                except Exception:
                    pass

        # Fallback: parse visible DOM elements
        if not ads:
            ad_cards = soup.select('[data-testid="ad_library_preview"]') or soup.select(".x1yztbdb")
            for i, card in enumerate(ad_cards[:15]):
                body = card.get_text(separator=" ", strip=True)[:500]
                if body:
                    ads.append(
                        AdData(
                            id=f"{brand_name.lower().replace(' ', '_')}_ad_{i}",
                            body=body,
                            status="active",
                            platform="facebook/instagram",
                        )
                    )

        return ads

    def _parse_ad_item(self, item: Dict, brand_name: str) -> AdData:
        bodies = item.get("ad_creative_bodies", [])
        titles = item.get("ad_creative_link_titles", [])
        captions = item.get("ad_creative_link_captions", [])
        impressions = item.get("impressions", {})

        imp_range = None
        if isinstance(impressions, dict):
            lower = impressions.get("lower_bound", "")
            upper = impressions.get("upper_bound", "")
            if lower:
                imp_range = f"{lower} - {upper}" if upper else f"{lower}+"

        return AdData(
            id=str(item.get("id", f"{brand_name}_{id(item)}")),
            title=titles[0] if titles else None,
            body=bodies[0] if bodies else None,
            cta=captions[0] if captions else None,
            start_date=item.get("ad_delivery_start_time"),
            status="active",
            impressions_range=imp_range,
            platform="facebook/instagram",
            url=item.get("ad_snapshot_url"),
        )

    async def _fallback_duckduckgo(self, brand_name: str, page_id: str) -> List[AdData]:
        """Use DuckDuckGo to find ad information when direct scraping fails."""
        ads = []
        queries = [
            f"{brand_name} Facebook ads 2025 India",
            f'"{brand_name}" Meta ads campaign offers',
            f"{brand_name} online course Facebook advertisement",
        ]
        try:
            with DDGS() as ddgs:
                for query in queries[:2]:
                    results = list(ddgs.text(query, region="in-en", max_results=5))
                    for i, r in enumerate(results):
                        body = r.get("body", "")
                        title = r.get("title", "")
                        if brand_name.lower().split()[0] in (title + body).lower():
                            ads.append(
                                AdData(
                                    id=f"ddg_{brand_name.lower().replace(' ', '_')}_{i}",
                                    title=title[:200],
                                    body=body[:500],
                                    status="active",
                                    platform="web_search",
                                )
                            )
                    await asyncio.sleep(1)
        except Exception:
            pass
        return ads

    async def estimate_ad_spend_tier(self, ad_count: int) -> str:
        if ad_count == 0:
            return "Inactive"
        elif ad_count <= 3:
            return "Low (₹5k-20k/month)"
        elif ad_count <= 8:
            return "Medium (₹20k-80k/month)"
        elif ad_count <= 20:
            return "High (₹80k-3L/month)"
        return "Very High (₹3L+/month)"
