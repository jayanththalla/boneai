"""
BoneAI Pydantic Schemas — Request/Response models for all API endpoints.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ─────────────────────────────────────────────────────────────────────

class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class XrayStatus(str, Enum):
    fracture = "fracture"
    no_fracture = "no_fracture"
    radiologist_queue = "radiologist_queue"
    retake = "retake"


class CaseStatus(str, Enum):
    pending = "pending"
    reviewed = "reviewed"
    escalated = "escalated"


# ─── Symptom Triage ────────────────────────────────────────────────────────────

class SymptomRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Symptom description (any language)")
    pain_score: int = Field(..., ge=1, le=10, description="Pain scale 1-10")
    signals: list[str] = Field(default_factory=list, description="Selected quick-signal chips")
    photo_base64: Optional[str] = Field(None, description="Optional injury photo as base64")


class SymptomResponse(BaseModel):
    severity: Severity
    confidence: float = Field(..., ge=0, le=1)
    key_signals: list[str]
    xray_required: bool
    message: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ─── Quality Gate ──────────────────────────────────────────────────────────────

class QualityResult(BaseModel):
    blur_score: float
    exposure_ok: bool
    pass_gate: bool


# ─── X-ray Triage ─────────────────────────────────────────────────────────────

class XrayResponse(BaseModel):
    status: XrayStatus
    fracture_prob: float = Field(..., ge=0, le=1)
    uncertainty: float = Field(..., ge=0)
    verdict: str
    action: str
    gradcam_base64: Optional[str] = None
    quality: QualityResult
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ─── Radiologist Cases ─────────────────────────────────────────────────────────

class CaseRecord(BaseModel):
    report_id: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    body_region: str = "Unknown"
    uncertainty_score: float
    nlp_severity: Severity
    fracture_prob: float
    status: CaseStatus = CaseStatus.pending
    radiologist_note: Optional[str] = None
    gradcam_base64: Optional[str] = None


class CasePatch(BaseModel):
    status: CaseStatus
    radiologist_note: Optional[str] = None


# ─── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    device: str
    uptime_seconds: float
