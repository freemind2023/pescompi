import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession, updateSession } from '@/lib/session';
import { runFullAnalysis } from '@/lib/analysis-orchestrator';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { date_range = 'today', force_refresh = false } = await req.json().catch(() => ({}));

  // Return cached if available and not forcing refresh
  if (!force_refresh) {
    const session = await getSession(auth.sessionId);
    if (session?.analysis) {
      return NextResponse.json({ ...session.analysis, session_id: auth.sessionId });
    }
  }

  try {
    const result = await runFullAnalysis(date_range);
    const fullResult = { ...result, session_id: auth.sessionId };
    await updateSession(auth.sessionId, { analysis: fullResult as Record<string, unknown> });
    return NextResponse.json(fullResult);
  } catch (e) {
    return NextResponse.json({ detail: `Analysis failed: ${String(e)}` }, { status: 500 });
  }
}
