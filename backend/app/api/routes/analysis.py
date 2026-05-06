import asyncio
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.schemas import AnalysisRequest, FullAnalysisResponse
from app.services.analysis_service import orchestrator
from app.services.cache_service import cache
from app.api.routes.auth import verify_token

router = APIRouter(prefix="/analysis", tags=["Analysis"])
security = HTTPBearer()


def get_session_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = verify_token(credentials.credentials)
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="No session in token")
    return session_id


@router.post("/run", response_model=FullAnalysisResponse)
async def run_analysis(
    request: AnalysisRequest,
    session_id: str = Depends(get_session_id),
):
    """Run full competitor analysis — scrapes all data and generates AI report."""
    request.session_id = session_id
    try:
        result = await orchestrator.run_full_analysis(request, session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/status/{session_id}")
async def get_analysis_status(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    verify_token(credentials.credentials)
    exists = await cache.session_exists(session_id)
    if not exists:
        return {"status": "not_found", "has_analysis": False}

    analysis = await cache.get_analysis(session_id)
    return {
        "status": "active",
        "has_analysis": analysis is not None,
        "session_id": session_id,
    }


@router.get("/result", response_model=FullAnalysisResponse)
async def get_cached_result(session_id: str = Depends(get_session_id)):
    """Retrieve cached analysis result without re-scraping."""
    analysis = await cache.get_analysis(session_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run /analysis/run first.")
    return FullAnalysisResponse(**analysis)


@router.delete("/clear")
async def clear_session(session_id: str = Depends(get_session_id)):
    """Clear cached analysis to force fresh scrape next time."""
    session = await cache.get_session(session_id)
    if session:
        session["analysis"] = None
        session["scraped_data"] = {}
    return {"message": "Cache cleared. Next analysis will re-scrape all data."}


@router.post("/purge-expired")
async def purge_expired_sessions():
    """Internal maintenance endpoint — remove expired sessions."""
    removed = await cache.purge_expired()
    return {"removed_sessions": removed}
