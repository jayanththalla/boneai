"""
BoneAI — Grad-CAM Heatmap Generator.

Uses pytorch-grad-cam to generate visual explanations
showing which regions influenced the fracture prediction.
"""
import base64
import io
import logging

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

from app.core.config import IMG_SIZE
from app.core.model_loader import get_model, get_model_device
from app.services.fracture_detector import preprocess, apply_clahe

logger = logging.getLogger("boneai.gradcam")


def _get_target_layer(model: torch.nn.Module):
    """
    Get the target layer for Grad-CAM.
    For EfficientNet-B4 (timm), the last block is model.blocks[-1][-1].
    """
    # timm EfficientNet uses model.blocks as the main feature extractor
    try:
        return [model.blocks[-1][-1]]
    except (AttributeError, IndexError):
        # Fallback: try conv_head
        try:
            return [model.conv_head]
        except AttributeError:
            logger.warning("Could not find target layer for Grad-CAM")
            return None


def generate(image_bgr: np.ndarray) -> str | None:
    """
    Generate Grad-CAM heatmap overlay for the given X-ray image.

    Args:
        image_bgr: OpenCV BGR image.

    Returns:
        Base64-encoded PNG of the heatmap overlay, or None on failure.
    """
    model = get_model()
    device = get_model_device()

    target_layers = _get_target_layer(model)
    if target_layers is None:
        return None

    # Preprocess for model
    tensor = preprocess(image_bgr).to(device)

    # Prepare normalized RGB image for overlay (0-1 range)
    enhanced = apply_clahe(image_bgr)
    rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
    rgb_resized = cv2.resize(rgb, (IMG_SIZE, IMG_SIZE))
    rgb_normalized = rgb_resized.astype(np.float32) / 255.0

    try:
        # Generate CAM
        cam = GradCAM(model=model, target_layers=target_layers)
        grayscale_cam = cam(input_tensor=tensor, targets=None)
        grayscale_cam = grayscale_cam[0, :]  # First (only) image in batch

        # Create overlay
        overlay = show_cam_on_image(rgb_normalized, grayscale_cam, use_rgb=True)

        # Encode to base64 PNG
        pil_image = Image.fromarray(overlay)
        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        buffer.seek(0)
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        logger.info("Grad-CAM heatmap generated successfully")
        return b64

    except Exception as e:
        logger.error(f"Grad-CAM generation failed: {e}")
        return None
