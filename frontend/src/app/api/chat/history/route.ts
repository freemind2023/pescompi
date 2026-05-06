import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  const session = await getSession(auth.sessionId);
  return NextResponse.json({ messages: session?.messages || [] });
}
