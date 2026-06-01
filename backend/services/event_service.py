import json
import os

from backend.core.config import STATE_PATH, EVENT_PATH
from backend.services.intelligence_service import compute_intelligence


def load_state():
    if not os.path.exists(STATE_PATH):
        return {
            "status": "WAITING",
            "score": 0,
            "threshold": 0,
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

    return lines[:50]


def load_intelligence():
    state = load_state()

    if "intelligence" in state and state["intelligence"]:
        return state["intelligence"]

    return compute_intelligence(state)