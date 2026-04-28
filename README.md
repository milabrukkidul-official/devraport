# 📋 Rapor Digital — Multi-Kelas + Auth

Aplikasi rapor berbasis web dengan Google Spreadsheet sebagai database, sistem login multi-role, dan cetak A4.

---

## 🗂️ Struktur File

```
rapor-digital/
├── index.html
├── css/
│   ├── style.css       ← Styling utama
│   └── print.css       ← Styling cetak A4
├── js/
│   ├── api.js          ← Komunikasi GAS
│   ├── app.js          ← Fungsi inti
│   ├── auth.js         ← Login / logout / session
│   ├── admin.js        ← Panel admin (kelas & user)
│   ├── setting.js      ← Setting per kelas
│   ├── siswa.js        ← Data siswa per kelas
│   ├── nilai.js        ← Rekap nilai per kelas
│   ├── ekskul.js       ← Ekskul per kelas
│   ├── kkm.js          ← KKM per kelas
│   └── cetak.js        ← Cetak rapor A4
└── gas/
    └── Code.gs         ← Backend Google Apps Script
```

---

## 🚀 Cara Setup

### 1. Google Apps Script
1. Buka Google Sheets → **Extensions → Apps Script**
2. Hapus kode default, paste isi `gas/Code.gs`
3. Jalankan fungsi `setupSheets()` **sekali** (akan membuat sheet `_USERS` dan `_KELAS`)
4. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy URL Web App

### 2. GitHub Pages
1. Upload semua file ke repository GitHub
2. Settings → Pages → Source: main branch
3. Akses di `https://username.github.io/nama-repo/`

### 3. Konfigurasi Awal
1. Buka aplikasi → Login dengan `admin` / `admin123`
2. Masuk ke **Admin → URL Apps Script** → paste URL → Simpan
3. Buat kelas di **Admin → Kelola Kelas**
4. Buat user wali kelas / guru mapel di **Admin → Kelola User**

---

## 👥 Sistem Role

| Role | Akses |
|------|-------|
| **Admin** | Semua fitur + kelola kelas & user |
| **Wali Kelas** | Setting, Siswa, Nilai, Ekskul, KKM, Cetak (kelas sendiri) |
| **Guru Mapel** | Hanya Rekap Nilai (kelas yang ditugaskan) |

---

## 🏫 Multi-Kelas

- Setiap kelas memiliki sheet terpisah di Spreadsheet: `kelasId_SETTING`, `kelasId_SISWA`, dll.
- Data antar kelas **tidak saling mempengaruhi**
- Admin bisa melihat dan mengelola semua kelas
- Wali kelas hanya bisa akses kelas yang ditugaskan

---

## 🖨️ Cetak A4

- Layout otomatis menyesuaikan kertas A4 portrait
- Margin minimum (8mm atas/bawah, 10mm kiri/kanan)
- KOP gambar maksimal 1000×300px
- Semua elemen UI tersembunyi saat print
- Gunakan **Ctrl+P** atau tombol Print di aplikasi

---

## 📊 Sistem Predikat

| Nilai | Predikat |
|-------|----------|
| ≥ 90 | A — Sangat Baik |
| ≥ KKM s/d < 90 | B — Baik |
| 60 s/d < KKM | C — Cukup |
| < 60 | D — Perlu Bimbingan |

---

## 🔐 Keamanan

- Token auth berbasis base64 (username + password hash)
- Setiap request ke GAS diverifikasi token
- Admin default: `admin` / `admin123` — **segera ganti setelah setup!**
- Untuk keamanan lebih, gunakan Google Sheets sharing permissions
