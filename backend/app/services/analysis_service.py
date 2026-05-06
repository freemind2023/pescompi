import asyncio
from typing import Tuple, Optional
from datetime import datetime, timedelta

from app.config import settings
from app.models.schemas import BrandData, FullAnalysisResponse, AnalysisRequest, DateRange
from app.scrapers.meta_ads import MetaAdsScraper
from app.scrapers.instagram import InstagramScraper
from app.scrapers.youtube import YouTubeScraper
from app.scrapers.linkedin import LinkedInScraper
from app.scrapers.website import WebsiteScraper
from app.agents.ads_intelligence import AdsIntelligenceAgent
from app.agents.social_media import SocialMediaAgent
from app.agents.strategy import StrategyAgent
from app.services.cache_service import cache


class AnalysisOrchestrator:
    def __init__(self):
        self.ads_scraper = MetaAdsScraper()
        self.ig_scraper = InstagramScraper()
        self.yt_scraper = YouTubeScraper()
        self.li_scraper = LinkedInScraper()
        self.web_scraper = WebsiteScraper()

        self.ads_agent = AdsIntelligenceAgent()
        self.social_agent = SocialMediaAgent()
        self.strategy_agent = StrategyAgent()

    async def run_full_analysis(
        self,
        request: AnalysisRequest,
        session_id: str,
    ) -> FullAnalysisResponse:
        # Check cache first
        if not request.force_refresh:
            cached = await cache.get_analysis(session_id)
            if cached:
                return FullAnalysisResponse(**cached)

        # Scrape both brands concurrently
        pes_data, nilaya_data = await asyncio.gather(
            self._scrape_brand(
                name=settings.PES_NAME,
                website=settings.PES_WEBSITE,
                instagram=settings.PES_INSTAGRAM,
                youtube=settings.PES_YOUTUBE,
                linkedin=settings.PES_LINKEDIN,
                ads_page_id=settings.PES_ADS_PAGE_ID,
            ),
            self._scrape_brand(
                name=settings.NILAYA_NAME,
                website=settings.NILAYA_WEBSITE,
                instagram=settings.NILAYA_INSTAGRAM,
                youtube=settings.NILAYA_YOUTUBE,
                linkedin=settings.NILAYA_LINKEDIN,
                ads_page_id=settings.NILAYA_ADS_PAGE_ID,
            ),
        )

        # Run AI analysis concurrently where possible
        ads_analysis, social_analysis = await asyncio.gather(
            self.ads_agent.analyze(pes_data.ads, nilaya_data.ads),
            self.social_agent.analyze(pes_data.social, nilaya_data.social),
        )

        ai_analysis = await self.strategy_agent.generate_full_analysis(
            pes_data=pes_data,
            nilaya_data=nilaya_data,
            ads_analysis=ads_analysis,
            social_analysis=social_analysis,
        )

        response = FullAnalysisResponse(
            session_id=session_id,
            date_range=request.date_range.value,
            pes_data=pes_data,
            nilaya_data=nilaya_data,
            ai_analysis=ai_analysis,
        )

        await cache.set_analysis(session_id, response)
        return response

    async def _scrape_brand(
        self,
        name: str,
        website: str,
        instagram: str,
        youtube: str,
        linkedin: str,
        ads_page_id: str,
    ) -> BrandData:
        # Run all scrapers concurrently per brand
        results = await asyncio.gather(
            self.ads_scraper.scrape_ads_library(ads_page_id, name),
            self.web_scraper.scrape(website, name),
            self.ig_scraper.scrape_profile(instagram, name),
            self.yt_scraper.scrape_channel(youtube, name),
            self.li_scraper.scrape_company(linkedin, name),
            return_exceptions=True,
        )

        ads = results[0] if not isinstance(results[0], Exception) else []
        website_data = results[1] if not isinstance(results[1], Exception) else None
        ig_metrics = results[2] if not isinstance(results[2], Exception) else None
        yt_metrics = results[3] if not isinstance(results[3], Exception) else None
        li_metrics = results[4] if not isinstance(results[4], Exception) else None

        from app.models.schemas import WebsiteData, SocialMetrics
        social = []
        if ig_metrics:
            social.append(ig_metrics)
        if yt_metrics:
            social.append(yt_metrics)
        if li_metrics:
            social.append(li_metrics)

        return BrandData(
            name=name,
            website=website_data or WebsiteData(url=website),
            ads=ads or [],
            social=social,
            active_ad_count=len(ads) if ads else 0,
        )

    async def cleanup(self):
        await asyncio.gather(
            self.ads_scraper.close(),
            self.ig_scraper.close(),
            self.yt_scraper.close(),
            self.li_scraper.close(),
            self.web_scraper.close(),
        )


orchestrator = AnalysisOrchestrator()
