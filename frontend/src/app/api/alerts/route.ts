import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const severity = searchParams.get('severity');
  const session = await getSession(auth.sessionId);

  let alerts = (session?.analysis as Record<string, Record<string, unknown[]>>)?.ai_analysis?.alerts || session?.alerts || [];
  if (severity) alerts = (alerts as Record<string, string>[]).filter((a) => a.severity === severity);

  return NextResponse.json(alerts);
}
