"""
BoneAI — Health endpoint.
"""
from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.core.model_loader import is_model_loaded, get_model_device

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Return API health status, model state, and device info."""
    # Import get_uptime here to avoid circular import with main
    from app.main import get_uptime

    return HealthResponse(
        status="ok",
        model_loaded=is_model_loaded(),
        device=str(get_model_device()),
        uptime_seconds=get_uptime(),
    )
