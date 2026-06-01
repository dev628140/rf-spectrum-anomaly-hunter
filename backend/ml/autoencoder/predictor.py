import numpy as np
import torch


def predict(window, model, threshold, device):
    x = (window + 120.0) / 120.0
    x = np.clip(x, 0.0, 1.0)

    x = np.expand_dims(x, axis=0)
    x = np.expand_dims(x, axis=0)

    tensor = torch.tensor(x).to(device)

    with torch.no_grad():
        recon = model(tensor)
        error = torch.mean(
            (tensor - recon) ** 2
        ).item()

    status = "ANOMALY" if error > threshold else "NORMAL"

    return status, error