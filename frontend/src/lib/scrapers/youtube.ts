export async function scrapeYouTube(channelUrl: string) {
  try {
    const res = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return fallback(channelUrl);
    const html = await res.text();

    const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/);
    const subText = subMatch?.[1] || '';
    const followers = parseCount(subText);

    const videoMatch = html.match(/"videoCountText":\{"runs":\[\{"text":"([\d,]+)"\}/);
    const posts_count = videoMatch ? parseInt(videoMatch[1].replace(/,/g, ''), 10) : undefined;

    const titleMatches = [...html.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"\}/g)];
    const viewMatches = [...html.matchAll(/"viewCountText":\{"simpleText":"([^"]+)"\}/g)];
    const recent_posts = titleMatches.slice(0, 6).map((m, i) => ({
      title: m[1],
      views: viewMatches[i]?.[1] || 'N/A',
    }));

    return { platform: 'youtube', followers, posts_count, recent_posts, engagement_rate: undefined };
  } catch {
    return fallback(channelUrl);
  }
}

async function fallback(channelUrl: string) {
  let followers: number | undefined;
  try {
    const query = encodeURIComponent(`${channelUrl} subscribers YouTube`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const text = await res.text();
      const m = text.match(/([\d.]+)\s*[Kk]\s*[Ss]ubscribers/);
      if (m) followers = Math.round(parseFloat(m[1]) * 1000);
    }
  } catch {}
  return { platform: 'youtube', followers, posts_count: undefined, recent_posts: [], engagement_rate: undefined };
}

function parseCount(raw: string): number | undefined {
  const m = raw.match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  const suffix = m[2].toUpperCase();
  if (suffix === 'B') return Math.round(n * 1e9);
  if (suffix === 'M') return Math.round(n * 1e6);
  if (suffix === 'K') return Math.round(n * 1e3);
  return Math.round(n);
}
