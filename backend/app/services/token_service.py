from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hmac
import hashlib
import base64
import secrets
import json
from sqlalchemy.orm import Session
from app.models import AccessToken, TokenStatus, User, AuditLog, AuditAction

class TokenService:
    def __init__(self):
        # HMAC secret untuk signing token
        self.hmac_secret = self._get_hmac_secret()
    
    def _get_hmac_secret(self) -> bytes:
        """
        Ambil HMAC secret dari environment atau generate
        """
        import os
        secret = os.getenv("TOKEN_HMAC_SECRET")
        if secret:
            return base64.b64decode(secret)
        else:
            # Generate untuk development
            secret_bytes = secrets.token_bytes(32)
            print("⚠️  TOKEN_HMAC_SECRET tidak ditemukan. Generated temporary secret")
            print("   Set TOKEN_HMAC_SECRET environment variable untuk production")
            return secret_bytes
    
    def generate_token(self, 
                      db: Session, 
                      admin_id: int, 
                      user_id: int, 
                      duration_minutes: int,
                      client_host: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate access token untuk user tertentu
        """
        # Buat payload token
        expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        token_payload = {
            "user_id": user_id,
            "admin_id": admin_id,
            "expires_at": expires_at.isoformat(),
            "nonce": secrets.token_hex(16)
        }
        
        # Serialize dan sign dengan HMAC
        payload_json = json.dumps(token_payload, separators=(',', ':'))
        signature = hmac.new(
            self.hmac_secret,
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Token format: base64(payload).signature
        token_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()
        token_string = f"{token_b64}.{signature}"
        
        # Simpan ke database
        db_token = AccessToken(
            token_string=token_string,
            user_id=user_id,
            admin_id=admin_id,
            duration_minutes=duration_minutes,
            expires_at=expires_at,
            client_host=client_host
        )
        db.add(db_token)
        
        # Audit log
        audit_log = AuditLog(
            action=AuditAction.TOKEN_GENERATED,
            admin_id=admin_id,
            target_user_id=user_id,
            details=json.dumps({
                "duration_minutes": duration_minutes,
                "expires_at": expires_at.isoformat()
            }),
            client_host=client_host
        )
        db.add(audit_log)
        
        db.commit()
        
        return {
            "token": token_string,
            "expires_at": expires_at,
            "duration_minutes": duration_minutes,
            "user_id": user_id
        }
    
    def verify_token(self, db: Session, token_string: str, client_host: Optional[str] = None) -> Dict[str, Any]:
        """
        Verifikasi dan gunakan token
        """
        try:
            # Parse token
            if '.' not in token_string:
                raise ValueError("Format token tidak valid")
            
            token_b64, signature = token_string.rsplit('.', 1)
            payload_json = base64.urlsafe_b64decode(token_b64).decode()
            
            # Verifikasi signature
            expected_signature = hmac.new(
                self.hmac_secret,
                payload_json.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                raise ValueError("Signature token tidak valid")
            
            # Parse payload
            token_payload = json.loads(payload_json)
            expires_at = datetime.fromisoformat(token_payload["expires_at"])
            
            # Cek apakah token expired
            if datetime.utcnow() > expires_at:
                raise ValueError("Token sudah kadaluwarsa")
            
            # Cek token di database
            db_token = db.query(AccessToken).filter(
                AccessToken.token_string == token_string
            ).first()
            
            if not db_token:
                raise ValueError("Token tidak ditemukan")
            
            if db_token.status != TokenStatus.ACTIVE:
                raise ValueError("Token sudah digunakan atau tidak aktif")
            
            # Tandai token sebagai used (atomic update)
            db_token.status = TokenStatus.USED
            db_token.used_at = datetime.utcnow()
            if client_host:
                db_token.client_host = client_host
            
            # Audit log
            audit_log = AuditLog(
                action=AuditAction.TOKEN_USED,
                admin_id=db_token.admin_id,
                target_user_id=db_token.user_id,
                details=json.dumps({
                    "token_id": db_token.id,
                    "original_duration": db_token.duration_minutes
                }),
                client_host=client_host
            )
            db.add(audit_log)
            
            db.commit()
            
            return {
                "valid": True,
                "user_id": db_token.user_id,
                "admin_id": db_token.admin_id,
                "token_id": db_token.id
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """
        Bersihkan token yang sudah expired
        """
        expired_count = db.query(AccessToken).filter(
            AccessToken.expires_at < datetime.utcnow(),
            AccessToken.status == TokenStatus.ACTIVE
        ).update({
            AccessToken.status: TokenStatus.EXPIRED
        })
        
        db.commit()
        return expired_count

# Instance global
token_service = TokenService()