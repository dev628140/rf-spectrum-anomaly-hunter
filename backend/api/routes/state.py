from fastapi import APIRouter

from backend.services.event_service import (
    load_state
)

from backend.services.service_container import (
    rf_state_service
)

router = APIRouter()

rf_service = rf_state_service


@router.get("/api/state")
def get_state():

    """
    ====================================
    LOAD CORE AI STATE
    ====================================
    """

    state = load_state()

    """
    ====================================
    LOAD RF STATE
    ====================================
    """

    rf_payload = (
        rf_service.get_current()
    )

    if not rf_payload:

        rf_payload = {}

    """
    ====================================
    SAFE HISTORY
    ====================================
    """

    try:

        history = (
            rf_service.get_history()
        )

    except Exception:

        history = []

    """
    ====================================
    BUILD UNIFIED PAYLOAD
    ====================================
    """

    payload = {
        "meta": {
            "schema_version": "1.0",
            "backend": "ONLINE",
            "stream": "LIVE",
            "mode": "REPLAY"
        },
        "status": {
            "state": state.get("status", "UNKNOWN"),
            "score": state.get("score", 0),
            "threshold": state.get("threshold", 0),
            "active_model": state.get("active_model", "autoencoder")
        },
        "signal": {
            "shape": rf_payload.get("shape", []),
            "spectrum": rf_payload.get("spectrum", []),
            "spectral_profile": rf_payload.get("spectral_profile", []),
            "waterfall": rf_payload.get("waterfall", []),
            "metrics": rf_payload.get("metrics", {})
        },
        "explainability": rf_payload.get("explainability", {}),
        "intelligence": state.get("intelligence", {}),
        "history": {
            "waterfall": history
        }
    }


    return payload