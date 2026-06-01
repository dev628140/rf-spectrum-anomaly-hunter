from backend.db.db_service import db_service
from fastapi import APIRouter
import torch

from backend.services.service_container import (
    rf_state_service,
    inference_service
)

router = APIRouter()


def _get_autoencoder_reconstruction(window):
    autoencoder_entry = inference_service.registry.models[
        "autoencoder"
    ]

    model = autoencoder_entry["model"]
    device = autoencoder_entry["device"]

    min_val = window.min()
    max_val = window.max()

    normalized = (
        (window - min_val) /
        (max_val - min_val + 1e-8)
    )

    tensor = torch.tensor(
        normalized,
        dtype=torch.float32
    ).unsqueeze(0).unsqueeze(0).to(device)

    with torch.no_grad():
        reconstructed = model(tensor)

    reconstructed = (
        reconstructed
        .squeeze(0)
        .squeeze(0)
        .cpu()
        .numpy()
    )

    denormalized = (
        reconstructed * (max_val - min_val)
    ) + min_val

    return denormalized


def _validate_autoencoder(window):
    if window is None:
        return {
            "status": "WAITING"
        }

    if inference_service.current_model() != "autoencoder":
        return {
            "status": "UNAVAILABLE"
        }

    return None


@router.get("/api/rf/current")
def get_current_rf():
    current = rf_state_service.get_current()

    if current is None:
        return {
            "status": "WAITING",
            "window": None
        }

    return {
        "status": "OK",
        "window": current[::2]
    }


@router.get("/api/rf/reconstruction")
def get_reconstruction():
    window = rf_state_service.get_numpy_current()

    validation = _validate_autoencoder(window)
    if validation:
        if validation["status"] == "WAITING":
            return {
                "status": "WAITING",
                "reconstruction": None
            }

        return {
            "status": "UNAVAILABLE",
            "message": "Autoencoder required."
        }

    reconstructed = _get_autoencoder_reconstruction(window)

    return {
        "status": "OK",
        "reconstruction": reconstructed[::2, ::2].tolist()
    }


@router.get("/api/rf/error")
def get_error_heatmap():
    window = rf_state_service.get_numpy_current()

    validation = _validate_autoencoder(window)
    if validation:
        if validation["status"] == "WAITING":
            return {
                "status": "WAITING",
                "error_map": None
            }

        return {
            "status": "UNAVAILABLE",
            "message": "Autoencoder required."
        }

    reconstructed = _get_autoencoder_reconstruction(window)

    error_map = abs(window - reconstructed)

    return {
        "status": "OK",
        "error_map": error_map[::2, ::2].tolist()
    }


@router.get("/api/rf/hotspots")
def get_hotspots():
    window = rf_state_service.get_numpy_current()

    validation = _validate_autoencoder(window)
    if validation:
        if validation["status"] == "WAITING":
            return {
                "status": "WAITING",
                "hotspots": None
            }

        return {
            "status": "UNAVAILABLE",
            "message": "Autoencoder required."
        }

    reconstructed = _get_autoencoder_reconstruction(window)

    error_map = abs(window - reconstructed)

    flat_indices = error_map.flatten().argsort()[-10:][::-1]

    hotspots = []

    rows, cols = error_map.shape

    for idx in flat_indices:
        row = idx // cols
        col = idx % cols

        hotspots.append({
            "row": int(row),
            "col": int(col),
            "score": round(float(error_map[row, col]), 4)
        })

    peak = hotspots[0]

    return {
        "status": "OK",
        "max_error": peak["score"],
        "peak_location": {
            "row": peak["row"],
            "col": peak["col"]
        },
        "top_hotspots": hotspots
    }
@router.get("/api/rf/history")
def get_rf_history():
    history = rf_state_service.get_history()

    compressed = []

    for frame in history[-20:]:
        reduced = []

        for row in frame[::4]:
            reduced.append(row[::8])

        compressed.append(reduced)

    return {
        "status": "OK",
        "frames": compressed,
        "count": len(compressed)
    }
@router.get("/api/rf/analytics")
def get_rf_analytics():
    window = rf_state_service.get_numpy_current()

    if window is None:
        return {
            "status": "WAITING",
            "analytics": None
        }

    mean_power = float(window.mean())
    peak_power = float(window.max())
    min_power = float(window.min())
    dynamic_range = peak_power - min_power

    occupancy_threshold = mean_power + 1.5

    occupied_bins = (window > occupancy_threshold).sum()
    total_bins = window.size

    occupancy_percent = (
        occupied_bins / total_bins
    ) * 100.0

    analytics = {
        "mean_power": round(mean_power, 4),
        "peak_power": round(peak_power, 4),
        "min_power": round(min_power, 4),
        "dynamic_range": round(dynamic_range, 4),
        "occupancy_percent": round(
            float(occupancy_percent),
            2
        ),
        "total_bins": int(total_bins),
        "occupied_bins": int(occupied_bins)
    }
    db_service.create_rf_metric(
        mean_power=analytics["mean_power"],
        peak_power=analytics["peak_power"],
        min_power=analytics["min_power"],
        dynamic_range=analytics["dynamic_range"],
        occupancy_percent=analytics["occupancy_percent"]
    )
    return {
        "status": "OK",
        "analytics": analytics
    }