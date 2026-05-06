import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'fallback-secret-change-me');

export async function verifyToken(req: NextRequest): Promise<{ sessionId: string } | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { sessionId: payload.session_id as string };
  } catch {
    return null;
  }
}
