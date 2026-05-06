import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { updateSession } from '@/lib/session';

export async function DELETE(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  await updateSession(auth.sessionId, { messages: [] });
  return NextResponse.json({ message: 'Chat cleared' });
}
