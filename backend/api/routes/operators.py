from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional
from backend.db.db_service import db_service
from backend.db.database import SessionLocal
from backend.db.models.schema import AlertLog, Operator as DBOperator

router = APIRouter()

class OperatorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    level: str = Field(..., min_length=1)
    status: str = Field(..., min_length=1)
    scope: Optional[str] = None

class OperatorUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    level: str = Field(..., min_length=1)
    status: str = Field(..., min_length=1)
    scope: Optional[str] = None

@router.get("/api/system/operators")
def get_operators(x_role: str = Header(default="guest")):
    if x_role not in ["admin", "user"]:
        raise HTTPException(status_code=403, detail="Forbidden: Higher clearance level required.")
    try:
        operators = db_service.get_all_operators()
        return {
            "status": "SUCCESS",
            "data": [
                {
                    "id": op.id,
                    "name": op.name,
                    "role": op.role,
                    "level": op.level,
                    "status": op.status,
                    "avatar": op.avatar,
                    "color": op.color,
                    "scope": op.scope,
                    "username": op.username
                }
                for op in operators
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/system/operators")
def create_operator(payload: OperatorCreate, x_role: str = Header(default="guest")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    try:
        op = db_service.create_operator(
            name=payload.name,
            role=payload.role,
            level=payload.level,
            status=payload.status,
            scope=payload.scope
        )
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"Operator '{op.name}' provisioned with {op.level} credentials."
        )
        
        return {
            "status": "SUCCESS",
            "data": {
                "id": op.id,
                "name": op.name,
                "role": op.role,
                "level": op.level,
                "status": op.status,
                "avatar": op.avatar,
                "color": op.color,
                "scope": op.scope,
                "username": op.username
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/system/operators/{operator_id}")
def update_operator(operator_id: int, payload: OperatorUpdate, x_role: str = Header(default="guest")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    try:
        op = db_service.update_operator(
            operator_id=operator_id,
            name=payload.name,
            role=payload.role,
            level=payload.level,
            status=payload.status,
            scope=payload.scope
        )
        if not op:
            raise HTTPException(status_code=404, detail="Operator not found")
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"Operator '{op.name}' credentials updated to {op.level}."
        )
        
        return {
            "status": "SUCCESS",
            "data": {
                "id": op.id,
                "name": op.name,
                "role": op.role,
                "level": op.level,
                "status": op.status,
                "avatar": op.avatar,
                "color": op.color,
                "scope": op.scope,
                "username": op.username
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/system/operators/{operator_id}")
def delete_operator(operator_id: int, x_role: str = Header(default="guest")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    try:
        db = SessionLocal()
        op = db.query(DBOperator).filter(DBOperator.id == operator_id).first()
        op_name = op.name if op else f"ID {operator_id}"
        db.close()
        
        success = db_service.delete_operator(operator_id)
        if not success:
            raise HTTPException(status_code=404, detail="Operator not found")
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"Operator '{op_name}' credentials revoked/deleted from access governance."
        )
        
        return {
            "status": "SUCCESS",
            "message": "Operator credentials successfully revoked."
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/system/audits")
def get_audits(limit: int = 50, x_role: str = Header(default="guest")):
    if x_role not in ["admin", "user"]:
        raise HTTPException(status_code=403, detail="Forbidden: Higher clearance level required.")
    db = SessionLocal()
    try:
        rows = (
            db.query(AlertLog)
            .filter(AlertLog.channel == "AUDIT")
            .order_by(AlertLog.id.desc())
            .limit(limit)
            .all()
        )
        return {
            "status": "SUCCESS",
            "data": [
                {
                    "id": r.id,
                    "timestamp": str(r.timestamp),
                    "channel": r.channel,
                    "status": r.status,
                    "message": r.message
                }
                for r in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
