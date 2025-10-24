from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    ADMIN = "Admin"
    USER = "User"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    encrypted_password = Column(Text, nullable=False)
    password_hash = Column(String(255), nullable=True)  # For admin login
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class TokenStatus(enum.Enum):
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"

class AccessToken(Base):
    __tablename__ = "access_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token_string = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=False)  # Target user for password access
    admin_id = Column(Integer, nullable=False)  # Admin who generated the token
    duration_minutes = Column(Integer, nullable=False)
    status = Column(SQLEnum(TokenStatus), default=TokenStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    client_host = Column(String(45), nullable=True)  # IP address where token was used

class AuditAction(enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    TOKEN_GENERATED = "token_generated"
    TOKEN_USED = "token_used"
    PASSWORD_VIEWED = "password_viewed"
    USER_IMPORTED = "user_imported"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False)
    admin_id = Column(Integer, nullable=True)  # Admin who performed the action
    target_user_id = Column(Integer, nullable=True)  # User who was affected
    details = Column(Text, nullable=True)  # Additional details in JSON format
    client_host = Column(String(45), nullable=True)  # IP address
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())