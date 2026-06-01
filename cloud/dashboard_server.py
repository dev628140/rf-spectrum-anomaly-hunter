import os
import json
from collections import deque
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE_DIR = os.path.join(BASE_DIR, "live_runtime")

STATE_PATH = os.path.join(LIVE_DIR, "live_state.json")
EVENT_PATH = os.path.join(LIVE_DIR, "recent_events.log")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR),
    name="static"
)


def load_state():
    if not os.path.exists(STATE_PATH):
        return {
            "status": "WAITING",
            "score": 0.0,
            "threshold": 0.0,
            "timestamp": "No live data"
        }

    with open(STATE_PATH, "r") as f:
        return json.load(f)


def load_events():
    if not os.path.exists(EVENT_PATH):
        return []

    with open(EVENT_PATH, "r") as f:
        lines = f.readlines()

    lines = [x.strip() for x in lines if x.strip()]
    lines.reverse()

    return lines[:100]


def extract_score(line):
    try:
        if "Score=" in line:
            return float(line.split("Score=")[1])

        if "score=" in line:
            return float(line.split("score=")[1])

    except:
        return 0.0

    return 0.0


def compute_intelligence(state):
    score = state.get("score", 0.0)
    threshold = state.get("threshold", 1e-6)

    ratio = score / threshold if threshold else 0

    confidence = min(ratio * 10, 99.9)

    if ratio > 500:
        severity = "CRITICAL"
    elif ratio > 100:
        severity = "HIGH"
    elif ratio > 20:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    if ratio > 300:
        threat_type = "Burst RF Attack"
    elif ratio > 150:
        threat_type = "Pulse Interference"
    elif ratio > 50:
        threat_type = "Continuous Carrier"
    else:
        threat_type = "Unknown Signature"

    summary = (
        f"{threat_type} detected significantly above learned RF baseline."
    )

    return {
        "confidence": round(confidence, 1),
        "severity": severity,
        "threat_type": threat_type,
        "summary": summary
    }


def compute_analytics(events):
    anomaly = 0
    normal = 0

    trend = deque(maxlen=30)

    normal_scores = []
    anomaly_scores = []

    ordered = list(reversed(events))

    for idx, evt in enumerate(ordered):
        score = extract_score(evt)

        trend.append({
            "t": str(idx + 1),
            "score": score
        })

        if "ANOMALY" in evt:
            anomaly += 1
            anomaly_scores.append(score)
        else:
            normal += 1
            normal_scores.append(score)

    return {
        "trend": list(trend),
        "distribution": [
            {"name": "Normal", "count": normal},
            {"name": "Anomaly", "count": anomaly}
        ],
        "stats": {
            "normal_count": normal,
            "anomaly_count": anomaly,
            "avg_normal_score": (
                sum(normal_scores) / len(normal_scores)
                if normal_scores else 0
            ),
            "avg_anomaly_score": (
                sum(anomaly_scores) / len(anomaly_scores)
                if anomaly_scores else 0
            )
        }
    }


@app.get("/")
def root():
    return {"status": "dashboard api online"}


@app.get("/api/state")
def api_state():
    return load_state()


@app.get("/api/events")
def api_events():
    return {"events": load_events()}


@app.get("/api/intelligence")
def api_intelligence():
    return compute_intelligence(load_state())


@app.get("/api/analytics")
def api_analytics():
    return compute_analytics(load_events())


@app.get("/api/telemetry")
def api_telemetry():
    return {
        "rtl_sdr": "EDGE READY",
        "raspberry_pi": "STANDBY",
        "ai_engine": "ACTIVE",
        "api_server": "ONLINE",
        "signal_source": "SIMULATION"
    }