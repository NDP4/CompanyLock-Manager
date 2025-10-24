from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import os
import io
import json
from datetime import datetime

# Import models dan services
from app.database import get_db, create_tables
from app.models import User, UserRole, AccessToken, AuditLog, AuditAction
from app.services.auth_service import auth_service
from app.services.token_service import token_service
from app.services.encryption import encryption_service
from app.services.csv_service import csv_service

# Import routes
from app.routes import csv

# Pydantic models untuk request/response
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class GenerateTokenRequest(BaseModel):
    user_id: int
    duration_minutes: int = 30

class UseTokenRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    token: str
    expires_at: str
    duration_minutes: int
    user_id: int

# Initialize FastAPI app
app = FastAPI(
    title="CompanyLock Manager API",
    description="Sistem manajemen password karyawan dengan token akses",
    version="1.0.0"
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Register routes
app.include_router(csv.router, prefix="/api")

def get_client_host(request: Request) -> str:
    """Ambil IP address client"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency untuk memverifikasi admin yang sedang login"""
    token_data = auth_service.verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid"
        )
    
    user = db.query(User).filter(
        User.id == token_data["user_id"],
        User.role == UserRole.ADMIN,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin tidak ditemukan atau tidak aktif"
        )
    
    return user

@app.on_event("startup")
async def startup_event():
    """Inisialisasi saat aplikasi start"""
    create_tables()
    
    # Verifikasi encryption service
    if not encryption_service.verify_master_key():
        print("❌ Master key tidak berfungsi dengan baik!")
        exit(1)
    
    print("✅ CompanyLock Manager API berhasil diinisialisasi")
    print("✅ Master key encryption berfungsi normal")

# === AUTH ROUTES ===

@app.post("/api/auth/login")
async def login(
    request: LoginRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """Login admin"""
    user = auth_service.authenticate_admin(db, request.username, request.password)
    
    if not user:
        # Log failed login attempt
        audit_log = AuditLog(
            action=AuditAction.LOGIN,
            details=json.dumps({
                "username": request.username,
                "success": False,
                "reason": "Invalid credentials"
            }),
            client_host=get_client_host(http_request)
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    # Generate JWT token
    access_token = auth_service.create_admin_token(user)
    
    # Log successful login
    auth_service.log_login(
        db, user, 
        client_host=get_client_host(http_request),
        user_agent=http_request.headers.get("User-Agent")
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "must_change_password": user.must_change_password
        }
    }

@app.post("/api/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    http_request: Request,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ganti password admin"""
    # Verifikasi password lama (kecuali first login)
    if current_user.password_hash:
        if not auth_service.verify_password(request.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password lama tidak benar"
            )
    elif request.current_password != "admin123":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password default tidak benar"
        )
    
    # Ganti password
    success = auth_service.change_password(
        db, current_user, request.new_password,
        client_host=get_client_host(http_request)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mengganti password"
        )
    
    return {"message": "Password berhasil diubah"}

# === USER MANAGEMENT ROUTES ===

@app.get("/api/users")
async def get_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ambil daftar semua user"""
    users = db.query(User).all()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "department": user.department,
                "role": user.role.value,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            } for user in users
        ]
    }

@app.get("/api/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ambil detail user tertentu"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "department": user.department,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

# === TOKEN MANAGEMENT ROUTES ===

@app.post("/api/tokens/generate", response_model=TokenResponse)
async def generate_token(
    request: GenerateTokenRequest,
    http_request: Request,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate token akses untuk user"""
    # Validasi user target
    target_user = db.query(User).filter(User.id == request.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    # Validasi durasi
    max_duration = int(os.getenv("MAX_TOKEN_DURATION", "60"))
    if request.duration_minutes > max_duration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Durasi maksimal {max_duration} menit"
        )
    
    # Generate token
    token_result = token_service.generate_token(
        db=db,
        admin_id=current_user.id,
        user_id=request.user_id,
        duration_minutes=request.duration_minutes,
        client_host=get_client_host(http_request)
    )
    
    return TokenResponse(
        token=token_result["token"],
        expires_at=token_result["expires_at"].isoformat(),
        duration_minutes=token_result["duration_minutes"],
        user_id=token_result["user_id"]
    )

@app.post("/api/tokens/use")
async def use_token(
    request: UseTokenRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """Gunakan token untuk melihat password"""
    # Verifikasi token
    token_result = token_service.verify_token(
        db=db,
        token_string=request.token,
        client_host=get_client_host(http_request)
    )
    
    if not token_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=token_result["error"]
        )
    
    # Ambil user
    user = db.query(User).filter(User.id == token_result["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    # Dekripsi password
    try:
        decrypted_password = encryption_service.decrypt_password(user.encrypted_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mendekripsi password"
        )
    
    # Audit log
    audit_log = AuditLog(
        action=AuditAction.PASSWORD_VIEWED,
        admin_id=token_result["admin_id"],
        target_user_id=token_result["user_id"],
        details=json.dumps({
            "token_id": token_result["token_id"],
            "username": user.username
        }),
        client_host=get_client_host(http_request)
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "department": user.department
        },
        "password": decrypted_password
    }

# === CSV IMPORT/EXPORT ROUTES ===

@app.get("/api/csv/template")
async def download_template(
    current_user: User = Depends(get_current_admin)
):
    """Download template CSV untuk import karyawan"""
    csv_content = csv_service.generate_template()
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=template_karyawan.csv"}
    )

@app.post("/api/csv/import")
async def import_csv(
    file: UploadFile = File(...),
    http_request: Request = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Import karyawan dari CSV"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berformat CSV"
        )
    
    # Baca content file
    content = await file.read()
    csv_content = content.decode('utf-8')
    
    # Import
    result = csv_service.import_users(
        db=db,
        csv_content=csv_content,
        admin_id=current_user.id,
        client_host=get_client_host(http_request) if http_request else None
    )
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Import gagal")
        )
    
    return result

# === AUDIT LOG ROUTES ===

@app.get("/api/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ambil audit logs"""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "action": log.action.value,
                "admin_id": log.admin_id,
                "target_user_id": log.target_user_id,
                "details": json.loads(log.details) if log.details else None,
                "client_host": log.client_host,
                "created_at": log.created_at.isoformat() if log.created_at else None
            } for log in logs
        ]
    }

# === HEALTH CHECK ===

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "encryption_status": "ok" if encryption_service.verify_master_key() else "error"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)