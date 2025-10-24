#!/usr/bin/env python3
"""
Script untuk generate secrets yang diperlukan oleh CompanyLock Manager
"""

import os
import secrets
import base64

def generate_secrets():
    """Generate master key dan HMAC secret"""
    
    # Create secrets directory
    secrets_dir = "secrets"
    os.makedirs(secrets_dir, exist_ok=True)
    
    # Generate master key (32 bytes untuk AES-256)
    master_key_path = os.path.join(secrets_dir, "master_key")
    if not os.path.exists(master_key_path):
        master_key = secrets.token_bytes(32)
        with open(master_key_path, "wb") as f:
            f.write(master_key)
        print(f"✅ Generated master_key -> {master_key_path}")
    else:
        print(f"ℹ️  master_key already exists -> {master_key_path}")
    
    # Generate HMAC secret
    hmac_secret_path = os.path.join(secrets_dir, "hmac_secret")
    if not os.path.exists(hmac_secret_path):
        hmac_secret = base64.b64encode(secrets.token_bytes(32)).decode()
        with open(hmac_secret_path, "w") as f:
            f.write(hmac_secret)
        print(f"✅ Generated hmac_secret -> {hmac_secret_path}")
    else:
        print(f"ℹ️  hmac_secret already exists -> {hmac_secret_path}")
    
    # Generate .env file untuk development
    env_path = "backend/.env"
    if os.path.exists(env_path):
        print(f"ℹ️  .env file already exists -> {env_path}")
    else:
        # Read master key untuk .env
        with open(master_key_path, "rb") as f:
            master_key_b64 = base64.b64encode(f.read()).decode()
        
        # Read HMAC secret untuk .env
        with open(hmac_secret_path, "r") as f:
            hmac_secret = f.read().strip()
        
        env_content = f"""# Database Configuration
DATABASE_URL=mysql+pymysql://companylock:companylock_db_password@localhost:3306/companylock_db

# Security
SECRET_KEY={secrets.token_urlsafe(32)}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Master Key for encryption (base64 encoded)
MASTER_KEY={master_key_b64}

# Token HMAC Secret (base64 encoded)
TOKEN_HMAC_SECRET={hmac_secret}

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# App Settings
DEFAULT_TOKEN_DURATION=30
MAX_TOKEN_DURATION=60
"""
        
        with open(env_path, "w") as f:
            f.write(env_content)
        print(f"✅ Generated .env file -> {env_path}")
    
    print("\n🔐 Secrets generation completed!")
    print("\n⚠️  IMPORTANT SECURITY NOTES:")
    print("   • Keep the secrets/ directory secure and private")
    print("   • Never commit secrets to version control")
    print("   • Use proper file permissions (chmod 600)")
    print("   • In production, use Docker secrets or secure key management")
    print("\n📝 Next steps:")
    print("   1. Review the generated .env file")
    print("   2. Start the application with: docker-compose up -d")
    print("   3. Check application health: http://localhost:8000/api/health")

if __name__ == "__main__":
    generate_secrets()