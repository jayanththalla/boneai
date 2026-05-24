"""
BoneAI — NLP Symptom Triage Service.

Phase 5: Keyword-based scoring for English + Hindi symptom text.
Phase 9: Can be upgraded to MuRIL/IndicBERT classification.
"""
import logging
import re

from app.core.config import SEVERITY_LOW_THRESHOLD, SEVERITY_HIGH_THRESHOLD
from app.models.schemas import Severity

logger = logging.getLogger("boneai.nlp_triage")

# ─── Keyword dictionaries ─────────────────────────────────────────────────────
# High-risk keywords across English and Hindi (transliterated)
HIGH_RISK_KEYWORDS = [
    # English
    "fracture", "broken", "break", "crack", "snap", "deformity", "deformed",
    "bone sticking", "bone out", "compound", "open wound", "numbness",
    "cannot move", "unable to move", "immobile", "bent wrong",
    # Hindi (transliterated)
    "haddi tuti", "toot gayi", "haddi", "fracture", "tut gaya", "tuta",
    "tedhapan", "hil nahi", "chal nahi", "sunn", "sun ho gaya",
]

MEDIUM_RISK_KEYWORDS = [
    # English
    "swelling", "swollen", "bruise", "bruising", "cannot bear weight",
    "weight bearing", "heard a crack", "pop", "popping", "sharp pain",
    "severe pain", "intense pain", "throbbing",
    # Hindi
    "sujan", "soojan", "neela", "neel pad gaya", "dard", "bahut dard",
    "tez dard", "bhar nahi", "pair nahi rakh", "chot", "gehri chot",
]

LOW_RISK_KEYWORDS = [
    # English
    "mild pain", "slight pain", "little sore", "tender", "ache",
    "stiff", "sprain", "twist", "rolled", "strain",
    # Hindi
    "halka dard", "thoda dard", "moch", "marood", "akad",
]

# Signal weights for the quick-select chips
SIGNAL_WEIGHTS = {
    "severe_swelling": 0.15,
    "cannot_bear_weight": 0.20,
    "heard_a_crack": 0.25,
    "bruising_present": 0.10,
    "sharp_pain": 0.10,
    "deformity_visible": 0.30,
}


def _count_keyword_matches(text: str, keywords: list[str]) -> int:
    """Count how many keywords appear in the text (case-insensitive)."""
    text_lower = text.lower()
    count = 0
    for kw in keywords:
        if kw.lower() in text_lower:
            count += 1
    return count


def _extract_key_signals(text: str, signals: list[str]) -> list[str]:
    """Extract detected signals from text and chip selections."""
    detected = []

    # From chip selections
    signal_labels = {
        "severe_swelling": "swelling",
        "cannot_bear_weight": "weight_bearing_loss",
        "heard_a_crack": "audible_crack",
        "bruising_present": "bruising",
        "sharp_pain": "sharp_pain",
        "deformity_visible": "deformity",
    }
    for sig in signals:
        if sig in signal_labels:
            detected.append(signal_labels[sig])

    # From text keywords
    text_lower = text.lower()
    if any(kw in text_lower for kw in ["swelling", "swollen", "sujan", "soojan"]):
        if "swelling" not in detected:
            detected.append("swelling")
    if any(kw in text_lower for kw in ["deform", "tedha", "tedhapan", "bent"]):
        if "deformity" not in detected:
            detected.append("deformity")
    if any(kw in text_lower for kw in ["numb", "sunn", "sun ho"]):
        if "numbness" not in detected:
            detected.append("numbness")

    return detected


def analyse_symptoms(
    text: str,
    pain_score: int,
    signals: list[str],
) -> tuple[Severity, float, list[str]]:
    """
    Analyse symptom text and signals to determine severity.

    Returns:
        (severity, confidence, key_signals)
    """
    # ── Score components ───────────────────────────────────────────────────
    # 1. Pain score contribution (normalised to 0-0.3)
    pain_component = (pain_score / 10) * 0.3

    # 2. Signal chip contribution (max ~0.3 from chips)
    signal_component = sum(
        SIGNAL_WEIGHTS.get(sig, 0.05) for sig in signals
    )
    signal_component = min(signal_component, 0.35)

    # 3. Keyword analysis (0-0.35)
    high_matches = _count_keyword_matches(text, HIGH_RISK_KEYWORDS)
    medium_matches = _count_keyword_matches(text, MEDIUM_RISK_KEYWORDS)
    low_matches = _count_keyword_matches(text, LOW_RISK_KEYWORDS)

    keyword_component = 0.0
    if high_matches > 0:
        keyword_component = min(0.35, 0.15 + high_matches * 0.08)
    elif medium_matches > 0:
        keyword_component = min(0.25, 0.08 + medium_matches * 0.05)
    elif low_matches > 0:
        keyword_component = min(0.10, low_matches * 0.03)

    # ── Total score ────────────────────────────────────────────────────────
    total_score = pain_component + signal_component + keyword_component
    total_score = min(total_score, 1.0)

    # ── Classify ───────────────────────────────────────────────────────────
    if total_score >= SEVERITY_HIGH_THRESHOLD:
        severity = Severity.high
    elif total_score >= SEVERITY_LOW_THRESHOLD:
        severity = Severity.medium
    else:
        severity = Severity.low

    # Confidence is higher when score is far from boundaries
    if severity == Severity.high:
        confidence = 0.7 + (total_score - SEVERITY_HIGH_THRESHOLD) * 0.5
    elif severity == Severity.low:
        confidence = 0.7 + (SEVERITY_LOW_THRESHOLD - total_score) * 0.5
    else:
        dist_to_boundary = min(
            total_score - SEVERITY_LOW_THRESHOLD,
            SEVERITY_HIGH_THRESHOLD - total_score,
        )
        confidence = 0.5 + dist_to_boundary * 1.5

    confidence = min(max(confidence, 0.45), 0.95)

    # ── Key signals ────────────────────────────────────────────────────────
    key_signals = _extract_key_signals(text, signals)

    logger.info(
        f"NLP triage: score={total_score:.2f} severity={severity} "
        f"confidence={confidence:.2f} signals={key_signals}"
    )

    return severity, confidence, key_signals
