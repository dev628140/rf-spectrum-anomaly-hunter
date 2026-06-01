from fastapi import APIRouter
from backend.services.event_service import load_intelligence

router = APIRouter()

@router.get("/api/intelligence")
def get_intelligence():
    return load_intelligence()