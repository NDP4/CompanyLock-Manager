# 📊 CompanyLock Manager - System Diagrams

## 📋 Overview

Dokumentasi visual untuk sistem CompanyLock Manager yang menjelaskan alur kerja aplikasi untuk skenario **"Karyawan Lupa Password"**. Diagram telah dipecah menjadi fase-fase terpisah untuk kemudahan pemahaman dan maintenance.

---

## 🎯 Diagram Files Overview

### 1. **Use Case Diagram** (`usecase_diagram.puml`)

Menampilkan interaksi utama antara aktor dan sistem:

- **Aktor Utama**: Admin IT, Karyawan
- **Use Cases**: Kelola Data Karyawan, Generate Token Akses, Validasi Token, Lihat Password, Monitor Sistem, Audit Keamanan

### 2. **Phase-Separated Sequence Diagrams**

Diagram sequence yang dipecah menjadi 7 fase untuk kemudahan pemahaman:

#### 📁 **Fase 1: Kelola Data Karyawan** (`sequence_fase1_kelola_karyawan.puml`)

Detail pengelolaan data karyawan oleh Admin IT:

- **Sub-Fase 1A**: Import Data Karyawan (CSV)
- **Sub-Fase 1B**: Tambah Karyawan Manual
- **Sub-Fase 1C**: Edit Data Karyawan
- **Sub-Fase 1D**: Nonaktifkan/Hapus Karyawan

#### 📞 **Fase 2: Karyawan Minta Bantuan** (`sequence_fase2_minta_bantuan.puml`)

Proses awal ketika karyawan lupa password:

- **Sub-Fase 2A**: Karyawan Menghubungi Admin
- **Sub-Fase 2B**: Admin Verifikasi Identitas
- **Sub-Fase 2C**: Admin Cek Status Karyawan
- **Sub-Fase 2D**: Admin Tentukan Tindakan

#### 🎟️ **Fase 3: Admin Generate Token** (`sequence_fase3_generate_token.puml`)

Proses pembuatan token akses oleh Admin IT:

- **Sub-Fase 3A**: Admin Mulai Generate Token
- **Sub-Fase 3B**: Admin Isi Form Token
- **Sub-Fase 3C**: Validasi dan Generate
- **Sub-Fase 3D**: Tampilkan Hasil ke Admin
- **Sub-Fase 3E**: Admin Salin dan Bagikan
- **Sub-Fase 3F**: Admin Bagikan ke Karyawan
- **Sub-Fase 3G**: Admin Update Status

#### 🔐 **Fase 4: Karyawan Akses Token** (`sequence_fase4_akses_token.puml`)

Karyawan menggunakan token untuk mengakses password:

- **Sub-Fase 4A**: Karyawan Buka Sistem
- **Sub-Fase 4B**: Karyawan Pilih Akses Token
- **Sub-Fase 4C**: Karyawan Input Token
- **Sub-Fase 4D**: Validasi Token di Backend
- **Sub-Fase 4E**: Tampilkan Password (Jika Token Valid)
- **Sub-Fase 4F**: Karyawan Copy Password
- **Sub-Fase 4G**: Auto-Close & Cleanup

#### 🖥️ **Fase 5: Login ke Windows** (`sequence_fase5_login_windows.puml`)

Proses login karyawan ke Windows menggunakan password baru:

- **Sub-Fase 5A**: Karyawan Siap Login Windows
- **Sub-Fase 5B**: Lock/Logout Windows
- **Sub-Fase 5C**: Mulai Proses Login
- **Sub-Fase 5D**: Input Username dan Password
- **Sub-Fase 5E**: Submit Login
- **Sub-Fase 5F**: Login Berhasil
- **Sub-Fase 5G**: Post-Login Actions

#### 📊 **Fase 6: Monitoring & Keamanan** (`sequence_fase6_monitoring_keamanan.puml`)

Sistem monitoring dan keamanan yang berjalan otomatis:

- **Sub-Fase 6A**: Real-time Monitoring
- **Sub-Fase 6B**: Token Lifecycle Monitoring
- **Sub-Fase 6C**: Security Validation
- **Sub-Fase 6D**: Compliance & Audit
- **Sub-Fase 6E**: Performance Analytics
- **Sub-Fase 6F**: User Experience Monitoring
- **Sub-Fase 6G**: Proactive System Maintenance

#### 📋 **Fase 7: Tindak Lanjut & Resolusi** (`sequence_fase7_tindak_lanjut.puml`)

Proses penyelesaian dan pembelajaran dari kasus:

- **Sub-Fase 7A**: Konfirmasi Keberhasilan
- **Sub-Fase 7B**: Monitoring Pasca-Login
- **Sub-Fase 7C**: Analisa Pembelajaran
- **Sub-Fase 7D**: User Experience Follow-Up
- **Sub-Fase 7E**: Sistem Improvement
- **Sub-Fase 7F**: Reporting & Documentation

### 3. **Simple Flow Diagram** (`simple_flow_diagram.puml`)

Diagram sederhana untuk user non-IT yang menjelaskan proses dengan bahasa yang mudah dipahami.

---

## 🚀 Keunggulan Diagram Fase-Terpisah

### ✅ **Kemudahan Pemahaman**

- **Fokus per Fase**: Setiap diagram fokus pada satu aspek proses
- **Detail Mendalam**: Sub-fase memberikan detail yang komprehensif
- **Progressive Learning**: Bisa dipelajari bertahap sesuai kebutuhan

### 🔧 **Maintainability**

- **Modular Updates**: Update satu fase tidak mempengaruhi fase lain
- **Specific Debugging**: Mudah identify masalah di fase tertentu
- **Team Collaboration**: Tim berbeda bisa handle fase yang berbeda

### 📚 **Documentation Value**

- **Role-Specific**: Admin fokus ke Fase 1-3, User fokus ke Fase 4-5
- **Training Materials**: Bisa digunakan untuk training terpisah
- **Process Improvement**: Analisis detail per fase untuk improvement

---

## 📖 Cara Membaca Diagram

### 🎨 **Simbol dan Notasi**

- **Actor** (👤): Orang yang berinteraksi dengan sistem
- **Participant**: Komponen sistem (Frontend, Backend, Database, dll)
- **Arrow** (→): Alur komunikasi/interaksi
- **Note**: Penjelasan tambahan untuk konteks
- **Alt/Else**: Percabangan kondisi
- **Loop**: Proses berulang

### 🌈 **Warna dan Styling**

- **🟢 Hijau**: Proses berhasil/normal
- **🟡 Kuning**: Proses dalam antrian/warning
- **🔴 Merah**: Error/gagal
- **🔵 Biru**: Informasi/status

### 🗺️ **Navigasi Antar Fase**

Setiap diagram fase dapat dibaca secara independen, namun untuk pemahaman lengkap disarankan membaca secara berurutan:

1. **Fase 1** → Setup dan manajemen data karyawan
2. **Fase 2** → Initiation dan verifikasi
3. **Fase 3** → Token generation dan distribution
4. **Fase 4** → Token usage dan password access
5. **Fase 5** → Actual Windows login process
6. **Fase 6** → Background monitoring dan security
7. **Fase 7** → Resolution dan continuous improvement

---

## 🔄 Diagram Sequence

### **File:** `sequence_diagram.puml`

#### **Alur Lengkap (7 Fase):**

##### **Fase 1: Karyawan Meminta Bantuan**

1. Karyawan hubungi Admin IT: _"Saya lupa password"_
2. Admin konfirmasi identitas karyawan

##### **Fase 2: Admin Generate Token**

3. Admin login ke panel administrasi
4. Admin buka halaman "Generate Token"
5. Admin pilih nama karyawan dan durasi token
6. Sistem generate token unik dan aman
7. Token ditampilkan untuk admin

##### **Fase 3: Admin Berikan Token**

8. Admin kirim token ke karyawan secara aman
   - WhatsApp/chat pribadi ✅
   - Email internal ✅
   - Telepon langsung ✅
   - Grup chat umum ❌

##### **Fase 4: Karyawan Akses Password**

9. Karyawan buka halaman http://IP:3000/
10. Input username dan token yang diterima

##### **Fase 5: Validasi Keamanan**

- Sistem cek token masih berlaku atau tidak
- Validasi username sesuai dengan pemilik token
- Jika valid: dekripsi dan tampilkan password
- Jika tidak valid: tampilkan error dan catat percobaan

##### **Fase 6: Karyawan Gunakan Password**

11. Karyawan lihat password dan copy ke clipboard
12. Gunakan password untuk login sistem lain

##### **Fase 7: Keamanan Otomatis**

13. Password otomatis disembunyikan setelah 30 detik
14. Sistem catat semua aktivitas untuk audit

---

## 🌊 Simple Flow Diagram

### **File:** `simple_flow_diagram.puml`

#### **Versi Sederhana (5 Langkah):**

1. **📞 Karyawan Minta Bantuan**

   - Hubungi Admin IT via telepon/chat
   - Admin konfirmasi akan membantu

2. **🔑 Admin Buat Token**

   - Login ke admin panel
   - Pilih nama karyawan
   - Tentukan durasi (5-60 menit)
   - Sistem generate token

3. **💬 Admin Berikan Token**

   - Kirim token via channel aman
   - Contoh: "Token Anda: ABC123XYZ789"

4. **🌐 Karyawan Akses Password**

   - Buka halaman karyawan
   - Input username + token
   - Lihat password yang muncul

5. **📊 Monitoring & Keamanan**
   - Sistem catat semua aktivitas
   - Admin monitor via audit logs

---

## 🛡️ Aspek Keamanan

### **Validasi Berlapis:**

1. **Token Expiry** - Otomatis expired setelah waktu habis
2. **Username Matching** - Harus sesuai dengan pemilik token
3. **Audit Logging** - Semua aktivitas tercatat
4. **Auto Hide** - Password sembunyi otomatis
5. **Access Control** - Hanya admin yang bisa generate token

### **Skenario Error Handling:**

- ❌ **Token Expired**: "Token sudah kedaluwarsa, minta token baru"
- ❌ **Username Salah**: "Username tidak sesuai dengan pemilik token"
- ❌ **Token Invalid**: "Token tidak valid atau tidak ditemukan"
- ❌ **Server Error**: "Terjadi kesalahan sistem, hubungi admin"

---

## 🎯 Target Pengguna

### **Admin IT:**

- Mudah generate token untuk karyawan
- Dashboard monitoring yang jelas
- Log aktivitas untuk audit keamanan
- Kontrol durasi token sesuai kebutuhan

### **Karyawan:**

- Interface sederhana tanpa teknis rumit
- Cukup username + token untuk akses
- Password otomatis copy-able
- Keamanan otomatis tanpa ribet

### **Management:**

- Audit trail lengkap untuk compliance
- Statistik penggunaan sistem
- Monitoring keamanan real-time
- Tidak ada password tersimpan plain text

---

## 🚀 Cara Penggunaan Diagram

### **Untuk Development:**

```bash
# Install PlantUML
npm install -g plantuml

# Generate diagram
plantuml diagrams/usecase_diagram.puml
plantuml diagrams/sequence_diagram.puml
plantuml diagrams/simple_flow_diagram.puml
```

### **Untuk Dokumentasi:**

- Use Case → Requirement analysis
- Sequence → Technical implementation
- Simple Flow → User training & manual

### **Untuk Presentasi:**

- Management → Simple Flow (high-level overview)
- Development Team → Sequence (technical detail)
- End Users → Use Case (feature understanding)

---

## 📝 Catatan Implementasi

### **Sudah Diimplementasi:**

- ✅ Admin login & dashboard
- ✅ Token generation dengan durasi
- ✅ Username + token validation
- ✅ Password decryption & display
- ✅ Auto hide password (30 seconds)
- ✅ Comprehensive audit logging
- ✅ Copy to clipboard functionality

### **URL Akses:**

- **Admin Panel**: http://192.168.31.253:3000/admin
- **Employee Page**: http://192.168.31.253:3000/
- **Dashboard**: http://192.168.31.253:3000/dashboard

---

**💡 Diagram ini dibuat untuk memudahkan pemahaman sistem bagi user non-IT dengan bahasa yang sederhana dan flow yang jelas.**
