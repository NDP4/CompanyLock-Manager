from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.csv_service import CSVService
from app.services.auth_service import auth_service
from app.models import User, UserRole
import io
import logging

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

def require_admin(
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

router = APIRouter(prefix="/csv", tags=["csv"])

@router.get("/template")
async def download_template(current_user: User = Depends(require_admin)):
    """
    Download template CSV untuk import karyawan
    """
    try:
        csv_content = CSVService.generate_template()
        
        # Create response
        response = Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=employee_template.csv"
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating CSV template: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal membuat template CSV")

@router.post("/import")
async def import_users_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Import karyawan dari file CSV
    """
    try:
        # Validasi file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File harus berformat CSV")
        
        # Baca file content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Import data
        logger.info(f"Starting CSV import for user {current_user.username}")
        result = CSVService.import_users(db, csv_content, current_user.id)
        logger.info(f"CSV import result: {result}")
        
        if not result["success"]:
            logger.error(f"CSV import failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result.get("message", "Import berhasil"),
            "imported_count": result.get("imported_count", 0),
            "updated_count": result.get("updated_count", 0),
            "total_processed": result.get("total_processed", 0)
        }
        
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File CSV tidak valid atau encoding bermasalah")
    except Exception as e:
        logger.error(f"Error importing CSV: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gagal import CSV: {str(e)}")

@router.post("/validate")
async def validate_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin)
):
    """
    Validasi format CSV sebelum import
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File harus berformat CSV")
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Validasi data
        validation_result = CSVService.validate_csv_data(csv_content)
        
        return validation_result
        
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File CSV tidak valid atau encoding bermasalah")
    except Exception as e:
        logger.error(f"Error validating CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal validasi CSV: {str(e)}")