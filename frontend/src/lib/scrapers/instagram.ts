export async function scrapeInstagram(profileUrl: string) {
  const username = profileUrl.replace(/\/$/, '').split('/').pop()?.replace('@', '').split('?')[0] || '';

  // Instagram semi-public API
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
          Referer: `https://www.instagram.com/${username}/`,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (res.ok) {
      const json = await res.json();
      const user = json?.data?.user;
      if (user) return buildMetrics(user);
    }
  } catch {}

  // DDG fallback
  return duckduckgoFallback(username);
}

function buildMetrics(user: Record<string, unknown>) {
  const edgeMedia = (user.edge_owner_to_timeline_media as Record<string, unknown>) || {};
  const edges = (edgeMedia.edges as unknown[]) || [];

  const recentPosts = edges.slice(0, 6).map((e: unknown) => {
    const node = (e as Record<string, Record<string, unknown>>).node || {};
    const captions = (node.edge_media_to_caption as Record<string, unknown[]>)?.edges || [];
    const caption = (captions[0] as Record<string, Record<string, string>>)?.node?.text || '';
    return {
      likes: (node.edge_media_preview_like as Record<string, number>)?.count || 0,
      comments: (node.edge_media_to_comment as Record<string, number>)?.count || 0,
      caption: caption.slice(0, 200),
    };
  });

  const followers = (user.edge_followed_by as Record<string, number>)?.count || 0;
  const following = (user.edge_follow as Record<string, number>)?.count || 0;
  const posts_count = (edgeMedia.count as number) || 0;

  let engagement_rate = 0;
  if (recentPosts.length && followers) {
    const avgLikes = recentPosts.reduce((s, p) => s + p.likes, 0) / recentPosts.length;
    const avgComments = recentPosts.reduce((s, p) => s + p.comments, 0) / recentPosts.length;
    engagement_rate = parseFloat(((avgLikes + avgComments) / followers * 100).toFixed(2));
  }

  return {
    platform: 'instagram',
    followers,
    following,
    posts_count,
    recent_posts: recentPosts,
    engagement_rate,
    posting_frequency: estimateFrequency(recentPosts.length),
  };
}

async function duckduckgoFallback(username: string) {
  let followers: number | undefined;
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${username} instagram followers India`)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (res.ok) {
      const text = await res.text();
      const m = text.match(/([\d.]+)\s*[Kk]\s*[Ff]ollowers/);
      if (m) followers = Math.round(parseFloat(m[1]) * 1000);
    }
  } catch {}
  return { platform: 'instagram', followers, following: undefined, posts_count: undefined, recent_posts: [], engagement_rate: undefined };
}

function estimateFrequency(postCount: number): string {
  if (postCount >= 6) return '2-3x per week';
  if (postCount >= 3) return 'Weekly';
  return 'Unknown';
}
