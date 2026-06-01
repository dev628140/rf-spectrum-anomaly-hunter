import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from autoencoder import Autoencoder
from dataset_loader import SpectrogramDataset


# BASE PATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = "normal"
MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)


# LOAD DATASET
dataset = SpectrogramDataset(DATASET_PATH)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)


# DEVICE
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# MODEL
model = Autoencoder().to(device)


# LOSS + OPTIMIZER
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)


# TRAINING
EPOCHS = 20

for epoch in range(EPOCHS):

    total_loss = 0

    for data, target in dataloader:

        data = data.to(device)
        target = target.to(device)

        output = model(data)

        loss = criterion(output, target)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")


# SAVE MODEL
torch.save(model.state_dict(), MODEL_PATH)

print("Model saved at:", MODEL_PATH)