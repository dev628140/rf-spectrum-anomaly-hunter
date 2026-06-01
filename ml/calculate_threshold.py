import os
import torch
import torch.nn as nn
import numpy as np

from autoencoder import Autoencoder
from dataset_loader import SpectrogramDataset


# ✅ BASE PATH FIX
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")


# Load model
model = Autoencoder()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

criterion = nn.MSELoss()

# Load NORMAL dataset
dataset = SpectrogramDataset("normal")

errors = []

for i in range(len(dataset)):

    image, _ = dataset[i]
    image = image.unsqueeze(0)

    with torch.no_grad():
        output = model(image)
        loss = criterion(output, image)

    errors.append(loss.item())


# Compute statistics
mean = np.mean(errors)
std = np.std(errors)

threshold = mean + 3 * std

print("Mean:", mean)
print("Std:", std)
print("Threshold:", threshold)