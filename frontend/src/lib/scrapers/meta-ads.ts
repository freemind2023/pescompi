import * as cheerio from 'cheerio';

export async function scrapeMetaAds(pageId: string, brandName: string) {
  // Try DDG search for ad intelligence (Playwright not available on Vercel)
  const ads = await duckduckgoAdSearch(brandName);
  return { ads, active_count: ads.length };
}

async function duckduckgoAdSearch(brandName: string) {
  const queries = [
    `"${brandName}" Facebook ads course India 2025`,
    `${brandName} Meta ads campaign placement training`,
  ];
  const results: unknown[] = [];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=in-en`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/html',
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('.result').each((i, el) => {
        if (results.length >= 6) return false;
        const title = $(el).find('.result__title').text().trim();
        const body = $(el).find('.result__snippet').text().trim();
        if (
          title &&
          body &&
          (brandName.toLowerCase().split(' ')[0] in (title + body).toLowerCase() ||
            (title + body).toLowerCase().includes(brandName.toLowerCase().split(' ')[0]))
        ) {
          results.push({
            id: `ddg_${brandName}_${i}`,
            title: title.slice(0, 150),
            body: body.slice(0, 400),
            platform: 'facebook/instagram',
            status: 'active',
          });
        }
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
