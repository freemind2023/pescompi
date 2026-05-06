import asyncio
import time
import uuid
from typing import Any, Dict, Optional, List
from app.models.schemas import ChatMessage, FullAnalysisResponse


class SessionCache:
    """In-memory session store — no database, TTL-based eviction."""

    def __init__(self, ttl_seconds: int = 28800):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._ttl = ttl_seconds
        self._lock = asyncio.Lock()

    def _is_expired(self, session: Dict) -> bool:
        return time.time() - session.get("created_at", 0) > self._ttl

    async def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        async with self._lock:
            self._store[session_id] = {
                "created_at": time.time(),
                "analysis": None,
                "messages": [],
                "scraped_data": {},
                "alerts": [],
            }
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict]:
        async with self._lock:
            session = self._store.get(session_id)
            if session and not self._is_expired(session):
                return session
            if session:
                del self._store[session_id]
        return None

    async def set_analysis(self, session_id: str, analysis: FullAnalysisResponse) -> None:
        async with self._lock:
            if session_id in self._store:
                self._store[session_id]["analysis"] = analysis.model_dump()

    async def get_analysis(self, session_id: str) -> Optional[Dict]:
        session = await self.get_session(session_id)
        if session:
            return session.get("analysis")
        return None

    async def add_message(self, session_id: str, message: ChatMessage) -> None:
        async with self._lock:
            if session_id in self._store:
                self._store[session_id]["messages"].append(message.model_dump())

    async def get_messages(self, session_id: str) -> List[Dict]:
        session = await self.get_session(session_id)
        if session:
            return session.get("messages", [])
        return []

    async def set_scraped_data(self, session_id: str, key: str, data: Any) -> None:
        async with self._lock:
            if session_id in self._store:
                self._store[session_id]["scraped_data"][key] = data

    async def get_scraped_data(self, session_id: str, key: str) -> Optional[Any]:
        session = await self.get_session(session_id)
        if session:
            return session.get("scraped_data", {}).get(key)
        return None

    async def set_alerts(self, session_id: str, alerts: List[Dict]) -> None:
        async with self._lock:
            if session_id in self._store:
                self._store[session_id]["alerts"] = alerts

    async def get_alerts(self, session_id: str) -> List[Dict]:
        session = await self.get_session(session_id)
        if session:
            return session.get("alerts", [])
        return []

    async def purge_expired(self) -> int:
        removed = 0
        async with self._lock:
            expired = [sid for sid, s in self._store.items() if self._is_expired(s)]
            for sid in expired:
                del self._store[sid]
                removed += 1
        return removed

    async def session_exists(self, session_id: str) -> bool:
        session = await self.get_session(session_id)
        return session is not None

    def active_session_count(self) -> int:
        return sum(1 for s in self._store.values() if not self._is_expired(s))


cache = SessionCache()
