import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession, updateSession } from '@/lib/session';
import { analyzeWithClaude, parseJsonFromClaude } from '@/lib/claude';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const session = await getSession(auth.sessionId);
  const analysis = session?.analysis as Record<string, unknown> | undefined;

  const prompt = `Based on this competitor intelligence, generate 5 specific AI alerts for Practical EduSkills founder.

Data: PES active ads: ${(analysis?.pes_data as Record<string, number>)?.active_ad_count || 0}, Nilaya active ads: ${(analysis?.nilaya_data as Record<string, number>)?.active_ad_count || 0}

Return JSON array: [{"severity":"critical|warning|info","title":"...","description":"...","brand":"PES|Nilaya","platform":"facebook|instagram|website|youtube","action_required":"..."}]`;

  const raw = await analyzeWithClaude(prompt);
  const match = raw.match(/\[[\s\S]*?\]/);
  let alerts: unknown[] = [];
  if (match) {
    try { alerts = JSON.parse(match[0]); } catch {}
  }

  const stamped = (alerts as Record<string, string>[]).map((a) => ({
    ...a,
    id: randomUUID().slice(0, 8),
    detected_at: new Date().toISOString(),
  }));

  await updateSession(auth.sessionId, { alerts: stamped });
  return NextResponse.json({ alerts: stamped, count: stamped.length });
}
