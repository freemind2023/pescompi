from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.schemas import ChatRequest
from app.agents.jarvis import JarvisAgent
from app.api.routes.auth import verify_token
from app.services.cache_service import cache

router = APIRouter(prefix="/chat", tags=["Jarvis Chat"])
security = HTTPBearer()
jarvis = JarvisAgent()


def get_session_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = verify_token(credentials.credentials)
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="No session in token")
    return session_id


@router.post("/message")
async def send_message(
    request: ChatRequest,
    session_id: str = Depends(get_session_id),
):
    """Send a message to Jarvis and receive streaming response."""
    if request.session_id != session_id:
        raise HTTPException(status_code=403, detail="Session mismatch")

    exists = await cache.session_exists(session_id)
    if not exists:
        raise HTTPException(status_code=404, detail="Session expired. Please log in again.")

    async def event_stream():
        try:
            async for chunk in jarvis.chat(session_id, request.message):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history")
async def get_chat_history(session_id: str = Depends(get_session_id)):
    messages = await cache.get_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@router.delete("/history")
async def clear_chat_history(session_id: str = Depends(get_session_id)):
    session = await cache.get_session(session_id)
    if session:
        session["messages"] = []
    return {"message": "Chat history cleared"}


@router.post("/quick-insight")
async def quick_insight(
    topic: str,
    session_id: str = Depends(get_session_id),
):
    """Get a quick insight on a specific topic without streaming."""
    valid_topics = ["why_ahead", "top_opportunities", "counter_campaign", "quick_wins"]
    if topic not in valid_topics:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid topic. Choose from: {', '.join(valid_topics)}",
        )
    result = await jarvis.quick_insight(session_id, topic)
    return {"topic": topic, "insight": result}
