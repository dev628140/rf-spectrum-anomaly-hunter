import json
import os

from fastapi import APIRouter
from backend.core.config import HEALTH_PATH

router = APIRouter()


@router.get("/api/health")
def get_health():
    if not os.path.exists(HEALTH_PATH):
        return {
            "status": "runtime not started"
        }

    with open(HEALTH_PATH, "r") as f:
        return json.load(f)