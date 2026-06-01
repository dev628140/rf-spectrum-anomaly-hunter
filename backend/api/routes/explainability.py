from fastapi import APIRouter

from backend.services.event_service import load_intelligence
from backend.services.service_container import rf_state_service
from backend.api.routes.rf import get_hotspots

router = APIRouter()


ACTION_MAP = {
    "normal": "No immediate action required.",
    "jammer": (
        "Investigate possible intentional jamming. "
        "Check nearby transmitters."
    ),
    "burst_attack": (
        "Inspect intermittent RF interference source."
    ),
    "wideband_interference": (
        "Review wideband interference conditions."
    ),
    "spoofing": (
        "Inspect RF source and verify signal authenticity."
    ),
    "unknown": (
        "Manual operator investigation recommended."
    )
}


@router.get("/api/intelligence/explain")
def explain_intelligence():
    intel = load_intelligence()

    threat = intel["threat_type"]
    severity = intel["severity"]
    confidence = intel["confidence"]

    hotspot_info = get_hotspots()

    hotspot_text = "No hotspot data available."

    if hotspot_info.get("status") == "OK":
        peak = hotspot_info["peak_location"]

        hotspot_text = (
            f"Primary anomaly concentrated near "
            f"row {peak['row']} / col {peak['col']}."
        )

    technical_summary = (
        "Strong deviation from learned normal RF baseline "
        "observed."
    )

    if threat == "normal":
        technical_summary = (
            "Observed RF behavior aligns with learned "
            "normal operating conditions."
        )

    impact = (
        f"{severity} threat level. "
        f"Detection confidence: {confidence}%."
    )

    features_by_threat = {
        "normal": [
            {"name": "normal_baseline_deviation", "importance": 0.82},
            {"name": "spectral_flatness", "importance": 0.64},
            {"name": "bandwidth_occupancy_rise", "importance": 0.52}
        ],
        "jammer": [
            {"name": "narrowband_spike", "importance": 0.95},
            {"name": "average_power_rise", "importance": 0.78},
            {"name": "spectral_spikiness", "importance": 0.62}
        ],
        "burst_attack": [
            {"name": "transient_pulse", "importance": 0.88},
            {"name": "peak_power_deviation", "importance": 0.74},
            {"name": "occupancy_ratio", "importance": 0.48}
        ],
        "wideband_interference": [
            {"name": "wideband_flatness", "importance": 0.91},
            {"name": "average_power_shift", "importance": 0.82},
            {"name": "channel_occupancy", "importance": 0.69}
        ],
        "spoofing": [
            {"name": "signal_power_profile", "importance": 0.94},
            {"name": "carrier_frequency_offset", "importance": 0.81},
            {"name": "envelope_correlation", "importance": 0.55}
        ]
    }

    top_features = features_by_threat.get(threat, features_by_threat["normal"])

    return {
        "status": "OK",
        "explanation": {
            "headline": intel["summary"],
            "technical_summary": technical_summary,
            "impact": impact,
            "peak_hotspot": hotspot_text,
            "recommended_action": ACTION_MAP.get(
                threat,
                ACTION_MAP["unknown"]
            ),
            "top_features": top_features,
            "confidence": confidence
        }
    }