from fastapi import APIRouter
from backend.services.event_service import load_events

router = APIRouter()

@router.get("/api/events")
def get_events():
    return {"events": load_events()}