import os
import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "final_rf_autoencoder.pth"
)

LIVE_DIR = os.path.join(
    BASE_DIR,
    "live_runtime"
)

INPUT_PATH = os.path.join(
    LIVE_DIR,
    "current_input.npz"
)

OUTPUT_PATH = os.path.join(
    LIVE_DIR,
    "latest_explainability.png"
)

os.makedirs(LIVE_DIR, exist_ok=True)


class Autoencoder(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1),
            nn.ReLU(),

            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),

            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU(),

            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(128, 64, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),

            nn.ConvTranspose2d(64, 32, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),

            nn.ConvTranspose2d(32, 16, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),

            nn.ConvTranspose2d(16, 1, 3, stride=2, padding=1, output_padding=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        out = self.decoder(self.encoder(x))
        out = out[:, :, :64, :1025]
        return out


def load_model():
    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    model = Autoencoder().to(device)

    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=device)
    )

    model.eval()

    return model, device


def load_live_sample():
    if not os.path.exists(INPUT_PATH):
        raise Exception("No live input available")

    sample = np.load(INPUT_PATH)

    window = sample["rf_window"].astype(np.float32)

    normalized = (window + 120.0) / 120.0
    normalized = np.clip(normalized, 0.0, 1.0)

    tensor = np.expand_dims(normalized, axis=0)
    tensor = np.expand_dims(tensor, axis=0)

    return window, tensor


def generate():
    model, device = load_model()

    original_window, tensor = load_live_sample()

    tensor = torch.tensor(tensor).to(device)

    with torch.no_grad():
        recon = model(tensor)

    recon = recon.cpu().numpy()[0][0]

    recon_db = (recon * 120.0) - 120.0

    diff = np.abs(original_window - recon_db)

    fig = plt.figure(figsize=(18, 10))

    plt.subplot(1, 3, 1)
    plt.imshow(original_window, aspect="auto", cmap="viridis")
    plt.title("Live RF Input")
    plt.xlabel("Frequency Bins")
    plt.ylabel("Time Frames")
    plt.colorbar()

    plt.subplot(1, 3, 2)
    plt.imshow(recon_db, aspect="auto", cmap="viridis")
    plt.title("Expected Normal Reconstruction")
    plt.xlabel("Frequency Bins")
    plt.colorbar()

    plt.subplot(1, 3, 3)
    plt.imshow(
        diff,
        aspect="auto",
        cmap="hot",
        vmin=0,
        vmax=np.percentile(diff, 99)
    )
    plt.title("Localized Live Anomaly Heatmap")
    plt.xlabel("Frequency Bins")
    plt.colorbar()

    plt.tight_layout()
    plt.savefig(OUTPUT_PATH, dpi=200)
    plt.close()


if __name__ == "__main__":
    generate()