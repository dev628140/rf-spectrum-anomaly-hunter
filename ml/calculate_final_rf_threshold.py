import os
import glob
import numpy as np
import torch
import torch.nn as nn
from tqdm import tqdm


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "real_rf_dataset", "processed", "normal")
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


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = Autoencoder().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

files = glob.glob(os.path.join(DATASET_DIR, "*.npz"))

errors = []

print("Processing normal dataset for threshold calibration...")

with torch.no_grad():
    for file in tqdm(files):
        data = np.load(file)
        x = data["rf_window"].astype(np.float32)

        x = (x + 120.0) / 120.0
        x = np.clip(x, 0.0, 1.0)

        x = np.expand_dims(x, axis=0)
        x = np.expand_dims(x, axis=0)

        tensor = torch.tensor(x).to(device)

        recon = model(tensor)

        error = torch.mean((tensor - recon) ** 2).item()

        errors.append(error)

errors = np.array(errors)

mean = np.mean(errors)
std = np.std(errors)

threshold = mean + (3 * std)

print("\nCalibration complete")
print("Mean:", mean)
print("Std:", std)
print("Threshold:", threshold)

with open(THRESHOLD_PATH, "w") as f:
    f.write(str(threshold))

print("\nSaved to:")
print(THRESHOLD_PATH)