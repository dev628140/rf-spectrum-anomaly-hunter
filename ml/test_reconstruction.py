import os
import torch
import matplotlib.pyplot as plt

from autoencoder import Autoencoder
from dataset_loader import SpectrogramDataset


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")


# LOAD MODEL
model = Autoencoder()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()


# LOAD DATA
dataset = SpectrogramDataset("normal")

image, _ = dataset[0]
image = image.unsqueeze(0)


# INFERENCE
with torch.no_grad():
    output = model(image)


# VISUALIZATION
plt.subplot(1, 2, 1)
plt.title("Original")
plt.imshow(image.squeeze(), cmap="inferno")

plt.subplot(1, 2, 2)
plt.title("Reconstructed")
plt.imshow(output.squeeze(), cmap="inferno")

plt.show()