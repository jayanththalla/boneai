"""
BoneAI — MC-Dropout Uncertainty Estimation.

Enables dropout at inference time and runs multiple forward passes
to estimate prediction uncertainty via Monte Carlo Dropout.
"""
import logging

import torch
import torch.nn as nn
import numpy as np

from app.core.config import MC_DROPOUT_PASSES
from app.core.model_loader import get_model, get_model_device
from app.services.fracture_detector import preprocess

logger = logging.getLogger("boneai.uncertainty")


def enable_dropout(model: nn.Module) -> None:
    """Set all Dropout layers to training mode (enables dropout at inference)."""
    for module in model.modules():
        if isinstance(module, nn.Dropout):
            module.train()


def mc_dropout_predict(
    image_bgr: np.ndarray,
    n: int = MC_DROPOUT_PASSES,
) -> tuple[float, float]:
    """
    Run MC-Dropout: n forward passes with dropout enabled.

    Args:
        image_bgr: OpenCV BGR image array.
        n: Number of forward passes (default: 30).

    Returns:
        (mean_probability, std_probability)
    """
    model = get_model()
    device = get_model_device()

    tensor = preprocess(image_bgr).to(device)

    # Enable dropout for uncertainty estimation
    model.eval()
    enable_dropout(model)

    probabilities = []
    with torch.no_grad():
        for _ in range(n):
            logit = model(tensor)
            prob = torch.sigmoid(logit).item()
            probabilities.append(prob)

    # Restore full eval mode
    model.eval()

    probs_array = np.array(probabilities)
    mean_prob = float(np.mean(probs_array))
    std_prob = float(np.std(probs_array))

    logger.info(
        f"MC-Dropout ({n} passes): mean={mean_prob:.4f} std={std_prob:.4f}"
    )

    return mean_prob, std_prob
