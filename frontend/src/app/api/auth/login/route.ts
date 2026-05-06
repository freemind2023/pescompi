import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createSession } from '@/lib/session';

export const maxDuration = 30;

const SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'fallback-secret-change-me');

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || password !== process.env.FOUNDER_PASSWORD) {
      return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
    }

    const sessionId = await createSession();
    const token = await new SignJWT({ sub: 'founder', session_id: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET);

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 28800,
      session_id: sessionId,
    });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
