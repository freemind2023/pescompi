import * as cheerio from 'cheerio';

const CTA_KEYWORDS = [
  'enroll now', 'apply now', 'join now', 'register', 'get started',
  'book free demo', 'free demo', 'free counselling', 'download brochure',
  'whatsapp us', 'call now', 'know more', 'view courses', 'start learning',
];
const PLACEMENT_PATTERNS = [
  /(\d[\d,]+\+?)\s*(?:students?)?\s*placed/gi,
  /placement\s+(?:rate\s+of\s+)?(\d+%)/gi,
  /(\d+\+?)\s*hiring\s+partners/gi,
  /avg(?:erage)?\s+(?:salary|package)\s+of\s+([\d.]+\s*(?:lpa|lakh|l))/gi,
];

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return res.text();
  } catch {}
  return null;
}

export async function scrapeWebsite(url: string) {
  const start = Date.now();
  const html = await fetchHtml(url);
  const loadTime = Date.now() - start;

  if (!html) return { url, load_time_ms: loadTime, cta_buttons: [], courses: [], pricing: [], placement_claims: [], trust_signals: [], testimonials_count: 0 };

  const $ = cheerio.load(html);
  $('script, style, noscript').remove();

  const title = $('title').text().trim().slice(0, 200) || undefined;
  const metaDesc = ($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '').slice(0, 300) || undefined;
  const heroCopy = ($('h1').first().text().trim() || $('h2').first().text().trim()).slice(0, 300) || undefined;

  const ctaButtons: string[] = [];
  const seenCtas = new Set<string>();
  $('a, button').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (CTA_KEYWORDS.some((k) => text.includes(k)) && !seenCtas.has(text) && text.length > 2) {
      ctaButtons.push($(el).text().trim().slice(0, 80));
      seenCtas.add(text);
    }
  });

  const courses: { name: string }[] = [];
  const seenCourses = new Set<string>();
  $('h2, h3, [class*="course"], [class*="program"], [class*="training"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 150 && !seenCourses.has(text)) {
      const lower = text.toLowerCase();
      if (['course', 'program', 'training', 'certif', 'bootcamp', 'diploma', 'mba', 'bba'].some((k) => lower.includes(k))) {
        courses.push({ name: text });
        seenCourses.add(text);
      }
    }
  });

  const fullText = $.root().text();
  const pricing: { amount: string }[] = [];
  const priceMatches = fullText.match(/₹\s*[\d,]+/g) || [];
  const seenPrices = new Set<string>();
  for (const p of priceMatches) {
    const clean = p.replace(/₹\s*/, '').replace(',', '');
    if (!seenPrices.has(clean) && Number(clean) >= 1000 && Number(clean) <= 500000) {
      pricing.push({ amount: clean });
      seenPrices.add(clean);
    }
  }

  const placementClaims: string[] = [];
  for (const pattern of PLACEMENT_PATTERNS) {
    const matches = [...fullText.matchAll(pattern)];
    for (const m of matches) placementClaims.push(m[0].slice(0, 80));
  }

  const testimonials_count = $('[class*="testimonial"], [class*="review"], blockquote').length;

  const trustKeywords = ['google review', 'rating', 'iso', 'certified', 'partnered with', 'featured in'];
  const trust_signals = trustKeywords.filter((k) => fullText.toLowerCase().includes(k)).map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()));

  return {
    url,
    title,
    meta_description: metaDesc,
    hero_copy: heroCopy,
    cta_buttons: ctaButtons.slice(0, 8),
    courses: courses.slice(0, 15),
    pricing: pricing.slice(0, 5),
    placement_claims: [...new Set(placementClaims)].slice(0, 8),
    trust_signals,
    testimonials_count,
    load_time_ms: loadTime,
  };
}
