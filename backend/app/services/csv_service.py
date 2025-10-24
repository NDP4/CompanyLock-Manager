import pandas as pd
import io
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import User, UserRole, AuditLog, AuditAction
from app.services.encryption import encryption_service
import json

class CSVService:
    
    @staticmethod
    def generate_template() -> str:
        """
        Generate template CSV untuk import karyawan
        """
        template_data = {
            'Username': ['admin', 'john.doe', 'jane.smith', 'mike.wilson', 'sarah.johnson'],
            'FullName': ['System Administrator', 'John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Johnson'],
            'Department': ['IT', 'Finance', 'HR', 'Operations', 'IT'],
            'Role': ['Admin', 'User', 'User', 'User', 'User'],
            'IsActive': [True, True, True, True, True],
            'Password': ['admin123', 'password123', 'password123', 'password123', 'password123']
        }
        
        df = pd.DataFrame(template_data)
        
        # Convert ke CSV string
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        return csv_buffer.getvalue()
    
    @staticmethod
    def validate_csv_data(csv_content: str) -> Dict[str, Any]:
        """
        Validasi data CSV sebelum import
        """
        try:
            # Baca CSV
            df = pd.read_csv(io.StringIO(csv_content))
            
            # Cek kolom required
            required_columns = ['Username', 'FullName', 'Department', 'Role', 'IsActive', 'Password']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "valid": False,
                    "error": f"Kolom yang hilang: {', '.join(missing_columns)}"
                }
            
            # Validasi data
            errors = []
            
            # Cek username kosong atau duplikat
            if df['Username'].isnull().any():
                errors.append("Ada Username yang kosong")
            
            if df['Username'].duplicated().any():
                duplicates = df[df['Username'].duplicated()]['Username'].tolist()
                errors.append(f"Username duplikat: {', '.join(duplicates)}")
            
            # Cek FullName kosong
            if df['FullName'].isnull().any():
                errors.append("Ada FullName yang kosong")
            
            # Cek Role valid
            valid_roles = ['Admin', 'User']
            invalid_roles = df[~df['Role'].isin(valid_roles)]['Role'].unique()
            if len(invalid_roles) > 0:
                errors.append(f"Role tidak valid: {', '.join(invalid_roles)}. Gunakan: {', '.join(valid_roles)}")
            
            # Cek IsActive format
            try:
                df['IsActive'] = df['IsActive'].astype(bool)
            except:
                errors.append("Kolom IsActive harus berupa True/False")
            
            # Cek Password kosong
            if df['Password'].isnull().any():
                errors.append("Ada Password yang kosong")
            
            if errors:
                return {
                    "valid": False,
                    "error": "; ".join(errors)
                }
            
            return {
                "valid": True,
                "data": df.to_dict('records'),
                "count": len(df)
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Error parsing CSV: {str(e)}"
            }
    
    @staticmethod
    def import_users(db: Session, csv_content: str, admin_id: int, client_host: Optional[str] = None) -> Dict[str, Any]:
        """
        Import users dari CSV
        """
        # Validasi dulu
        validation_result = CSVService.validate_csv_data(csv_content)
        if not validation_result["valid"]:
            return {
                "success": False,
                "error": validation_result["error"],
                "message": f"Validasi gagal: {validation_result['error']}"
            }
        
        users_data = validation_result["data"]
        imported_count = 0
        updated_count = 0
        errors = []
        
        try:
            for user_data in users_data:
                try:
                    # Cek apakah user sudah ada
                    existing_user = db.query(User).filter(
                        User.username == user_data['Username']
                    ).first()
                    
                    # Enkripsi password
                    encrypted_password = encryption_service.encrypt_password(user_data['Password'])
                    
                    if existing_user:
                        # Update user existing
                        existing_user.full_name = user_data['FullName']
                        existing_user.department = user_data['Department']
                        existing_user.role = UserRole.ADMIN if user_data['Role'] == 'Admin' else UserRole.USER
                        existing_user.is_active = user_data['IsActive']
                        existing_user.encrypted_password = encrypted_password
                        updated_count += 1
                    else:
                        # Buat user baru
                        new_user = User(
                            username=user_data['Username'],
                            full_name=user_data['FullName'],
                            department=user_data['Department'],
                            role=UserRole.ADMIN if user_data['Role'] == 'Admin' else UserRole.USER,
                            is_active=user_data['IsActive'],
                            encrypted_password=encrypted_password,
                            must_change_password=True if user_data['Role'] == 'Admin' else False
                        )
                        db.add(new_user)
                        imported_count += 1
                
                except Exception as e:
                    errors.append(f"Error pada user {user_data.get('Username', 'unknown')}: {str(e)}")
                    continue
            
            # Commit semua perubahan
            db.commit()
            
            # Audit log
            audit_log = AuditLog(
                action=AuditAction.USER_IMPORTED,
                admin_id=admin_id,
                details=json.dumps({
                    "imported_count": imported_count,
                    "updated_count": updated_count,
                    "total_processed": len(users_data),
                    "errors": errors
                }),
                client_host=client_host
            )
            db.add(audit_log)
            db.commit()
            
            return {
                "success": True,
                "message": f"Import berhasil: {imported_count} user baru, {updated_count} user diperbarui",
                "imported_count": imported_count,
                "updated_count": updated_count,
                "total_processed": len(users_data),
                "errors": errors
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": f"Database error: {str(e)}",
                "message": f"Import gagal: {str(e)}"
            }
    
    @staticmethod
    def export_users(db: Session, include_passwords: bool = False) -> str:
        """
        Export users ke CSV (tanpa password untuk keamanan)
        """
        users = db.query(User).all()
        
        export_data = []
        for user in users:
            user_dict = {
                'Username': user.username,
                'FullName': user.full_name,
                'Department': user.department,
                'Role': user.role.value,
                'IsActive': user.is_active,
                'CreatedAt': user.created_at.isoformat() if user.created_at else None
            }
            
            # Hanya include password jika diminta dan user adalah admin yang melakukan export
            if include_passwords:
                try:
                    decrypted_password = encryption_service.decrypt_password(user.encrypted_password)
                    user_dict['Password'] = decrypted_password
                except:
                    user_dict['Password'] = '[DECRYPT_ERROR]'
            
            export_data.append(user_dict)
        
        df = pd.DataFrame(export_data)
        
        # Convert ke CSV string
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        return csv_buffer.getvalue()

# Instance global
csv_service = CSVService()