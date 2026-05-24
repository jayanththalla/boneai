"""
BoneAI Core Configuration
"""
import os
from pathlib import Path


# ─── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
PROJECT_ROOT = BASE_DIR.parent  # boneai/

# Model checkpoint — sits inside backend/models/
CKPT_PATH = BASE_DIR / "models" / "best_fracture_model.pt"

# ─── Model settings ───────────────────────────────────────────────────────────
MODEL_NAME = "efficientnet_b4"
IMG_SIZE = 380
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ─── Uncertainty thresholds ────────────────────────────────────────────────────
MC_DROPOUT_PASSES = 30
UNCERTAINTY_THRESHOLD = 0.15  # std >= 0.15 → radiologist queue
FRACTURE_THRESHOLD = 0.5     # prob >= 0.5 → fracture detected

# ─── Quality gate ─────────────────────────────────────────────────────────────
BLUR_THRESHOLD = 80.0
EXPOSURE_MIN = 30
EXPOSURE_MAX = 220

# ─── NLP triage ───────────────────────────────────────────────────────────────
SEVERITY_LOW_THRESHOLD = 0.4
SEVERITY_HIGH_THRESHOLD = 0.7

# ─── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "https://yourdomain.com",
]

# ─── Server ────────────────────────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
