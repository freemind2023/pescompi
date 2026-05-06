import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  const session = await getSession(auth.sessionId);
  const alerts = ((session?.analysis as Record<string, Record<string, unknown[]>>)?.ai_analysis?.alerts || []) as Record<string, string>[];
  return NextResponse.json({
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  });
}
