"""
BoneAI — Singleton model loader for EfficientNet-B4.
Loads the checkpoint once at startup and exposes the model globally.
"""
import logging
from pathlib import Path

import torch
import timm

from app.core.config import CKPT_PATH, MODEL_NAME

logger = logging.getLogger("boneai.model_loader")

# ─── Global state ──────────────────────────────────────────────────────────────
_model = None
_device = None


def get_device() -> torch.device:
    """Detect best available device."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class FractureModel(torch.nn.Module):
    def __init__(self, model_name="efficientnet_b4", dropout_p=0.4):
        super().__init__()
        self.backbone = timm.create_model(model_name, pretrained=False, num_classes=0, global_pool='')
        self.head = torch.nn.Sequential(
            torch.nn.AdaptiveAvgPool2d(1),
            torch.nn.Flatten(),
            torch.nn.Dropout(p=dropout_p),
            torch.nn.Linear(1792, 512),
            torch.nn.ReLU(),
            torch.nn.Dropout(p=dropout_p),
            torch.nn.Linear(512, 1)
        )
    
    def forward(self, x):
        return self.head(self.backbone(x))


def load_model(ckpt_path: Path | None = None) -> torch.nn.Module:
    """
    Load EfficientNet-B4 with trained weights.
    Uses the custom FractureModel architecture from the training script.
    """
    global _model, _device

    _device = get_device()
    ckpt = ckpt_path or CKPT_PATH

    logger.info(f"Loading custom model {MODEL_NAME} on {_device}")

    # Create model with same architecture as training
    model = FractureModel(MODEL_NAME, dropout_p=0.4)

    if ckpt.exists():
        checkpoint = torch.load(str(ckpt), map_location=_device, weights_only=False)
        state_dict = checkpoint.get("state_dict", checkpoint)
        model.load_state_dict(state_dict)
        logger.info(f"Loaded checkpoint from {ckpt}")
    else:
        logger.warning(f"Checkpoint not found at {ckpt} — using random weights!")

    model = model.to(_device)
    model.eval()

    _model = model
    return model


def get_model() -> torch.nn.Module:
    """Return the loaded model singleton."""
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    return _model


def get_model_device() -> torch.device:
    """Return the device the model is on."""
    if _device is None:
        return get_device()
    return _device


def is_model_loaded() -> bool:
    """Check if the model has been loaded."""
    return _model is not None
