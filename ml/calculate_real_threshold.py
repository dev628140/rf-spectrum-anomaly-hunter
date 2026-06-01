import os
import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt

from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_ROOT = os.path.join(BASE_DIR, "dataset")
MODEL_PATH = os.path.join(BASE_DIR, "models", "real_autoencoder.pth")
THRESHOLD_PATH = os.path.join(BASE_DIR, "models", "threshold.txt")
HISTOGRAM_PATH = os.path.join(
    BASE_DIR,
    "real_data_pipeline",
    "error_histogram.png"
)


class Autoencoder(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1),
            nn.ReLU(),

            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),

            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
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
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded


transform = transforms.Compose([
    transforms.Grayscale(),
    transforms.ToTensor()
])


dataset = datasets.ImageFolder(
    root=DATASET_ROOT,
    transform=transform
)


normal_indices = []

for i, (_, label) in enumerate(dataset.samples):
    if dataset.classes[label] == "normal":
        normal_indices.append(i)


normal_subset = Subset(dataset, normal_indices)

loader = DataLoader(
    normal_subset,
    batch_size=1,
    shuffle=False
)


device = torch.device("cpu")

model = Autoencoder().to(device)

model.load_state_dict(
    torch.load(MODEL_PATH, map_location=device)
)

model.eval()


errors = []


with torch.no_grad():
    for images, _ in loader:
        images = images.to(device)

        outputs = model(images)

        mse = torch.mean(
            (images - outputs) ** 2
        ).item()

        errors.append(mse)


errors = np.array(errors)

mean_error = np.mean(errors)
std_error = np.std(errors)

threshold = mean_error + (3 * std_error)


with open(THRESHOLD_PATH, "w") as f:
    f.write(str(threshold))


plt.figure(figsize=(10, 6))

plt.hist(
    errors,
    bins=20
)

plt.axvline(
    threshold,
    linestyle="--",
    linewidth=2
)

plt.title("Normal Reconstruction Error Distribution")
plt.xlabel("Reconstruction Error")
plt.ylabel("Sample Count")

plt.tight_layout()

plt.savefig(HISTOGRAM_PATH)

plt.close()


print("Mean Error:", mean_error)
print("Std Error:", std_error)
print("Threshold:", threshold)

print("\nSaved:")
print(THRESHOLD_PATH)
print(HISTOGRAM_PATH)