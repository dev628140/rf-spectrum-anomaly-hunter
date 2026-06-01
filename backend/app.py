from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import sys
import os

# Ensure project root is in path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.ws.live_stream import router as ws_router

from backend.api.routes.health import router as health_router
from backend.api.routes.rf import router as rf_router
from backend.api.routes.state import router as state_router
from backend.api.routes.events import router as events_router
from backend.api.routes.explainability import router as explain_router
from backend.api.routes.history import router as history_router
from backend.api.routes.intelligence import router as intel_router
from backend.api.routes.model import router as model_router


app = FastAPI(title="RF Threat Intelligence Platform API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTER WEBSOCKET ROUTER
app.include_router(ws_router)

# REGISTER API ROUTERS
app.include_router(health_router)
app.include_router(rf_router)
app.include_router(state_router)
app.include_router(events_router)
app.include_router(explain_router)
app.include_router(history_router)
app.include_router(intel_router)
app.include_router(model_router, prefix="/api/model")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "RF Threat Intelligence Platform API Online"
    }

def run_edge_runtime():
    print("[EDGE RUNTIME] Initializing edge ingestion loop...")
    try:
        from edge.runtime.edge_runtime import EdgeRuntime
        runtime = EdgeRuntime()
        runtime.start()
        runtime.run()
    except Exception as err:
        print(f"[EDGE RUNTIME] Background thread encountered an error: {err}")

@app.on_event("startup")
def startup_event():
    print("[BACKEND] Spawning Edge Ingestion Runtime in background thread...")
    t = threading.Thread(target=run_edge_runtime, daemon=True)
    t.start()
    print("[BACKEND] Edge Ingestion Runtime thread running.")