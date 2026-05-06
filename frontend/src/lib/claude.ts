import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-opus-4-5-20251101';
const MAX_TOKENS = 8096;

const SYSTEM_PROMPT = `You are Jarvis — razor-sharp competitive intelligence strategist and AI business consultant for Practical EduSkills (PES), an EdTech company in Pune, India.

Your role: Founder's strategic war room advisor.
Competitor being tracked: Nilaya Education.
Your goal: Help PES dominate the Indian EdTech market.

Speak with conviction. Give specific, data-backed, action-oriented answers. No fluff.`;

export async function analyzeWithClaude(
  prompt: string,
  context?: Record<string, unknown>,
  systemOverride?: string,
): Promise<string> {
  const system = systemOverride || SYSTEM_PROMPT;
  let userContent = prompt;
  if (context && Object.keys(context).length > 0) {
    userContent = `<context>\n${JSON.stringify(context, null, 2)}\n</context>\n\n${prompt}`;
  }
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  return (message.content[0] as { text: string }).text;
}

export async function* streamWithClaude(
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  context?: Record<string, unknown>,
): AsyncGenerator<string> {
  let userContent = prompt;
  if (context && Object.keys(context).length > 0) {
    userContent = `<analysis_context>\n${JSON.stringify(context, null, 2).slice(0, 3000)}\n</analysis_context>\n\n${prompt}`;
  }
  const messages = [...history, { role: 'user' as const, content: userContent }];

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}

export function parseJsonFromClaude(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return { raw };
}

export function parseArrayFromClaude(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return raw
    .split('\n')
    .map((l) => l.replace(/^[\s\-•*\d.]+/, '').trim())
    .filter((l) => l.length > 20)
    .slice(0, 10);
}
