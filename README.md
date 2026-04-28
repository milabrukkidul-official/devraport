# 📋 Aplikasi Rapor Digital

Aplikasi rapor berbasis web yang menggunakan **Google Spreadsheet** sebagai database dan dapat di-host di **GitHub Pages**.

---

## 🗂️ Struktur File

```
rapor-digital/
├── index.html          ← Halaman utama aplikasi
├── css/
│   └── style.css       ← Styling
├── js/
│   ├── api.js          ← Komunikasi ke Google Apps Script
│   ├── app.js          ← Fungsi inti & helper
│   ├── setting.js      ← Halaman Setting
│   ├── siswa.js        ← Data Siswa
│   ├── nilai.js        ← Rekap Nilai
│   ├── ekskul.js       ← Ekstrakurikuler
│   ├── kkm.js          ← KKM
│   └── cetak.js        ← Cetak Rapor
└── gas/
    └── Code.gs         ← Google Apps Script (backend)
```

---

## 🚀 Cara Setup

### Langkah 1 — Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru.
2. Buka **Extensions → Apps Script**.
3. Hapus kode default, paste seluruh isi file `gas/Code.gs`.
4. Klik **Save**, lalu jalankan fungsi `setupSheets` sekali untuk membuat semua sheet otomatis.

### Langkah 2 — Deploy Web App

1. Di Apps Script, klik **Deploy → New Deployment**.
2. Pilih type: **Web App**.
3. Isi deskripsi (bebas).
4. **Execute as**: Me
5. **Who has access**: Anyone
6. Klik **Deploy**, copy URL Web App yang muncul.

### Langkah 3 — Host di GitHub Pages

1. Upload semua file ke repository GitHub.
2. Aktifkan **GitHub Pages** di Settings → Pages → Source: main branch.
3. Akses aplikasi di `https://username.github.io/nama-repo/`.

### Langkah 4 — Hubungkan ke Spreadsheet

1. Buka aplikasi di browser.
2. Di halaman **Beranda**, paste URL Web App dari langkah 2.
3. Klik **Simpan & Hubungkan**.

---

## 📋 Sheet yang Dibuat Otomatis

| Sheet | Isi |
|-------|-----|
| **SETTING** | Konfigurasi madrasah, kelas, wali kelas, dll |
| **DATA SISWA** | NISN, No. Induk, Nama, TTL, Ortu, Pesan |
| **REKAP NILAI** | Nilai per mata pelajaran + kehadiran |
| **KKM** | Kriteria Ketuntasan Minimal per mapel |
| **EKSTRAKURIKULER** | Nilai kegiatan ekskul per siswa |

---

## 🖨️ Cara Cetak Rapor

1. Isi semua data (Setting, Siswa, Nilai, KKM).
2. Buka menu **Cetak Rapor**.
3. Klik **Muat Data**.
4. Pilih nama siswa dari dropdown.
5. Klik **Print** atau `Ctrl+P`.

---

## 📊 Sistem Predikat

| Nilai | Predikat | Keterangan |
|-------|----------|------------|
| ≥ 90 | **A** | Sangat Baik |
| ≥ KKM s/d < 90 | **B** | Baik |
| 60 s/d < KKM | **C** | Cukup |
| < 60 | **D** | Perlu Bimbingan |

---

## ⚠️ Catatan Penting

- Pastikan URL Web App Apps Script sudah benar dan berstatus **Active**.
- Jika ada error CORS, pastikan deployment menggunakan **Anyone** access.
- Data tersimpan langsung di Google Spreadsheet, bisa diedit manual jika perlu.
- Untuk update Apps Script, buat **New Deployment** (bukan edit yang lama).
