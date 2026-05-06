import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';
import { analyzeWithClaude } from '@/lib/claude';

export const maxDuration = 30;

const TOPICS: Record<string, string> = {
  why_ahead: 'In 3 sharp bullet points, explain exactly why Nilaya Education is ahead of PES right now. Be brutally honest and specific.',
  top_opportunities: 'List the top 5 untapped opportunities PES should exploit this month. Be specific, not generic.',
  counter_campaign: 'Design a specific counter-campaign for PES to respond to Nilaya\'s current ad strategy. Include actual ad copy.',
  quick_wins: 'What are 3 things PES can do TODAY to improve competitive position? Be very specific and actionable.',
};

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic') || '';
  if (!TOPICS[topic]) return NextResponse.json({ detail: 'Invalid topic' }, { status: 400 });

  const session = await getSession(auth.sessionId);
  const context = session?.analysis
    ? { summary: (session.analysis as Record<string, Record<string, string>>).ai_analysis?.summary }
    : undefined;

  const insight = await analyzeWithClaude(TOPICS[topic], context);
  return NextResponse.json({ topic, insight });
}
