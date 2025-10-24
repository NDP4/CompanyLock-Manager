# CompanyLock Manager - IP Configuration

# Konfigurasi ini memungkinkan aplikasi menerima koneksi dari IP spesifik

# Contoh penggunaan dengan IP spesifik:

# Ganti 0.0.0.0 dengan IP yang diinginkan di docker-compose.yml

# Misalnya: 192.168.1.100:3000:80

# Services dan Port yang tersedia:

# - Frontend (React): 0.0.0.0:3000 -> http://[YOUR_IP]:3000

# - Backend (FastAPI): 0.0.0.0:8000 -> http://[YOUR_IP]:8000

# - NocoDB (DB Manager): 0.0.0.0:8082 -> http://[YOUR_IP]:8082

# - MySQL Database: 0.0.0.0:3307 -> mysql://[YOUR_IP]:3307

# - Nginx (Optional): 0.0.0.0:8081 -> http://[YOUR_IP]:8081

# Untuk IP spesifik, ubah format di docker-compose.yml:

# ports:

# - "192.168.1.100:3000:80" # Hanya menerima koneksi dari 192.168.1.100

# - "10.0.0.50:8000:8000" # Hanya menerima koneksi dari 10.0.0.50

# Untuk semua IP (default saat ini):

# ports:

# - "0.0.0.0:3000:80" # Menerima koneksi dari semua IP

# NocoDB Database Manager Credentials:

# URL: http://[YOUR_IP]:8082/dashboard

# Email: admin@companylock.com

# Password: CompanyLock123!

# Note: First-time setup akan meminta pembuatan workspace dan koneksi database
