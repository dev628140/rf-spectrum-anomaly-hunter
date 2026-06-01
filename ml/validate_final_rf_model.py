import os
import glob
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NORMAL_DIR = os.path.join(BASE_DIR, "real_rf_dataset", "processed", "normal")
ANOMALY_DIR = os.path.join(BASE_DIR, "real_rf_dataset", "processed", "anomaly")

MODEL_PATH = os.path.join(BASE_DIR, "models", "final_rf_autoencoder.pth")
THRESHOLD_PATH = os.path.join(BASE_DIR, "models", "final_rf_threshold.txt")


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


def predict(folder, true_label, model, threshold, device):
    files = glob.glob(os.path.join(folder, "*.npz"))

    y_true = []
    y_pred = []

    with torch.no_grad():
        for file in files:
            data = np.load(file)

            x = data["rf_window"].astype(np.float32)

            x = (x + 120.0) / 120.0
            x = np.clip(x, 0.0, 1.0)

            x = np.expand_dims(x, axis=0)
            x = np.expand_dims(x, axis=0)

            tensor = torch.tensor(x).to(device)

            recon = model(tensor)

            error = torch.mean((tensor - recon) ** 2).item()

            pred = 1 if error > threshold else 0

            y_true.append(true_label)
            y_pred.append(pred)

    return y_true, y_pred


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = Autoencoder().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

with open(THRESHOLD_PATH, "r") as f:
    threshold = float(f.read().strip())

print("Threshold:", threshold)

normal_true, normal_pred = predict(
    NORMAL_DIR,
    0,
    model,
    threshold,
    device
)

anomaly_true, anomaly_pred = predict(
    ANOMALY_DIR,
    1,
    model,
    threshold,
    device
)

y_true = normal_true + anomaly_true
y_pred = normal_pred + anomaly_pred

print("\nCONFUSION MATRIX")
print(confusion_matrix(y_true, y_pred))

print("\nCLASSIFICATION REPORT")
print(classification_report(y_true, y_pred))