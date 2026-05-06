import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const session = await getSession(auth.sessionId);
  if (!session?.analysis) {
    return NextResponse.json({ detail: 'No analysis found' }, { status: 404 });
  }
  return NextResponse.json(session.analysis);
}
