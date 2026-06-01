import os
import torch

from backend.ml.autoencoder.model import Autoencoder
from backend.core.config import BASE_DIR


MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "final_rf_autoencoder.pth"
)

THRESHOLD_PATH = os.path.join(
    BASE_DIR,
    "models",
    "final_rf_threshold.txt"
)


def load_model():
    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    model = Autoencoder().to(device)

    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=device)
    )

    model.eval()

    with open(THRESHOLD_PATH, "r") as f:
        threshold = float(f.read().strip())

    return model, threshold, device