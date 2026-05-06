import asyncio
import random
import time
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
import httpx
from bs4 import BeautifulSoup


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
]


class BaseScraper:
    def __init__(self):
        self._browser: Optional[Browser] = None
        self._playwright = None

    async def _get_browser(self) -> Browser:
        if not self._browser or not self._browser.is_connected():
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu",
                ],
            )
        return self._browser

    async def _new_context(self) -> BrowserContext:
        browser = await self._get_browser()
        return await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1366, "height": 768},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            extra_http_headers={
                "Accept-Language": "en-IN,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
        )

    async def get_page_html(self, url: str, wait_for: Optional[str] = None, timeout: int = 30000) -> Optional[str]:
        context = None
        try:
            context = await self._new_context()
            page: Page = await context.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            if wait_for:
                await page.wait_for_selector(wait_for, timeout=15000)
            await asyncio.sleep(random.uniform(1.5, 3.0))
            return await page.content()
        except Exception:
            return None
        finally:
            if context:
                await context.close()

    async def get_page_with_scroll(self, url: str, scroll_count: int = 3, timeout: int = 30000) -> Optional[str]:
        context = None
        try:
            context = await self._new_context()
            page: Page = await context.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            await asyncio.sleep(2)
            for _ in range(scroll_count):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await asyncio.sleep(random.uniform(0.8, 1.5))
            return await page.content()
        except Exception:
            return None
        finally:
            if context:
                await context.close()

    async def fetch_with_httpx(self, url: str) -> Optional[str]:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9",
        }
        try:
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.text
        except Exception:
            pass
        return None

    def parse_html(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "lxml")

    async def close(self):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()
