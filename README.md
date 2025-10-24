# CompanyLock Manager Web

Sistem manajemen password karyawan dengan token akses yang aman, dibangun dengan FastAPI backend dan React frontend dengan tema glassmorphism yang modern.

## 🚀 Fitur Utama

### 🔐 Keamanan Tingkat Enterprise

- **Enkripsi AES-GCM**: Semua password karyawan dienkripsi dengan standar militer
- **Token HMAC**: System token dengan signature HMAC untuk verifikasi
- **Audit Logging**: Pencatatan lengkap semua aktivitas sistem
- **Non-copyable Password**: Password tidak bisa disalin untuk keamanan ekstra
- **Time-limited Token**: Token akses memiliki durasi terbatas (5-60 menit)

### 👥 Manajemen Karyawan

- **Import CSV**: Import data karyawan massal dari file CSV
- **Template Download**: Template CSV standar untuk memudahkan import
- **User Management**: Kelola data karyawan dengan mudah
- **Role-based Access**: Pemisahan role Admin dan User

### 🎯 Interface Modern

- **Glassmorphism Design**: UI modern dengan efek glass yang elegan
- **Responsive Layout**: Tampilan optimal di desktop, tablet, dan mobile
- **Dark Theme**: Tema gelap yang nyaman untuk mata
- **Sidebar Navigation**: Navigasi admin yang intuitif

### 📊 Monitoring & Analytics

- **Dashboard**: Ringkasan aktivitas dan statistik sistem
- **Audit Logs**: Riwayat lengkap semua aktivitas dengan filter
- **Health Monitoring**: Status kesehatan sistem real-time
- **CSV Export**: Export log aktivitas untuk analisis

## 🛠️ Tech Stack

### Backend

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM untuk database operations
- **MySQL**: Database untuk penyimpanan data
- **Cryptography**: Library enkripsi AES-GCM
- **PyMySQL**: Driver database MySQL
- **Alembic**: Database migration tool

### Frontend

- **React.js**: UI library modern
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management yang ringan
- **Axios**: HTTP client untuk API calls
- **React Hook Form**: Form management
- **Lucide React**: Icon library
- **React Hot Toast**: Notification system

### DevOps

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy dan static serving
- **MySQL 8.0**: Database container

## 📋 Prasyarat

- Docker dan Docker Compose terinstall
- Python 3.11+ (untuk development)
- Node.js 18+ (untuk development)
- Port 3000, 8000, dan 3306 tersedia

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/NDP4/CompanyLock-Manager.git
cd CompanyLock-Manager-web
```

### 2. Generate Secrets

```bash
python generate_secrets.py
```

### 3. Start dengan Docker

```bash
docker-compose up -d
```

### 4. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Login Default

```
Username: admin
Password: admin123
```

⚠️ **WAJIB ganti password default setelah login pertama kali!**

## 📁 Struktur Proyek

```
CompanyLock-Manager-web/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── database.py     # Database configuration
│   │   └── main.py         # FastAPI app
│   ├── migrations/         # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API services
│   │   └── lib/            # Utilities
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend container
├── secrets/               # Generated secrets (DO NOT COMMIT)
├── docker-compose.yml     # Multi-container setup
└── generate_secrets.py    # Secret generation script
```

## 🔧 Development Setup

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python migrate_and_seed.py  # Setup database
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## 📝 Cara Penggunaan

### Untuk Admin IT:

1. **Login ke Admin Panel**

   - Akses http://localhost:3000
   - Login dengan admin/admin123
   - Ganti password default

2. **Import Data Karyawan**

   - Download template CSV
   - Isi data karyawan sesuai format
   - Upload file CSV ke sistem

3. **Generate Token untuk Karyawan**

   - Pilih karyawan yang membutuhkan akses
   - Tentukan durasi token (5-60 menit)
   - Berikan token secara aman ke karyawan

4. **Monitor Aktivitas**
   - Pantau dashboard untuk statistik
   - Review audit logs secara berkala
   - Periksa health status sistem

### Untuk Karyawan:

1. **Akses Password Viewer**

   - Buka http://localhost:3000/dashboard/password-viewer
   - Pilih nama sendiri dari daftar
   - Masukkan token yang diberikan admin

2. **Lihat Password**
   - Password akan ditampilkan selama 30 detik
   - Catat atau ingat password dengan baik
   - Password tidak bisa disalin untuk keamanan

## 🔒 Keamanan & Best Practices

### Keamanan Sistem:

- ✅ Semua password dienkripsi dengan AES-GCM
- ✅ Token menggunakan HMAC signature
- ✅ Audit logging untuk semua aktivitas
- ✅ Rate limiting dan input validation
- ✅ Secure password display (non-copyable)
- ✅ Time-limited access tokens

### Rekomendasi Production:

1. **Ganti semua password default**
2. **Gunakan HTTPS dengan SSL certificate**
3. **Setup firewall dan network security**
4. **Backup database secara berkala**
5. **Monitor logs dan aktivitas mencurigakan**
6. **Update sistem secara rutin**

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/change-password` - Ganti password

### User Management

- `GET /api/users` - Daftar karyawan
- `GET /api/users/{id}` - Detail karyawan

### Token Management

- `POST /api/tokens/generate` - Generate token
- `POST /api/tokens/use` - Gunakan token

### CSV Operations

- `GET /api/csv/template` - Download template
- `POST /api/csv/import` - Import karyawan

### Audit & Health

- `GET /api/audit-logs` - Audit logs
- `GET /api/health` - Health check

## 📊 Format CSV Import

```csv
Username,FullName,Department,Role,IsActive,Password
john.doe,John Doe,Finance,User,True,password123
jane.smith,Jane Smith,HR,User,True,password123
```

**Kolom Wajib:**

- `Username`: Username unik untuk login
- `FullName`: Nama lengkap karyawan
- `Department`: Departemen/divisi
- `Role`: Admin atau User
- `IsActive`: True/False status aktif
- `Password`: Password karyawan (akan dienkripsi)

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Pastikan MySQL container berjalan
docker-compose ps

# Restart MySQL jika perlu
docker-compose restart mysql
```

### Frontend Build Error

```bash
# Clear cache dan reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Backend Import Error

```bash
# Cek logs backend
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Permission Denied (Secrets)

```bash
# Set proper permissions
chmod 600 secrets/*
```

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Developer

Dikembangkan oleh Tim IT untuk meningkatkan keamanan manajemen password karyawan.

## 📞 Support

Untuk bantuan teknis atau pertanyaan, silakan:

- Buka issue di repository
- Hubungi tim IT internal
- Konsultasi dokumentasi API di `/docs`

---

⚠️ **PERINGATAN KEAMANAN**: Pastikan untuk selalu menggunakan HTTPS di production, backup database secara berkala, dan monitor aktivitas sistem. Jangan pernah commit file secrets ke version control!
