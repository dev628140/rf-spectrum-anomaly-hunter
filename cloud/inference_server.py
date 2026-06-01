import os
import json
from fastapi import FastAPI
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

LIVE_DIR = os.path.join(
    BASE_DIR,
    "live_runtime"
)

STATE_PATH = os.path.join(
    LIVE_DIR,
    "live_state.json"
)

LOG_PATH = os.path.join(
    LIVE_DIR,
    "recent_events.log"
)

EXPLAIN_PATH = os.path.join(
    LIVE_DIR,
    "latest_explainability.png"
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Final RF Runtime API Running"
    }


@app.get("/api/state")
def get_state():
    if not os.path.exists(STATE_PATH):
        return {
            "status": "NO DATA",
            "score": 0,
            "threshold": 0,
            "timestamp": "-"
        }

    with open(STATE_PATH, "r") as f:
        return json.load(f)


@app.get("/api/events")
def get_events():
    if not os.path.exists(LOG_PATH):
        return PlainTextResponse("No events yet")

    with open(LOG_PATH, "r") as f:
        lines = f.readlines()

    recent = "".join(lines[-20:])

    return PlainTextResponse(recent)


@app.get("/api/explainability")
def get_explainability():
    if not os.path.exists(EXPLAIN_PATH):
        return {"error": "No explainability image"}

    return FileResponse(
        EXPLAIN_PATH,
        media_type="image/png"
    )