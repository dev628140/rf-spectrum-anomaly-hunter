from backend.services.threat_classifier_service import (
    ThreatClassifierService
)


classifier = ThreatClassifierService()


SEVERITY_MAP = {
    "normal": "LOW",
    "jammer": "CRITICAL",
    "burst_attack": "HIGH",
    "wideband_interference": "HIGH",
    "spoofing": "CRITICAL"
}


SUMMARY_MAP = {
    "normal": "RF environment appears normal.",
    "jammer": "Continuous jamming signal detected.",
    "burst_attack": "Burst RF interference detected.",
    "wideband_interference": "Wideband interference detected.",
    "spoofing": "Potential spoofing activity detected."
}


def compute_intelligence(state):
    status = state.get("status", "NORMAL")

    if status == "NORMAL":
        return {
            "confidence": 99.0,
            "severity": "LOW",
            "threat_type": "normal",
            "summary": SUMMARY_MAP["normal"]
        }

    window = state.get("window")

    if window is None:
        return {
            "confidence": 0.0,
            "severity": "UNKNOWN",
            "threat_type": "unknown",
            "summary": "No RF window available for classification."
        }

    result = classifier.classify(window)

    threat = result["threat_type"]

    return {
        "confidence": result["confidence"],
        "severity": SEVERITY_MAP[threat],
        "threat_type": threat,
        "summary": SUMMARY_MAP[threat]
    }