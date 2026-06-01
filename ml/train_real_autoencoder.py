import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_ROOT = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "real_autoencoder.pth")

os.makedirs(MODEL_DIR, exist_ok=True)


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
    class_name = dataset.classes[label]

    if class_name == "normal":
        normal_indices.append(i)


normal_subset = Subset(dataset, normal_indices)


loader = DataLoader(
    normal_subset,
    batch_size=16,
    shuffle=True
)


device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)

model = Autoencoder().to(device)

criterion = nn.MSELoss()

optimizer = optim.Adam(
    model.parameters(),
    lr=0.001
)

EPOCHS = 60


for epoch in range(EPOCHS):
    total_loss = 0

    for images, _ in loader:
        images = images.to(device)

        outputs = model(images)

        loss = criterion(outputs, images)

        optimizer.zero_grad()

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    avg_loss = total_loss / len(loader)

    print(
        f"Epoch {epoch+1}/{EPOCHS} | Loss: {avg_loss:.6f}"
    )


torch.save(
    model.state_dict(),
    MODEL_PATH
)

print("\nTRAINING COMPLETE")
print("Model saved to:")
print(MODEL_PATH)