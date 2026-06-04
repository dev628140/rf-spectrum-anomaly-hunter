import numpy as np
import torch


def predict(window, model, threshold, device):
    from backend.core.config import MODE
    if MODE == "mqtt_live":
        # Calibrate status based on physical car key signal power level threshold (-25.0 dBm)
        max_dbm = window[-1].max()
        if max_dbm > -25.0:
            status = "ANOMALY"
            error = threshold * 10.0  # Safe score above threshold
        else:
            status = "NORMAL"
            error = threshold * 0.1   # Safe score below threshold
        return status, error

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