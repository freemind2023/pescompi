import json
from typing import AsyncIterator, List, Dict, Any, Optional
from app.services.claude_service import stream_with_claude, analyze_with_claude
from app.services.cache_service import cache
from app.models.schemas import ChatMessage, ChatResponse
from datetime import datetime


JARVIS_SYSTEM = """You are Jarvis — the AI strategic war room advisor for Practical EduSkills (PES).

You are NOT a generic AI assistant. You are a razor-sharp competitive intelligence strategist who:
- Has deep knowledge of the Indian EdTech market
- Knows PES and Nilaya Education inside out from the analysis data
- Speaks like a confident strategic consultant, not a chatbot
- Gives specific, data-backed, action-oriented answers
- Uses direct language — no fluff, no "great question!", no filler
- When you don't have data, you say so and pivot to what CAN be done

Your personality:
- Direct, confident, strategic
- Military/war room metaphors when appropriate
- Always focused on PES winning market share
- Data-first, action-oriented
- Brief intro, deep content, clear next steps

Context available in each message: current analysis data, ad data, social data.

If asked to generate content (ads, reels, WhatsApp messages), generate it FULLY and SPECIFICALLY — not templates.

Key intel you know:
- PES website: practicaleduskills.com
- Competitor: Nilaya Education (nilayaeducation.org)
- Market: Indian EdTech, skill training, placement-focused courses
- Geography: Pune, India (but reaching nationally)"""


class JarvisAgent:
    async def chat(
        self,
        session_id: str,
        user_message: str,
    ) -> AsyncIterator[str]:
        session = await cache.get_session(session_id)
        if not session:
            yield "Session expired. Please run a new analysis first."
            return

        analysis = session.get("analysis")
        history = session.get("messages", [])

        # Build context from analysis
        context = self._build_context(analysis)

        # Format history for Claude (last 10 messages)
        claude_history = []
        for msg in history[-10:]:
            if msg["role"] in ("user", "assistant"):
                claude_history.append({"role": msg["role"], "content": msg["content"]})

        # Save user message
        user_msg = ChatMessage(role="user", content=user_message)
        await cache.add_message(session_id, user_msg)

        # Stream response
        full_response = ""
        async for chunk in stream_with_claude(
            prompt=user_message,
            history=claude_history[:-1] if claude_history else [],
            context_data=context,
        ):
            full_response += chunk
            yield chunk

        # Save assistant response
        assistant_msg = ChatMessage(role="assistant", content=full_response)
        await cache.add_message(session_id, assistant_msg)

    async def quick_insight(self, session_id: str, topic: str) -> str:
        session = await cache.get_session(session_id)
        context = self._build_context(session.get("analysis") if session else None)

        prompts = {
            "why_ahead": "In 3 sharp bullet points, explain exactly why Nilaya Education is ahead of PES right now. Be brutally honest.",
            "top_opportunities": "List the top 5 untapped opportunities PES should exploit this month based on competitor gaps.",
            "counter_campaign": "Design a specific counter-campaign for PES to respond to Nilaya's current ad strategy. Include ad copy.",
            "quick_wins": "What are 3 things PES can do TODAY to improve competitive position? Be specific.",
        }

        prompt = prompts.get(topic, f"Give a quick strategic insight about: {topic}")
        return await analyze_with_claude(prompt, context_data=context, system_override=JARVIS_SYSTEM)

    def _build_context(self, analysis: Optional[Dict]) -> Dict:
        if not analysis:
            return {"status": "No analysis data available yet. Run analysis first."}

        ctx = {
            "analysis_date": analysis.get("generated_at", ""),
            "which_brand_ahead": analysis.get("ai_analysis", {}).get("which_brand_ahead", ""),
            "summary": analysis.get("ai_analysis", {}).get("summary", ""),
            "daily_report": analysis.get("ai_analysis", {}).get("daily_battle_report", ""),
        }

        scores = analysis.get("ai_analysis", {}).get("scores", {})
        if scores:
            ctx["pes_overall_score"] = scores.get("PES", {}).get("overall_score", "N/A")
            ctx["nilaya_overall_score"] = scores.get("Nilaya", {}).get("overall_score", "N/A")

        pes = analysis.get("pes_data", {})
        nilaya = analysis.get("nilaya_data", {})
        ctx["pes_active_ads"] = pes.get("active_ad_count", 0)
        ctx["nilaya_active_ads"] = nilaya.get("active_ad_count", 0)
        ctx["pes_website_ctas"] = pes.get("website", {}).get("cta_buttons", [])[:3]
        ctx["nilaya_website_ctas"] = nilaya.get("website", {}).get("cta_buttons", [])[:3]

        alerts = analysis.get("ai_analysis", {}).get("alerts", [])
        ctx["active_alerts"] = len(alerts)

        return ctx
