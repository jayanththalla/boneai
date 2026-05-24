"""
BoneAI — Fracture Detector Service.

EfficientNet-B4 inference with CLAHE preprocessing.
"""
import logging

import cv2
import numpy as np
import torch
from torchvision import transforms

from app.core.config import IMG_SIZE, IMAGENET_MEAN, IMAGENET_STD
from app.core.model_loader import get_model, get_model_device

logger = logging.getLogger("boneai.fracture_detector")


def apply_clahe(image_bgr: np.ndarray) -> np.ndarray:
    """Apply CLAHE to the L-channel of a LAB image for X-ray enhancement."""
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)
    enhanced = cv2.merge([l_eq, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def preprocess(image_bgr: np.ndarray) -> torch.Tensor:
    """
    CLAHE → resize → ImageNet normalise → tensor.

    Returns a 4D tensor (1, 3, H, W) ready for the model.
    """
    # CLAHE enhancement
    enhanced = apply_clahe(image_bgr)

    # BGR → RGB
    rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)

    # Resize to model input size
    resized = cv2.resize(rgb, (IMG_SIZE, IMG_SIZE))

    # Normalise and convert to tensor
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    tensor = transform(resized)
    return tensor.unsqueeze(0)  # Add batch dimension


def predict(image_bgr: np.ndarray) -> float:
    """
    Run single forward pass through EfficientNet-B4.

    Args:
        image_bgr: OpenCV BGR image array.

    Returns:
        Fracture probability (0-1).
    """
    model = get_model()
    device = get_model_device()

    tensor = preprocess(image_bgr).to(device)

    with torch.no_grad():
        logit = model(tensor)
        prob = torch.sigmoid(logit).item()

    logger.info(f"Fracture prediction: prob={prob:.4f}")
    return prob
