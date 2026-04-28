# Panduan Migrasi Backend: Dari Kelas ke Rombel

## ✅ PERUBAHAN BACKEND SELESAI

File `gas/Code.gs` sudah diupdate sepenuhnya untuk menggunakan konsep **Rombel** menggantikan **Kelas**.

---

## 📋 RINGKASAN PERUBAHAN BACKEND

### 1. **Sheet yang Dihapus**
- ❌ `_KELAS` - Tidak digunakan lagi

### 2. **Sheet yang Diupdate**
- ✅ `_USERS` - Kolom `kelasId` → `rombelId`
- ✅ `_ROMBEL` - Ditambah kolom `wali` dan `waliNama`

### 3. **Fungsi yang Dihapus**
- ❌ `getKelasPublic_()` - Tidak diperlukan lagi
- ❌ `saveKelas_()` - Diganti dengan `saveRombel_()`
- ❌ `deleteKelas_()` - Diganti dengan `deleteRombel_()`
- ❌ `applyRombelToKelas_()` - Tidak diperlukan lagi
- ❌ `updateKelasIdUser_()` - Diganti dengan `updateRombelIdUser_()`
- ❌ `initSettingKelas_()` - Diganti dengan `initSettingRombel_()`

### 4. **Fungsi yang Diupdate**
- ✅ `login_()` - Return `rombelId` instead of `kelasId`
- ✅ `parseKelasId_()` → `parseRombelId_()`
- ✅ `canAccessKelas()` → `canAccessRombel()`
- ✅ `canEditNilai()` - Gunakan `rombelId`
- ✅ `saveGuruKelas_()` → `saveGuruRombel_()`
- ✅ `saveRombel_()` - Tambah pengelolaan wali kelas
- ✅ `deleteRombel_()` - Hapus sheet per rombel

### 5. **Struktur Sheet Baru**

#### `_USERS`
```
username | password | nama | role | rombelId
```
- `rombelId` untuk walikelas: string (contoh: "rombel_1")
- `rombelId` untuk guruMapel: JSON array (contoh: '["rombel_1","rombel_2"]')
- `rombelId` untuk admin: kosong

#### `_ROMBEL`
```
id | namaRombel | wali | waliNama | mapelJSON
```
- `id`: ID unik rombel (contoh: "rombel_1")
- `namaRombel`: Nama rombel (contoh: "Kelas 1")
- `wali`: Username wali kelas
- `waliNama`: Nama lengkap wali kelas
- `mapelJSON`: Array mata pelajaran dalam format JSON

---

## 🔄 CARA MIGRASI DATA LAMA

Jika Anda sudah memiliki data di sistem lama dengan sheet `_KELAS`, ikuti langkah berikut:

### Langkah 1: Backup Data
1. Buka Google Spreadsheet Anda
2. File → Make a copy
3. Simpan backup dengan nama yang jelas (contoh: "Rapor Digital - Backup 2026-04-28")

### Langkah 2: Migrasi Manual (Jika Ada Data Kelas)

#### A. Migrasi User
1. Buka sheet `_USERS`
2. Ubah header kolom 5 dari `kelasId` menjadi `rombelId`
3. Untuk setiap user dengan role `walikelas`:
   - Ubah nilai `kelasId` menjadi `rombelId` yang sesuai
   - Contoh: jika kelas "1A" menggunakan rombel "rombel_1", ubah "1A" → "rombel_1"

#### B. Migrasi Rombel
1. Buka sheet `_ROMBEL`
2. Tambahkan kolom baru di posisi 3 dan 4: `wali` dan `waliNama`
3. Untuk setiap rombel:
   - Isi kolom `wali` dengan username wali kelas dari sheet `_KELAS`
   - Isi kolom `waliNama` dengan nama lengkap wali kelas

#### C. Rename Sheet Data
Untuk setiap kelas yang ada (contoh: "1A", "1B", "1C"):
1. Tentukan rombel yang akan digunakan (contoh: "rombel_1")
2. Rename sheet:
   - `1A_SISWA` → `rombel_1_SISWA`
   - `1A_NILAI` → `rombel_1_NILAI`
   - `1A_KKM` → `rombel_1_KKM`
   - `1A_EKSKUL` → `rombel_1_EKSKUL`
   - `1A_SETTING` → `rombel_1_SETTING`

#### D. Hapus Sheet Lama
Setelah semua data berhasil dimigrasi:
1. Hapus sheet `_KELAS`
2. Hapus sheet kelas lama yang sudah tidak dipakai

### Langkah 3: Update Apps Script
1. Buka Google Apps Script (Extensions → Apps Script)
2. Hapus semua kode lama
3. Copy-paste kode baru dari file `gas/Code.gs`
4. Save (Ctrl+S atau Cmd+S)
5. **JANGAN jalankan `setupSheets()` lagi** (karena data sudah ada)

### Langkah 4: Test
1. Refresh halaman web aplikasi
2. Login sebagai admin
3. Cek apakah daftar rombel muncul
4. Cek apakah daftar user muncul dengan rombel yang benar
5. Test buat rombel baru
6. Test assign rombel ke wali kelas
7. Test upload siswa per rombel

---

## 🆕 SETUP BARU (Tanpa Data Lama)

Jika Anda memulai dari awal tanpa data lama:

### Langkah 1: Paste Kode
1. Buka Google Spreadsheet baru
2. Extensions → Apps Script
3. Hapus kode default
4. Copy-paste kode dari `gas/Code.gs`
5. Save (Ctrl+S atau Cmd+S)

### Langkah 2: Jalankan Setup
1. Pilih fungsi `setupSheets` dari dropdown
2. Klik Run (▶️)
3. Authorize aplikasi jika diminta
4. Tunggu hingga muncul alert "✅ Setup selesai!"

### Langkah 3: Deploy
1. Deploy → New deployment
2. Type: Web app
3. Description: "Rapor Digital API"
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Deploy
7. Copy URL Web App

### Langkah 4: Update Frontend
1. Buka file `js/api.js`
2. Paste URL ke konstanta `GAS_URL`
3. Save dan commit ke GitHub

### Langkah 5: Test
1. Buka aplikasi web
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`
3. Buat rombel pertama
4. Buat user wali kelas
5. Assign wali kelas ke rombel
6. Test semua fitur

---

## 🔍 TROUBLESHOOTING

### Error: "Unknown action: getKelasPublic"
**Penyebab:** Frontend masih memanggil API lama
**Solusi:** Pastikan semua file frontend sudah diupdate (lihat RINGKASAN_PERUBAHAN.md)

### Error: "Akses ditolak"
**Penyebab:** Token tidak valid atau user tidak memiliki akses ke rombel
**Solusi:** 
1. Logout dan login ulang
2. Pastikan user sudah di-assign ke rombel yang benar

### Daftar User Tidak Muncul
**Penyebab:** Sheet `_USERS` belum ada atau kosong
**Solusi:** Jalankan fungsi `setupSheets()` sekali

### Daftar Rombel Tidak Muncul
**Penyebab:** Sheet `_ROMBEL` belum ada atau kosong
**Solusi:** 
1. Jalankan fungsi `setupSheets()` sekali
2. Atau buat rombel manual dari panel admin

### Data Siswa Hilang Setelah Migrasi
**Penyebab:** Sheet tidak di-rename dengan benar
**Solusi:** 
1. Cek nama sheet di Google Spreadsheet
2. Pastikan format: `{rombelId}_SISWA`, `{rombelId}_NILAI`, dll
3. Contoh: `rombel_1_SISWA`, bukan `1A_SISWA`

---

## 📞 BANTUAN

Jika mengalami masalah:
1. Cek file `RINGKASAN_PERUBAHAN.md` untuk detail perubahan frontend
2. Cek console browser (F12) untuk error JavaScript
3. Cek Execution log di Apps Script untuk error backend
4. Pastikan semua file sudah diupdate (frontend + backend)

---

## ✨ FITUR BARU SETELAH MIGRASI

1. ✅ Sistem lebih sederhana - hanya ada Rombel, tidak ada Kelas
2. ✅ Wali kelas langsung di-assign di Rombel
3. ✅ Guru mapel bisa mengajar di beberapa rombel
4. ✅ Template Excel menampilkan info rombel tujuan
5. ✅ Rapor menampilkan nama rombel
6. ✅ Tidak ada duplikasi data antara Kelas dan Rombel

---

## 🎯 CHECKLIST MIGRASI

- [ ] Backup data lama
- [ ] Update sheet `_USERS`: `kelasId` → `rombelId`
- [ ] Update sheet `_ROMBEL`: tambah kolom `wali` dan `waliNama`
- [ ] Rename sheet data kelas → rombel
- [ ] Hapus sheet `_KELAS`
- [ ] Update kode Apps Script
- [ ] Test login
- [ ] Test buat rombel
- [ ] Test assign wali kelas
- [ ] Test upload siswa
- [ ] Test input nilai
- [ ] Test cetak rapor
- [ ] Hapus backup jika semua OK

Selamat! Sistem Anda sekarang menggunakan konsep Rombel yang lebih sederhana dan efisien! 🎉
