from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from backend.db.database import SessionLocal
from backend.db.models.schema import Operator
from backend.db.db_service import db_service

router = APIRouter(prefix="/api/auth")

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str
    name: str
    role: str
    level: str
    scope: Optional[str] = ""

class ProfileUpdateRequest(BaseModel):
    username: str
    name: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str

@router.post("/login")
def login(payload: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(Operator).filter(
            Operator.username == payload.username.strip(),
            Operator.password == payload.password.strip()
        ).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password.")
            
        return {
            "status": "SUCCESS",
            "user": {
                "username": user.username,
                "name": user.name,
                "role": user.role,
                "level": user.level,
                "status": user.status,
                "avatar": user.avatar,
                "color": user.color,
                "scope": user.scope
            }
        }
    finally:
        db.close()

@router.post("/signup")
def signup(payload: SignupRequest):
    db = SessionLocal()
    try:
        # Check if username exists
        existing = db.query(Operator).filter(Operator.username == payload.username.strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists.")
            
        op = db_service.create_operator(
            name=payload.name,
            role=payload.role,
            level=payload.level,
            status="ACTIVE",
            scope=payload.scope,
            username=payload.username.strip(),
            password=payload.password.strip()
        )
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"New operator '{op.name}' signed up with {op.level} credentials."
        )
        
        return {
            "status": "SUCCESS",
            "user": {
                "username": op.username,
                "name": op.name,
                "role": op.role,
                "level": op.level,
                "status": op.status,
                "avatar": op.avatar,
                "color": op.color,
                "scope": op.scope
            }
        }
    finally:
        db.close()

@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest):
    db = SessionLocal()
    try:
        user = db.query(Operator).filter(Operator.username == payload.username.strip()).first()
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")
            
        user.name = payload.name
        if payload.new_username:
            new_u = payload.new_username.strip()
            if new_u != user.username:
                existing = db.query(Operator).filter(Operator.username == new_u).first()
                if existing:
                    raise HTTPException(status_code=400, detail="New username already taken.")
                user.username = new_u
                
        if payload.new_password:
            user.password = payload.new_password.strip()
            
        # Recalculate avatar and color
        initials = "".join([part[0] for part in user.name.split() if part])[:2].upper()
        user.avatar = initials if initials else "OP"
        colors = {
            "Level 5 (ROOT)": "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
            "Level 4 (SEC_ADMIN)": "border-purple-500/30 text-purple-300 bg-purple-500/10",
            "Level 3 (OPERATOR)": "border-teal-500/30 text-teal-300 bg-teal-500/10",
            "Level 2 (ANALYST)": "border-blue-500/30 text-blue-300 bg-blue-500/10",
            "Level 1 (GUEST)": "border-slate-500/30 text-slate-400 bg-slate-500/5",
        }
        user.color = colors.get(user.level, "border-cyan-500/30 text-cyan-300 bg-cyan-500/10")
        
        db.commit()
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"Operator '{user.name}' updated profile details."
        )
        
        return {
            "status": "SUCCESS",
            "user": {
                "username": user.username,
                "name": user.name,
                "role": user.role,
                "level": user.level,
                "status": user.status,
                "avatar": user.avatar,
                "color": user.color,
                "scope": user.scope
            }
        }
    finally:
        db.close()

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    db = SessionLocal()
    try:
        user = db.query(Operator).filter(Operator.username == payload.username.strip()).first()
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")
            
        user.password = payload.new_password.strip()
        db.commit()
        
        # Log audit log
        db_service.create_alert_log(
            channel="AUDIT",
            status="SUCCESS",
            message=f"Operator '{user.name}' password reset successfully."
        )
        
        return {
            "status": "SUCCESS",
            "message": "Password reset successfully."
        }
    finally:
        db.close()
