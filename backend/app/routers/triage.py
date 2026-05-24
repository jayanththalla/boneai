"""
BoneAI — Triage Router.

POST /triage/symptoms  → NLP-based severity scoring
POST /triage/xray      → EfficientNet-B4 fracture detection pipeline
"""
import io
import logging
import uuid

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.models.schemas import (
    SymptomRequest,
    SymptomResponse,
    XrayResponse,
    XrayStatus,
    Severity,
    CaseRecord,
    CaseStatus,
)
from app.services import nlp_triage, quality_gate, fracture_detector, uncertainty, gradcam
from app.core.config import FRACTURE_THRESHOLD, UNCERTAINTY_THRESHOLD

logger = logging.getLogger("boneai.triage")

router = APIRouter(tags=["triage"])


# ─── In-memory case store (shared with cases router) ──────────────────────────
# This is imported by cases.py
cases_store: dict[str, CaseRecord] = {}


@router.post("/symptoms", response_model=SymptomResponse)
async def triage_symptoms(req: SymptomRequest):
    """
    Analyse symptom text, pain score, and signal chips.
    Returns severity classification and whether X-ray is required.
    """
    severity, confidence, key_signals = nlp_triage.analyse_symptoms(
        text=req.text,
        pain_score=req.pain_score,
        signals=req.signals,
    )

    xray_required = severity == Severity.high

    # Build human-readable message
    messages = {
        Severity.low: "Low fracture risk. Self-care with RICE protocol is likely sufficient.",
        Severity.medium: "Moderate injury detected. Monitor symptoms closely. Seek care if worsening.",
        Severity.high: "High fracture risk detected. X-ray recommended for confirmation.",
    }

    session_id = str(uuid.uuid4())

    return SymptomResponse(
        severity=severity,
        confidence=round(confidence, 2),
        key_signals=key_signals,
        xray_required=xray_required,
        message=messages[severity],
        session_id=session_id,
    )


@router.post("/xray", response_model=XrayResponse)
async def triage_xray(
    file: UploadFile = File(..., description="X-ray image (JPEG/PNG)"),
    session_id: str = Form(..., description="Session ID from symptom triage"),
):
    """
    Full X-ray analysis pipeline:
    1. Quality gate check
    2. CLAHE preprocessing
    3. EfficientNet-B4 fracture detection
    4. MC-Dropout uncertainty estimation (30 passes)
    5. Grad-CAM heatmap generation
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # ── Step 1: Quality gate ───────────────────────────────────────────────
    quality = quality_gate.check(image_bgr)

    if not quality.pass_gate:
        return XrayResponse(
            status=XrayStatus.retake,
            fracture_prob=0.0,
            uncertainty=0.0,
            verdict="Image quality insufficient",
            action="Please retake the X-ray with better lighting and focus.",
            quality=quality,
        )

    # ── Step 2-3: Fracture detection with MC-Dropout ──────────────────────
    try:
        mean_prob, std_prob = uncertainty.mc_dropout_predict(image_bgr)
    except RuntimeError as e:
        logger.error(f"Model inference failed: {e}")
        raise HTTPException(status_code=500, detail="Model inference failed")

    # ── Step 4: Determine status ──────────────────────────────────────────
    if std_prob >= UNCERTAINTY_THRESHOLD:
        status = XrayStatus.radiologist_queue
        verdict = "Uncertain — sent to radiologist"
        action = "Sent to radiologist queue — you'll receive a report within 2 hours"
    elif mean_prob >= FRACTURE_THRESHOLD:
        status = XrayStatus.fracture
        verdict = "Fracture detected"
        action = "Urgent referral to orthopaedic surgeon recommended"
    else:
        status = XrayStatus.no_fracture
        verdict = "No fracture detected"
        action = "Follow RICE protocol: Rest, Ice, Compression, Elevation"

    # ── Step 5: Grad-CAM ──────────────────────────────────────────────────
    gradcam_b64 = None
    try:
        gradcam_b64 = gradcam.generate(image_bgr)
    except Exception as e:
        logger.warning(f"Grad-CAM failed (non-fatal): {e}")

    report_id = str(uuid.uuid4())

    # ── Step 6: Save to radiologist queue if uncertain ─────────────────────
    if status == XrayStatus.radiologist_queue:
        case = CaseRecord(
            report_id=report_id,
            session_id=session_id,
            uncertainty_score=round(std_prob, 4),
            nlp_severity=Severity.high,  # X-ray path always comes from high severity
            fracture_prob=round(mean_prob, 4),
            status=CaseStatus.pending,
            gradcam_base64=gradcam_b64,
        )
        cases_store[report_id] = case
        logger.info(f"Case {report_id} added to radiologist queue")

    return XrayResponse(
        status=status,
        fracture_prob=round(mean_prob, 4),
        uncertainty=round(std_prob, 4),
        verdict=verdict,
        action=action,
        gradcam_base64=gradcam_b64,
        quality=quality,
        report_id=report_id,
    )
