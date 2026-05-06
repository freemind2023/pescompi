import asyncio
import re
import time
from typing import List, Dict, Any, Optional
from app.scrapers.base import BaseScraper
from app.models.schemas import WebsiteData
from duckduckgo_search import DDGS


CTA_KEYWORDS = [
    "enroll now", "apply now", "join now", "register", "get started",
    "book free demo", "free demo", "free counselling", "download brochure",
    "whatsapp us", "call now", "know more", "view courses", "start learning",
]

PLACEMENT_PATTERNS = [
    r"([\d,]+\+?)\s*(?:students?\s*)?placed",
    r"placement\s+(?:rate\s+of\s+)?(\d+%)",
    r"(\d+\+?)\s*hiring\s+partners",
    r"avg(?:erage)?\s+(?:salary|package|ctc)\s+of\s+([\d.]+\s*(?:lpa|lakh|l))",
    r"(\d+%)\s+placement(?:\s+rate)?",
]

TRUST_KEYWORDS = [
    "google review", "rating", "student review", "testimonial",
    "certified", "iso", "partnered with", "collaborated with",
    "featured in", "media mention",
]


class WebsiteScraper(BaseScraper):
    async def scrape(self, url: str, brand_name: str) -> WebsiteData:
        start = time.time()
        html = await self.get_page_with_scroll(url, scroll_count=4, timeout=35000)
        load_time = int((time.time() - start) * 1000)

        if not html:
            html = await self.fetch_with_httpx(url)

        if not html:
            return WebsiteData(url=url, load_time_ms=load_time)

        soup = self.parse_html(html)
        return WebsiteData(
            url=url,
            title=self._get_title(soup),
            meta_description=self._get_meta_desc(soup),
            cta_buttons=self._extract_ctas(soup),
            courses=self._extract_courses(soup),
            pricing=self._extract_pricing(soup),
            testimonials_count=self._count_testimonials(soup),
            hero_copy=self._get_hero_copy(soup),
            placement_claims=self._extract_placement_claims(soup),
            trust_signals=self._extract_trust_signals(soup),
            load_time_ms=load_time,
        )

    def _get_title(self, soup) -> Optional[str]:
        tag = soup.find("title")
        return tag.get_text(strip=True)[:200] if tag else None

    def _get_meta_desc(self, soup) -> Optional[str]:
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            return meta.get("content", "")[:300]
        og = soup.find("meta", attrs={"property": "og:description"})
        return og.get("content", "")[:300] if og else None

    def _extract_ctas(self, soup) -> List[str]:
        ctas = []
        seen = set()

        for tag in soup.find_all(["a", "button"]):
            text = tag.get_text(strip=True).lower()
            if any(kw in text for kw in CTA_KEYWORDS) and text not in seen and len(text) > 2:
                ctas.append(tag.get_text(strip=True)[:100])
                seen.add(text)
            if len(ctas) >= 10:
                break
        return ctas

    def _extract_courses(self, soup) -> List[Dict]:
        courses = []
        seen = set()

        selectors = [
            "h2", "h3", "[class*='course']", "[class*='program']",
            "[class*='batch']", "[class*='training']",
        ]
        for sel in selectors:
            for el in soup.select(sel):
                text = el.get_text(strip=True)
                if 10 < len(text) < 150 and text not in seen:
                    lower = text.lower()
                    if any(kw in lower for kw in ["course", "program", "training", "certification", "bootcamp", "diploma"]):
                        courses.append({"name": text, "source": el.name})
                        seen.add(text)
                if len(courses) >= 15:
                    break
            if len(courses) >= 15:
                break
        return courses

    def _extract_pricing(self, soup) -> List[Dict]:
        pricing = []
        full_text = soup.get_text()
        patterns = [
            r"₹\s*([\d,]+(?:\.\d+)?)\s*(?:/?\s*(?:month|year|course|batch))?",
            r"Rs\.?\s*([\d,]+(?:\.\d+)?)\s*(?:/?\s*(?:month|year|course))?",
            r"INR\s*([\d,]+(?:\.\d+)?)",
        ]
        seen = set()
        for pattern in patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for m in matches:
                clean = m.replace(",", "")
                if clean not in seen and 1000 <= float(clean) <= 500000:
                    pricing.append({"amount": clean, "currency": "INR"})
                    seen.add(clean)
                if len(pricing) >= 5:
                    break
        return pricing

    def _count_testimonials(self, soup) -> int:
        count = 0
        selectors = [
            "[class*='testimonial']", "[class*='review']",
            "[class*='student']", "blockquote",
        ]
        for sel in selectors:
            count += len(soup.select(sel))
        return min(count, 100)

    def _get_hero_copy(self, soup) -> Optional[str]:
        for tag in ["h1", "h2"]:
            el = soup.find(tag)
            if el:
                text = el.get_text(strip=True)
                if len(text) > 15:
                    return text[:300]
        return None

    def _extract_placement_claims(self, soup) -> List[str]:
        full_text = soup.get_text(separator=" ")
        claims = []
        for pattern in PLACEMENT_PATTERNS:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for m in matches:
                if isinstance(m, tuple):
                    claims.append(" ".join(m))
                else:
                    claims.append(m)
        return list(set(claims))[:10]

    def _extract_trust_signals(self, soup) -> List[str]:
        full_text = soup.get_text(separator=" ").lower()
        found = []
        for kw in TRUST_KEYWORDS:
            if kw in full_text:
                found.append(kw.title())
        return found
