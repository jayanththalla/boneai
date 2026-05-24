"""
BoneAI — FastAPI Application Entry Point.

Startup loads the fracture detection model via lifespan context manager.
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ALLOWED_ORIGINS
from app.core.model_loader import load_model, get_model_device, is_model_loaded

# ─── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("boneai")

# ─── Startup timestamp ────────────────────────────────────────────────────────
_start_time: float = 0.0


def get_uptime() -> float:
    """Return seconds since server start."""
    return time.time() - _start_time


# ─── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown."""
    global _start_time
    _start_time = time.time()

    logger.info("=" * 60)
    logger.info("BoneAI API starting up...")
    logger.info("=" * 60)

    # Load fracture detection model
    try:
        model = load_model()
        device = get_model_device()
        logger.info(f"EfficientNet-B4 loaded on {device}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.warning("API running without model — inference endpoints will fail")

    logger.info("BoneAI API ready")
    yield
    logger.info("BoneAI API shutting down...")


# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="BoneAI API",
    description="Clinical-grade musculoskeletal triage — sprain vs fracture detection",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
from app.routers import health, triage, cases  # noqa: E402

app.include_router(health.router)
app.include_router(triage.router, prefix="/triage")
app.include_router(cases.router)
