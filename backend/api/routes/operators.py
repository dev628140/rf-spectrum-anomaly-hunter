from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional
from backend.db.db_service import db_service
from backend.db.database import SessionLocal
from backend.db.models.schema import AlertLog, Operator as DBOperator, AccessRequest

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


class AccessRequestCreate(BaseModel):
    username: str
    requested_feature: str


class AccessRequestUpdate(BaseModel):
    status: str  # APPROVED or DENIED


@router.get("/api/system/access-requests")
def get_access_requests(x_role: str = Header(default="guest")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    try:
        reqs = db_service.get_all_access_requests()
        return {
            "status": "SUCCESS",
            "data": [
                {
                    "id": r.id,
                    "timestamp": str(r.timestamp),
                    "username": r.username,
                    "requested_feature": r.requested_feature,
                    "status": r.status
                }
                for r in reqs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/system/access-requests")
def create_access_request(payload: AccessRequestCreate):
    db = SessionLocal()
    try:
        # Verify operator exists
        op = db.query(DBOperator).filter(DBOperator.username == payload.username.strip()).first()
        if not op:
            raise HTTPException(status_code=404, detail="Operator not found.")

        # Check if they already have this feature in their scope
        scopes = op.scope.split(",") if op.scope else []
        if payload.requested_feature in scopes:
            raise HTTPException(status_code=400, detail="Feature already cleared/permitted for this account.")

        # Check if there is already a pending request for this feature
        existing = db.query(AccessRequest).filter(
            AccessRequest.username == payload.username.strip(),
            AccessRequest.requested_feature == payload.requested_feature,
            AccessRequest.status == "PENDING"
        ).first()

        if existing:
            return {
                "status": "SUCCESS",
                "message": "Access request already pending for this feature.",
                "data": {
                    "id": existing.id,
                    "username": existing.username,
                    "requested_feature": existing.requested_feature,
                    "status": existing.status
                }
            }

        # Create new request
        req = db_service.create_access_request(
            username=payload.username.strip(),
            requested_feature=payload.requested_feature
        )

        # Create audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="WARNING",
            message=f"Operator '{op.name}' requested clearance for feature: '{payload.requested_feature}'."
        )

        return {
            "status": "SUCCESS",
            "message": "Access request submitted successfully.",
            "data": {
                "id": req.id,
                "username": req.username,
                "requested_feature": req.requested_feature,
                "status": req.status
            }
        }
    finally:
        db.close()


@router.put("/api/system/access-requests/{request_id}")
def update_access_request(request_id: int, payload: AccessRequestUpdate, x_role: str = Header(default="guest")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    
    db = SessionLocal()
    try:
        req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Access request not found.")

        if req.status != "PENDING":
            raise HTTPException(status_code=400, detail="Access request already processed.")

        # Update status
        req.status = payload.status.upper()
        
        # If approved, add feature to operator scope
        if req.status == "APPROVED":
            op = db.query(DBOperator).filter(DBOperator.username == req.username).first()
            if op:
                scopes = op.scope.split(",") if op.scope else []
                if req.requested_feature not in scopes:
                    scopes.append(req.requested_feature)
                    op.scope = ",".join(scopes)
                db.commit()
                
                # Log audit log
                db_service.create_alert_log(
                    channel="AUDIT",
                    status="SUCCESS",
                    message=f"Admin approved clearance for '{req.username}' to access '{req.requested_feature}'."
                )
        else:
            # Log audit log
            db_service.create_alert_log(
                channel="AUDIT",
                status="SUCCESS",
                message=f"Admin denied clearance for '{req.username}' to access '{req.requested_feature}'."
            )

        db.commit()
        return {
            "status": "SUCCESS",
            "message": f"Access request successfully {req.status.lower()}.",
            "data": {
                "id": req.id,
                "username": req.username,
                "requested_feature": req.requested_feature,
                "status": req.status
            }
        }
    finally:
        db.close()
