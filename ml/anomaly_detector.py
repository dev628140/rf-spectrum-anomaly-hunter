import os
import torch
import torch.nn as nn

from autoencoder import Autoencoder


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")


# LOAD MODEL
model = Autoencoder()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()


criterion = nn.MSELoss()


def detect(image, threshold=0.00013620215689175266):

    with torch.no_grad():

        output = model(image)

        loss = criterion(output, image)

        if loss.item() > threshold:
            return "ANOMALY", loss.item()
        else:
            return "NORMAL", loss.item()