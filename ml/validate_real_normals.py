import os
import torch
import torch.nn as nn
import matplotlib.pyplot as plt

from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_ROOT = os.path.join(BASE_DIR, "dataset")
MODEL_PATH = os.path.join(BASE_DIR, "models", "real_autoencoder.pth")
THRESHOLD_PATH = os.path.join(BASE_DIR, "models", "threshold.txt")

PLOT_PATH = os.path.join(
    BASE_DIR,
    "real_data_pipeline",
    "normal_scores.png"
)

RESULT_PATH = os.path.join(
    BASE_DIR,
    "real_data_pipeline",
    "normal_validation.txt"
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


with open(THRESHOLD_PATH, "r") as f:
    threshold = float(f.read().strip())


device = torch.device("cpu")

model = Autoencoder().to(device)

model.load_state_dict(
    torch.load(MODEL_PATH, map_location=device)
)

model.eval()


scores = []

false_positives = 0


with torch.no_grad():
    for images, _ in loader:
        images = images.to(device)

        outputs = model(images)

        mse = torch.mean(
            (images - outputs) ** 2
        ).item()

        scores.append(mse)

        if mse > threshold:
            false_positives += 1


total = len(scores)

true_negatives = total - false_positives

specificity = (true_negatives / total) * 100


with open(RESULT_PATH, "w") as f:
    f.write(f"Threshold: {threshold}\n")
    f.write(f"Total normals: {total}\n")
    f.write(f"True negatives: {true_negatives}\n")
    f.write(f"False positives: {false_positives}\n")
    f.write(f"Specificity: {specificity:.2f}%\n")


plt.figure(figsize=(12, 6))

plt.plot(scores)

plt.axhline(
    threshold,
    linestyle="--",
    linewidth=2
)

plt.title("Normal Reconstruction Scores")
plt.xlabel("Normal Sample Index")
plt.ylabel("Reconstruction Error")

plt.tight_layout()
plt.savefig(PLOT_PATH)
plt.close()


print("Threshold:", threshold)
print("Total normals:", total)
print("True negatives:", true_negatives)
print("False positives:", false_positives)
print("Specificity:", f"{specificity:.2f}%")

print("\nSaved:")
print(PLOT_PATH)
print(RESULT_PATH)