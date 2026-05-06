from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.schemas import ExportRequest, FullAnalysisResponse
from app.services.report_service import generate_pdf_report, generate_excel_report
from app.services.cache_service import cache
from app.api.routes.auth import verify_token
from datetime import datetime

router = APIRouter(prefix="/export", tags=["Export"])
security = HTTPBearer()


def get_session_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = verify_token(credentials.credentials)
    return payload.get("session_id", "")


@router.post("/pdf")
async def export_pdf(
    request: ExportRequest,
    session_id: str = Depends(get_session_id),
):
    analysis_data = await cache.get_analysis(session_id)
    if not analysis_data:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")

    analysis = FullAnalysisResponse(**analysis_data)
    pdf_bytes = generate_pdf_report(analysis)
    filename = f"pes_intel_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/excel")
async def export_excel(
    request: ExportRequest,
    session_id: str = Depends(get_session_id),
):
    analysis_data = await cache.get_analysis(session_id)
    if not analysis_data:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")

    analysis = FullAnalysisResponse(**analysis_data)
    excel_bytes = generate_excel_report(analysis)
    filename = f"pes_intel_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/preview")
async def export_preview(session_id: str = Depends(get_session_id)):
    """Return a JSON preview of what would be exported."""
    analysis_data = await cache.get_analysis(session_id)
    if not analysis_data:
        raise HTTPException(status_code=404, detail="No analysis found.")

    ai = analysis_data.get("ai_analysis", {})
    return {
        "summary": ai.get("summary", ""),
        "which_brand_ahead": ai.get("which_brand_ahead", ""),
        "scores": ai.get("scores", {}),
        "top_recommendations": ai.get("recommendations", [])[:3],
        "alerts_count": len(ai.get("alerts", [])),
        "generated_at": analysis_data.get("generated_at", ""),
    }
