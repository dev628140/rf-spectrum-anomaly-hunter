import os
import time
import torch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from ml_model import Autoencoder   # IMPORTANT


MODEL_PATH = "../models/real_autoencoder.pth"
CSV_PATH = "../real_data_pipeline/anomaly_attack.csv"
OUTPUT_DIR = "../real_data_pipeline"

device = torch.device("cpu")


def preprocess_rf_matrix(matrix):
    matrix = matrix.astype(np.float32)

    min_val = matrix.min()
    max_val = matrix.max()

    matrix = (matrix - min_val) / (max_val - min_val + 1e-8)

    tensor = torch.tensor(matrix).unsqueeze(0).unsqueeze(0)

    return tensor


model = Autoencoder()
model.load_state_dict(
    torch.load(MODEL_PATH, map_location=device)
)
model.eval()


df = pd.read_csv(CSV_PATH, header=None)

power = df.iloc[:, 6:].apply(
    pd.to_numeric,
    errors="coerce"
)

power = power.replace(
    [np.inf, -np.inf],
    np.nan
)

power = power.fillna(
    power.median()
)

power = power.values

rf_window = power[:64]

tensor = preprocess_rf_matrix(rf_window)

with torch.no_grad():
    reconstructed = model(tensor)

input_img = tensor.squeeze().numpy()
recon_img = reconstructed.squeeze().numpy()

# force same dimensions
target_h, target_w = input_img.shape

recon_img = recon_img[:target_h, :target_w]

error_map = np.abs(input_img - recon_img)

# suppress weak reconstruction texture
row_median = np.median(error_map, axis=1, keepdims=True)
error_map = np.maximum(error_map - row_median, 0)

# suppress edge artifacts
margin = 60
error_map[:, :margin] = 0
error_map[:, -margin:] = 0

# keep only strongest hotspots
hotspot_thresh = np.percentile(error_map[error_map > 0], 95)

error_map[error_map < hotspot_thresh] = 0

vmax = np.max(error_map)

timestamp = str(int(time.time()))

save_path = os.path.join(
    OUTPUT_DIR,
    f"real_xai_{timestamp}.png"
)

plt.figure(figsize=(18, 10))

plt.subplot(2, 2, 1)
plt.imshow(input_img, aspect='auto', cmap='viridis')
plt.title("Original RF Spectrogram")
plt.colorbar()

plt.subplot(2, 2, 2)
plt.imshow(recon_img, aspect='auto', cmap='viridis')
plt.title("AI Reconstruction")
plt.colorbar()

plt.subplot(2, 2, 3)
plt.imshow(
    error_map,
    aspect='auto',
    cmap='hot',
    vmin=0,
    vmax=vmax
)
plt.title("Reconstruction Error Hotspots")
plt.colorbar()

plt.subplot(2, 2, 4)
plt.imshow(input_img, aspect='auto', cmap='gray')
plt.imshow(
    error_map,
    aspect='auto',
    cmap='hot',
    alpha=0.6,
    vmin=0,
    vmax=vmax
)
plt.title("Anomaly Localization Overlay")
plt.colorbar()

plt.tight_layout()
plt.savefig(save_path, dpi=220)
plt.close()

print(save_path)