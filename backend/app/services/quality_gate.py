"""
BoneAI — X-ray Quality Gate.

Checks blur (Laplacian variance) and exposure (mean pixel intensity)
before running inference. Rejects poor-quality images early.
"""
import logging

import cv2
import numpy as np

from app.core.config import BLUR_THRESHOLD, EXPOSURE_MIN, EXPOSURE_MAX
from app.models.schemas import QualityResult

logger = logging.getLogger("boneai.quality_gate")


def check(image_bgr: np.ndarray) -> QualityResult:
    """
    Assess X-ray image quality.

    Args:
        image_bgr: OpenCV BGR image array.

    Returns:
        QualityResult with blur_score, exposure_ok, and pass_gate.
    """
    # Convert to grayscale for analysis
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Blur score: variance of Laplacian (higher = sharper)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # Exposure check: mean pixel should be in reasonable range
    mean_pixel = float(np.mean(gray))
    exposure_ok = EXPOSURE_MIN < mean_pixel < EXPOSURE_MAX

    # Gate decision
    pass_gate = blur_score >= BLUR_THRESHOLD and exposure_ok

    logger.info(
        f"Quality gate: blur={blur_score:.1f} (min={BLUR_THRESHOLD}) "
        f"exposure={mean_pixel:.1f} (range={EXPOSURE_MIN}-{EXPOSURE_MAX}) "
        f"pass={pass_gate}"
    )

    return QualityResult(
        blur_score=round(blur_score, 1),
        exposure_ok=exposure_ok,
        pass_gate=pass_gate,
    )
