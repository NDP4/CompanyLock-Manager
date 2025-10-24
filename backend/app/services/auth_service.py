from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import User, UserRole, AuditLog, AuditAction
import os
import json

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

class AuthService:
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifikasi password dengan hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def authenticate_admin(db: Session, username: str, password: str) -> Optional[User]:
        """
        Autentikasi admin user
        """
        user = db.query(User).filter(
            User.username == username,
            User.role == UserRole.ADMIN,
            User.is_active == True
        ).first()
        
        if not user:
            return None
        
        if not user.password_hash:
            # First time login, check default password
            if password == "admin123":
                return user
            else:
                return None
        
        if AuthService.verify_password(password, user.password_hash):
            return user
        
        return None
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Buat JWT access token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verifikasi JWT token
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            if username is None or user_id is None:
                return None
            return {"username": username, "user_id": user_id}
        except JWTError:
            return None
    
    @staticmethod
    def change_password(db: Session, user: User, new_password: str, client_host: Optional[str] = None) -> bool:
        """
        Ganti password admin
        """
        try:
            # Hash password baru
            hashed_password = AuthService.get_password_hash(new_password)
            
            # Update user
            user.password_hash = hashed_password
            user.must_change_password = False
            
            # Audit log
            audit_log = AuditLog(
                action=AuditAction.PASSWORD_CHANGE,
                admin_id=user.id,
                target_user_id=user.id,
                details=json.dumps({
                    "first_time_change": not bool(user.password_hash)
                }),
                client_host=client_host
            )
            db.add(audit_log)
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
    
    @staticmethod
    def create_admin_token(user: User) -> str:
        """
        Buat token untuk admin yang sudah terautentikasi
        """
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": user.username, "user_id": user.id, "role": user.role.value},
            expires_delta=access_token_expires
        )
        return access_token
    
    @staticmethod
    def log_login(db: Session, user: User, client_host: Optional[str] = None, user_agent: Optional[str] = None):
        """
        Log aktivitas login
        """
        audit_log = AuditLog(
            action=AuditAction.LOGIN,
            admin_id=user.id,
            target_user_id=user.id,
            details=json.dumps({
                "username": user.username,
                "role": user.role.value
            }),
            client_host=client_host,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()

# Instance global
auth_service = AuthService()