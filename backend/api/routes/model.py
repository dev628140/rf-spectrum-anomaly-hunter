from fastapi import APIRouter
from pydantic import BaseModel

from backend.services.service_container import inference_service
from backend.db.db_service import db_service

router = APIRouter()


class ModelSelectionRequest(BaseModel):
    model: str


@router.post("/select")
def select_model(request: ModelSelectionRequest):
    previous_model = inference_service.current_model()

    if previous_model == request.model:
        return {
            "message": "Model already active",
            "current_model": request.model
        }

    inference_service.switch_model(request.model)

    db_service.create_model_switch(
        from_model=previous_model,
        to_model=request.model
    )

    return {
        "message": "Model switched successfully",
        "current_model": request.model
    }