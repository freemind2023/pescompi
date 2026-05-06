import anthropic
from typing import AsyncIterator, List, Dict, Any, Optional
from app.config import settings


client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


SYSTEM_PROMPT = """You are Jarvis, a razor-sharp competitive intelligence strategist and AI business consultant for Practical EduSkills (PES) — an edtech company in Pune, India.

Your role is to be the founder's strategic war room advisor. You have deep expertise in:
- EdTech market dynamics in India
- Meta/Facebook advertising psychology
- Social media growth strategies
- Funnel optimization
- Student psychology and enrollment triggers
- Brand positioning in the education sector
- Content marketing for skill-based courses

You always:
- Speak with conviction and strategic clarity
- Give specific, actionable recommendations
- Back analysis with data from the scraped context
- Think like a founder who wants to WIN
- Use military/war room metaphors when appropriate
- Prioritize high-impact moves

Context about the brands:
- Practical EduSkills (PES): The company you work FOR. Goal is to help PES dominate.
- Nilaya Education: The primary competitor being analyzed.

ALWAYS stay strategic, specific, and action-oriented. Never give generic advice."""


async def analyze_with_claude(
    prompt: str,
    context_data: Optional[Dict[str, Any]] = None,
    system_override: Optional[str] = None,
) -> str:
    """Single-shot Claude analysis with context injection."""
    system = system_override or SYSTEM_PROMPT
    user_content = prompt
    if context_data:
        user_content = f"<context>\n{_format_context(context_data)}\n</context>\n\n{prompt}"

    message = await client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=settings.CLAUDE_MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user_content}],
    )
    return message.content[0].text


async def stream_with_claude(
    prompt: str,
    history: List[Dict[str, str]],
    context_data: Optional[Dict[str, Any]] = None,
) -> AsyncIterator[str]:
    """Streaming Claude response for Jarvis chat."""
    messages = list(history)
    user_content = prompt
    if context_data:
        user_content = f"<analysis_context>\n{_format_context(context_data)}\n</analysis_context>\n\n{prompt}"

    messages.append({"role": "user", "content": user_content})

    async with client.messages.stream(
        model=settings.CLAUDE_MODEL,
        max_tokens=settings.CLAUDE_MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def batch_analyze(prompts: List[Dict[str, str]]) -> List[str]:
    """Run multiple analysis prompts concurrently for efficiency."""
    import asyncio

    async def _run_one(item: Dict) -> str:
        return await analyze_with_claude(
            prompt=item["prompt"],
            context_data=item.get("context"),
            system_override=item.get("system"),
        )

    results = await asyncio.gather(*[_run_one(p) for p in prompts], return_exceptions=True)
    processed = []
    for r in results:
        if isinstance(r, Exception):
            processed.append(f"Analysis unavailable: {str(r)}")
        else:
            processed.append(r)
    return processed


def _format_context(data: Dict[str, Any]) -> str:
    lines = []
    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f"[{key}]")
            for k, v in value.items():
                lines.append(f"  {k}: {v}")
        elif isinstance(value, list):
            lines.append(f"[{key}]: {', '.join(str(i) for i in value[:10])}")
        else:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)
