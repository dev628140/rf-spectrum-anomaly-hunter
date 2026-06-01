import torch

from anomaly_detector import detect
from dataset_loader import SpectrogramDataset


# Load anomaly dataset
dataset = SpectrogramDataset("anomaly")

# Take one sample
image, _ = dataset[0]

# Add batch dimension
image = image.unsqueeze(0)

# Detect anomaly
result, score = detect(image)

print("Result:", result)
print("Score:", score)