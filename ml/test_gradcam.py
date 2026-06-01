import os
import torch
import torch.nn as nn
import matplotlib.pyplot as plt

from autoencoder import Autoencoder
from dataset_loader import SpectrogramDataset
from gradcam import GradCAM


# BASE PATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")


# LOAD MODEL
model = Autoencoder()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

criterion = nn.MSELoss()


# 🎯 Target layer (LAST encoder conv layer)
target_layer = model.encoder[-1]

gradcam = GradCAM(model, target_layer)


# LOAD ANOMALY SAMPLE
dataset = SpectrogramDataset("anomaly")
image, _ = dataset[0]
image = image.unsqueeze(0)


# FORWARD PASS
output = model(image)

# 🔥 IMPORTANT: Pixel-wise error
error_map = (output - image) ** 2


# GENERATE CAM
cam = gradcam.generate(image, error_map)


# ================== VISUALIZATION ==================

plt.figure(figsize=(12, 4))

# 1️⃣ Original
plt.subplot(1, 4, 1)
plt.title("Original")
plt.imshow(image.squeeze().detach(), cmap="inferno")

# 2️⃣ Reconstructed
plt.subplot(1, 4, 2)
plt.title("Reconstructed")
plt.imshow(output.squeeze().detach(), cmap="inferno")

# 3️⃣ Error Map 🔥 (MOST IMPORTANT)
plt.subplot(1, 4, 3)
plt.title("Error Map")
plt.imshow(error_map.squeeze().detach(), cmap="hot")

# 4️⃣ Grad-CAM
plt.subplot(1, 4, 4)
plt.title("Grad-CAM")
plt.imshow(cam, cmap="jet")

plt.tight_layout()
plt.show()