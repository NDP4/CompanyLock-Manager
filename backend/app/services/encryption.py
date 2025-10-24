from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import secrets
from typing import Optional

class EncryptionService:
    def __init__(self):
        self._fernet: Optional[Fernet] = None
        self._load_master_key()
    
    def _load_master_key(self):
        """
        Memuat MASTER_KEY dari file atau environment variable
        """
        # Coba ambil dari Docker secrets
        master_key_file = os.getenv("MASTER_KEY_FILE", "/run/secrets/master_key")
        master_key = None
        
        if os.path.exists(master_key_file):
            with open(master_key_file, 'rb') as f:
                master_key = f.read()
        else:
            # Fallback ke environment variable
            master_key_env = os.getenv("MASTER_KEY")
            if master_key_env:
                master_key = base64.b64decode(master_key_env)
            else:
                # Generate master key untuk development
                master_key = self._generate_master_key()
                # Simpan ke file untuk development
                os.makedirs("/tmp/companylock", exist_ok=True)
                with open("/tmp/companylock/master.key", "wb") as f:
                    f.write(master_key)
                print("⚠️  MASTER_KEY tidak ditemukan. Generated temporary key di /tmp/companylock/master.key")
                print("   Untuk production, gunakan Docker secrets atau set MASTER_KEY environment variable")
        
        # Pastikan key 32 bytes untuk Fernet
        if len(master_key) != 32:
            # Derive key menggunakan PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'companylock_salt',  # Static salt for consistency
                iterations=100000,
            )
            master_key = kdf.derive(master_key)
        
        # Encode untuk Fernet
        fernet_key = base64.urlsafe_b64encode(master_key)
        self._fernet = Fernet(fernet_key)
    
    def _generate_master_key(self) -> bytes:
        """
        Generate master key baru (32 bytes)
        """
        return secrets.token_bytes(32)
    
    def encrypt_password(self, plaintext_password: str) -> str:
        """
        Enkripsi password menggunakan AES-GCM (via Fernet)
        """
        if not self._fernet:
            raise RuntimeError("Master key tidak tersedia")
        
        encrypted_data = self._fernet.encrypt(plaintext_password.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        """
        Dekripsi password
        """
        if not self._fernet:
            raise RuntimeError("Master key tidak tersedia")
        
        encrypted_data = base64.b64decode(encrypted_password.encode())
        decrypted_data = self._fernet.decrypt(encrypted_data)
        return decrypted_data.decode()
    
    def verify_master_key(self) -> bool:
        """
        Verifikasi bahwa master key berfungsi dengan baik
        """
        try:
            test_data = "test_encryption_123"
            encrypted = self.encrypt_password(test_data)
            decrypted = self.decrypt_password(encrypted)
            return test_data == decrypted
        except Exception:
            return False

# Instance global untuk digunakan di seluruh aplikasi
encryption_service = EncryptionService()