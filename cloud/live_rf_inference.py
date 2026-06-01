import os
import json
import time
import subprocess
from datetime import datetime

import numpy as np
import pandas as pd
import torch
import torch.nn as nn


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "models", "final_rf_autoencoder.pth")
THRESHOLD_PATH = os.path.join(BASE_DIR, "models", "final_rf_threshold.txt")

LIVE_DIR = os.path.join(BASE_DIR, "live_runtime")
CSV_PATH = os.path.join(LIVE_DIR, "live_capture.csv")
STATE_PATH = os.path.join(LIVE_DIR, "live_state.json")
EVENT_LOG = os.path.join(LIVE_DIR, "recent_events.log")

RTL_POWER = r"C:\SDR-Data\rtl_power.exe"

WINDOW_FRAMES = 64
TARGET_BINS = 1025

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
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = Autoencoder().to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()

    with open(THRESHOLD_PATH, "r") as f:
        threshold = float(f.read().strip())

    return model, threshold, device


def parse_live_csv():
    if not os.path.exists(CSV_PATH):
        return None

    try:
        df = pd.read_csv(CSV_PATH, header=None)

        if len(df) < WINDOW_FRAMES:
            return None

        power = df.iloc[:, 6:]
        power = power.apply(pd.to_numeric, errors="coerce")
        power = power.fillna(-120.0)

        matrix = power.values.astype(np.float32)

        if matrix.shape[1] > TARGET_BINS:
            matrix = matrix[:, :TARGET_BINS]
        elif matrix.shape[1] < TARGET_BINS:
            pad = TARGET_BINS - matrix.shape[1]
            matrix = np.pad(
                matrix,
                ((0, 0), (0, pad)),
                constant_values=-120.0
            )

        return matrix[-WINDOW_FRAMES:]

    except:
        return None


def predict(window, model, threshold, device):
    x = (window + 120.0) / 120.0
    x = np.clip(x, 0.0, 1.0)

    x = np.expand_dims(x, axis=0)
    x = np.expand_dims(x, axis=0)

    tensor = torch.tensor(x).to(device)

    with torch.no_grad():
        recon = model(tensor)
        error = torch.mean((tensor - recon) ** 2).item()

    status = "ANOMALY" if error > threshold else "NORMAL"

    return status, error


def write_state(status, score, threshold):
    payload = {
        "status": status,
        "score": score,
        "threshold": threshold,
        "timestamp": datetime.now().isoformat()
    }

    with open(STATE_PATH, "w") as f:
        json.dump(payload, f, indent=2)


def log_event(status, score):
    if status != "ANOMALY":
        return

    with open(EVENT_LOG, "a") as f:
        f.write(
            f"{datetime.now()} | {status} | score={score}\n"
        )


def start_capture():
    if os.path.exists(CSV_PATH):
        os.remove(CSV_PATH)

    cmd = [
        RTL_POWER,
        "-f", "314.5M:315.5M:976",
        "-i", "1",
        CSV_PATH
    ]

    return subprocess.Popen(cmd)


def main():
    print("Loading model...")
    model, threshold, device = load_model()

    print("Threshold:", threshold)

    print("Starting live RF capture...")
    proc = start_capture()

    try:
        while True:
            window = parse_live_csv()

            if window is None:
                time.sleep(2)
                continue

            status, score = predict(
                window,
                model,
                threshold,
                device
            )

            print(
                f"[{datetime.now()}] {status} | score={score:.10f}"
            )

            write_state(status, score, threshold)
            log_event(status, score)

            time.sleep(1)

    except KeyboardInterrupt:
        print("Stopping...")

    finally:
        proc.terminate()


if __name__ == "__main__":
    main()