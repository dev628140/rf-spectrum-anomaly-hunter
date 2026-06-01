import os
import glob
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "real_rf_dataset", "processed", "normal")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "final_rf_autoencoder.pth")

os.makedirs(MODEL_DIR, exist_ok=True)


class RFDataset(Dataset):
    def __init__(self, folder):
        self.files = glob.glob(os.path.join(folder, "*.npz"))

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        data = np.load(self.files[idx])
        x = data["rf_window"].astype(np.float32)

        # normalize dB values
        x = (x + 120.0) / 120.0
        x = np.clip(x, 0.0, 1.0)

        x = np.expand_dims(x, axis=0)

        return torch.tensor(x)


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

    # crop decoder output to exact RF tensor size
        out = out[:, :, :64, :1025]

        return out


dataset = RFDataset(DATASET_DIR)

loader = DataLoader(
    dataset,
    batch_size=16,
    shuffle=True
)

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)
print("Training samples:", len(dataset))

model = Autoencoder().to(device)

criterion = nn.MSELoss()

optimizer = optim.Adam(
    model.parameters(),
    lr=0.001
)

EPOCHS = 80

for epoch in range(EPOCHS):
    total_loss = 0

    for batch in loader:
        batch = batch.to(device)

        recon = model(batch)

        loss = criterion(recon, batch)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg = total_loss / len(loader)

    print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {avg:.6f}")

torch.save(model.state_dict(), MODEL_PATH)

print("\nFINAL MODEL SAVED:")
print(MODEL_PATH)