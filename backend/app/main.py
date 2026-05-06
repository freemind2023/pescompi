import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.routes import auth, analysis, chat, export, alerts
from app.services.cache_service import cache


limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: schedule periodic session cleanup
    async def _cleanup_task():
        while True:
            await asyncio.sleep(900)  # every 15 min
            removed = await cache.purge_expired()
            if removed:
                print(f"[Cache] Purged {removed} expired sessions")

    task = asyncio.create_task(_cleanup_task())

    # Install playwright browsers if not present
    try:
        import subprocess
        subprocess.run(
            ["python", "-m", "playwright", "install", "chromium", "--with-deps"],
            check=False,
            capture_output=True,
        )
    except Exception:
        pass

    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Competitor Intelligence API — Practical EduSkills War Room",
    description="AI-powered competitor intelligence dashboard for Practical EduSkills vs Nilaya Education",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")


# Create __init__.py files
@app.get("/")
async def root():
    return {
        "service": "Competitor Intelligence API — Practical EduSkills War Room",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "active_sessions": cache.active_session_count(),
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
