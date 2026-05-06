from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional

from app.models.schemas import AlertItem
from app.services.cache_service import cache
from app.api.routes.auth import verify_token
from app.services.claude_service import analyze_with_claude
import json, re

router = APIRouter(prefix="/alerts", tags=["Alerts"])
security = HTTPBearer()


def get_session_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = verify_token(credentials.credentials)
    return payload.get("session_id", "")


@router.get("/", response_model=List[dict])
async def get_alerts(
    severity: Optional[str] = None,
    session_id: str = Depends(get_session_id),
):
    alerts = await cache.get_alerts(session_id)
    if not alerts:
        # Pull from analysis if not separately stored
        analysis = await cache.get_analysis(session_id)
        if analysis:
            alerts = analysis.get("ai_analysis", {}).get("alerts", [])
            await cache.set_alerts(session_id, alerts)

    if severity:
        alerts = [a for a in alerts if a.get("severity") == severity]

    return sorted(alerts, key=lambda x: {"critical": 0, "warning": 1, "info": 2}.get(x.get("severity", "info"), 2))


@router.post("/detect")
async def detect_new_alerts(session_id: str = Depends(get_session_id)):
    """Re-run alert detection on current analysis data."""
    analysis = await cache.get_analysis(session_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found.")

    prompt = f"""Based on this competitor intelligence data, identify URGENT alerts for the founder of Practical EduSkills.

Data summary:
- PES active ads: {analysis.get('pes_data', {}).get('active_ad_count', 0)}
- Nilaya active ads: {analysis.get('nilaya_data', {}).get('active_ad_count', 0)}
- Current leader: {analysis.get('ai_analysis', {}).get('which_brand_ahead', 'Unknown')}

Generate a JSON array of alerts with this structure:
[{{"severity": "critical|warning|info", "title": "...", "description": "...", "brand": "...", "platform": "...", "action_required": "..."}}]

Focus on: new campaigns launched, messaging changes, competitor advantages, urgent opportunities."""

    raw = await analyze_with_claude(prompt)
    new_alerts = []
    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if match:
        try:
            new_alerts = json.loads(match.group())
        except Exception:
            pass

    import uuid
    from datetime import datetime
    for alert in new_alerts:
        alert["id"] = str(uuid.uuid4())[:8]
        alert["detected_at"] = datetime.utcnow().isoformat()

    await cache.set_alerts(session_id, new_alerts)
    return {"alerts": new_alerts, "count": len(new_alerts)}


@router.get("/count")
async def alert_count(session_id: str = Depends(get_session_id)):
    alerts = await cache.get_alerts(session_id)
    if not alerts:
        analysis = await cache.get_analysis(session_id)
        alerts = analysis.get("ai_analysis", {}).get("alerts", []) if analysis else []

    counts = {"critical": 0, "warning": 0, "info": 0, "total": len(alerts)}
    for a in alerts:
        sev = a.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
    return counts
