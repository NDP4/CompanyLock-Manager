# Database Migration and Seeder Script
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, UserRole
from app.services.encryption import encryption_service
from app.services.auth_service import AuthService
import os
from dotenv import load_dotenv

load_dotenv()

def create_database_and_tables():
    """Buat database dan tabel"""
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://companylock:YOUR_PASSWORD@localhost:3306/companylock_db")
    
    engine = create_engine(DATABASE_URL, echo=True)
    
    # Buat semua tabel
    Base.metadata.create_all(bind=engine)
    print("✅ Tabel berhasil dibuat")
    
    return engine

def seed_default_admin():
    """Seeder untuk admin default"""
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://companylock:YOUR_PASSWORD@localhost:3306/companylock_db")
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Cek apakah admin sudah ada
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("ℹ️  Admin default sudah ada")
            return
        
        # Enkripsi password default
        encrypted_password = encryption_service.encrypt_password("admin123")
        
        # Buat admin default
        admin_user = User(
            username="admin",
            full_name="System Administrator",
            department="IT",
            role=UserRole.ADMIN,
            is_active=True,
            encrypted_password=encrypted_password,
            must_change_password=True  # Wajib ganti password pertama kali login
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin default berhasil dibuat:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   ⚠️  WAJIB ganti password setelah login pertama kali!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error membuat admin default: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Memulai migrasi database...")
    
    # Buat tabel
    engine = create_database_and_tables()
    
    # Seed admin default
    seed_default_admin()
    
    print("✅ Migrasi dan seeding selesai!")