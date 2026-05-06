import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession, addMessage } from '@/lib/session';
import { streamWithClaude } from '@/lib/claude';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const { message } = await req.json();
  if (!message) return new Response('No message', { status: 400 });

  const session = await getSession(auth.sessionId);
  if (!session) return new Response('Session not found', { status: 404 });

  const history = ((session.messages || []) as { role: string; content: string }[])
    .slice(-10)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const context = session.analysis
    ? {
        which_brand_ahead: (session.analysis as Record<string, Record<string, string>>).ai_analysis?.which_brand_ahead,
        summary: (session.analysis as Record<string, Record<string, string>>).ai_analysis?.summary,
        pes_ads: (session.analysis as Record<string, Record<string, number>>).pes_data?.active_ad_count,
        nilaya_ads: (session.analysis as Record<string, Record<string, number>>).nilaya_data?.active_ad_count,
      }
    : undefined;

  await addMessage(auth.sessionId, { role: 'user', content: message, timestamp: new Date().toISOString() });

  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamWithClaude(message, history, context)) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        await addMessage(auth.sessionId, { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
      } catch (e) {
        controller.enqueue(encoder.encode(`data: [ERROR] ${String(e)}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
