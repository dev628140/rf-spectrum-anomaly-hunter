import os
import glob
import json
import time
import random
import subprocess
from datetime import datetime

import numpy as np
import torch
import torch.nn as nn


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NORMAL_DIR = os.path.join(
    BASE_DIR,
    "real_rf_dataset",
    "processed",
    "normal"
)

ANOMALY_DIR = os.path.join(
    BASE_DIR,
    "real_rf_dataset",
    "processed",
    "anomaly"
)

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

LIVE_DIR = os.path.join(
    BASE_DIR,
    "live_runtime"
)

STATE_PATH = os.path.join(
    LIVE_DIR,
    "live_state.json"
)

LOG_PATH = os.path.join(
    LIVE_DIR,
    "recent_events.log"
)

CURRENT_INPUT_PATH = os.path.join(
    LIVE_DIR,
    "current_input.npz"
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
            nn.ConvTranspose2d(
                128, 64,
                3,
                stride=2,
                padding=1,
                output_padding=1
            ),
            nn.ReLU(),

            nn.ConvTranspose2d(
                64, 32,
                3,
                stride=2,
                padding=1,
                output_padding=1
            ),
            nn.ReLU(),

            nn.ConvTranspose2d(
                32, 16,
                3,
                stride=2,
                padding=1,
                output_padding=1
            ),
            nn.ReLU(),

            nn.ConvTranspose2d(
                16, 1,
                3,
                stride=2,
                padding=1,
                output_padding=1
            ),
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

    with open(THRESHOLD_PATH, "r") as f:
        threshold = float(f.read().strip())

    return model, threshold, device


def load_dataset():
    normal = glob.glob(os.path.join(NORMAL_DIR, "*.npz"))
    anomaly = glob.glob(os.path.join(ANOMALY_DIR, "*.npz"))

    if not normal:
        raise Exception("No normal samples found")

    if not anomaly:
        raise Exception("No anomaly samples found")

    return normal, anomaly


def preprocess(window):
    x = window.astype(np.float32)

    x = (x + 120.0) / 120.0
    x = np.clip(x, 0.0, 1.0)

    x = np.expand_dims(x, axis=0)
    x = np.expand_dims(x, axis=0)

    return torch.tensor(x)


def write_state(status, score, threshold):
    payload = {
        "status": status,
        "score": score,
        "threshold": threshold,
        "timestamp": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    }

    with open(STATE_PATH, "w") as f:
        json.dump(payload, f, indent=4)


def append_log(status, score):
    line = (
        f"[{datetime.now()}] "
        f"{status} | Score={score:.10f}\n"
    )

    with open(LOG_PATH, "a") as f:
        f.write(line)


def trigger_xai():
    try:
        subprocess.run(
            [
                "python",
                os.path.join(
                    BASE_DIR,
                    "ml",
                    "generate_final_rf_xai.py"
                )
            ],
            check=False
        )
    except Exception as e:
        print("XAI trigger failed:", e)


def simulate_stream(normal_files, anomaly_files):
    while True:
        mode = random.choices(
            ["normal", "anomaly"],
            weights=[80, 20]
        )[0]

        if mode == "normal":
            file = random.choice(normal_files)
        else:
            file = random.choice(anomaly_files)

        yield mode, file


def main():
    print("Loading model...")
    model, threshold, device = load_model()

    print("Loading dataset...")
    normal_files, anomaly_files = load_dataset()

    print("Simulation started...\n")

    stream = simulate_stream(
        normal_files,
        anomaly_files
    )

    with torch.no_grad():
        for true_mode, file in stream:
            sample = np.load(file)

            window = sample["rf_window"]

            np.savez_compressed(
                CURRENT_INPUT_PATH,
                rf_window=window
            )

            tensor = preprocess(window).to(device)

            recon = model(tensor)

            error = torch.mean(
                (tensor - recon) ** 2
            ).item()

            status = (
                "ANOMALY"
                if error > threshold
                else "NORMAL"
            )

            write_state(
                status,
                error,
                threshold
            )

            append_log(
                status,
                error
            )

            print(
                f"{status} | "
                f"Score={error:.10f}"
            )

            if status == "ANOMALY":
                trigger_xai()

            time.sleep(3)


if __name__ == "__main__":
    main()