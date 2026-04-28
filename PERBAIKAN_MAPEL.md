# 🔧 Perbaikan: Mata Pelajaran Tidak Muncul di Menu Nilai

## ❌ Masalah

Ketika rombel baru dibuat dengan mata pelajaran, mata pelajaran tidak muncul di menu Nilai. User harus menambahkan mapel secara manual.

## ✅ Solusi

Backend telah diperbaiki untuk **otomatis mengambil mata pelajaran dari rombel** ketika sheet nilai masih kosong.

---

## 🔄 Perubahan yang Dilakukan

### 1. **Fungsi `getNilai_()` - Auto-load Mapel dari Rombel**

**Sebelum:**
```javascript
if (data.length < 2) return { mapel: [], siswa: siswaRes, nilai: [] };
```

**Sesudah:**
```javascript
if (data.length < 2) {
  // Ambil mapel dari rombel
  const { rombel } = getRombel_();
  const rombelInfo = rombel.find(r => r.id === rombelId);
  const mapelFromRombel = rombelInfo ? rombelInfo.mapel : [];
  
  // Inisialisasi sheet nilai dengan mapel dari rombel
  if (mapelFromRombel.length > 0) {
    // Buat header dan rows
    // Tulis ke sheet
    return { mapel: mapelFromRombel, siswa: siswaRes, nilai };
  }
  
  return { mapel: [], siswa: siswaRes, nilai: [] };
}
```

### 2. **Fungsi `saveRombel_()` - Auto-sync Mapel**

Ditambahkan fungsi untuk sinkronisasi otomatis ketika mapel di rombel diubah:

```javascript
// Jika mapel berubah, update sheet nilai
if (JSON.stringify(mapelLama) !== JSON.stringify(r.mapel)) {
  syncMapelToNilai_(r.id, r.mapel);
}
```

### 3. **Fungsi Baru: `syncMapelToNilai_()`**

Fungsi helper untuk sinkronisasi mapel ke sheet nilai dengan mempertahankan nilai yang sudah ada:

```javascript
function syncMapelToNilai_(rombelId, mapelBaru) {
  // Ambil nilai lama
  // Petakan ke mapel baru
  // Pertahankan nilai yang sudah ada
  // Tulis ulang sheet
}
```

---

## 🎯 Cara Kerja

### Skenario 1: Rombel Baru dengan Mapel
1. Admin buat rombel baru dengan 5 mata pelajaran
2. Admin assign wali kelas ke rombel
3. Wali kelas buka menu **Nilai**
4. ✅ **Otomatis muncul 5 mata pelajaran dari rombel**
5. Sheet nilai otomatis dibuat dengan header yang benar

### Skenario 2: Tambah Siswa Baru
1. Wali kelas tambah siswa baru
2. Wali kelas buka menu **Nilai**
3. ✅ **Siswa baru otomatis muncul di tabel nilai**
4. Semua mapel sudah tersedia

### Skenario 3: Edit Mapel di Rombel
1. Admin edit rombel, tambah/hapus/ubah mapel
2. Admin simpan rombel
3. ✅ **Sheet nilai otomatis di-update**
4. Nilai yang sudah ada dipertahankan
5. Mapel baru ditambahkan dengan nilai kosong
6. Mapel yang dihapus tidak muncul lagi

---

## 📋 Testing

### Test 1: Rombel Baru
```
1. Login sebagai admin
2. Buat rombel baru: "Kelas 1"
3. Tambah mapel: Matematika, Bahasa Indonesia, IPA
4. Assign wali kelas
5. Logout, login sebagai wali kelas
6. Buka menu Nilai
7. ✅ Harus muncul 3 mapel
```

### Test 2: Tambah Siswa
```
1. Login sebagai wali kelas
2. Tambah siswa baru
3. Buka menu Nilai
4. ✅ Siswa baru harus muncul di tabel
5. ✅ Semua mapel harus tersedia
```

### Test 3: Edit Mapel
```
1. Login sebagai admin
2. Edit rombel, tambah mapel "PJOK"
3. Simpan
4. Login sebagai wali kelas
5. Buka menu Nilai
6. ✅ Mapel "PJOK" harus muncul
7. ✅ Nilai yang sudah ada tetap ada
```

### Test 4: Hapus Mapel
```
1. Login sebagai admin
2. Edit rombel, hapus mapel "IPA"
3. Simpan
4. Login sebagai wali kelas
5. Buka menu Nilai
6. ✅ Mapel "IPA" tidak muncul lagi
7. ✅ Nilai mapel lain tetap ada
```

---

## ⚠️ Catatan Penting

### Nilai yang Sudah Ada
- ✅ Nilai yang sudah diinput **TIDAK AKAN HILANG**
- ✅ Ketika mapel diubah, nilai dipertahankan berdasarkan nama mapel
- ✅ Jika mapel dihapus, nilainya juga hilang (sesuai desain)

### Urutan Mapel
- ✅ Urutan mapel mengikuti urutan di rombel
- ✅ Jika urutan mapel di rombel diubah, urutan di nilai juga berubah
- ✅ Nilai tetap mengikuti nama mapel, bukan urutan

### Sheet Nilai
- ✅ Sheet nilai dibuat otomatis saat pertama kali dibuka
- ✅ Format: `{rombelId}_NILAI`
- ✅ Header: `NAMA | Mapel1 | Mapel2 | ... | sakit | ijin | alpa`

---

## 🚀 Deployment

### Update Backend
```
1. Buka Google Apps Script
2. Copy-paste kode baru dari gas/Code.gs
3. Save (Ctrl+S)
4. Deploy ulang (atau buat deployment baru)
```

### Tidak Perlu Update Frontend
Frontend tidak perlu diubah karena perubahan hanya di backend.

---

## 🐛 Troubleshooting

### Mapel Masih Tidak Muncul
**Solusi:**
1. Pastikan backend sudah diupdate
2. Logout dan login ulang
3. Refresh halaman (Ctrl+R atau F5)
4. Cek apakah rombel sudah memiliki mapel

### Nilai Hilang Setelah Edit Mapel
**Penyebab:** Nama mapel berubah
**Solusi:** 
- Jangan ubah nama mapel yang sudah ada
- Jika perlu ubah, backup nilai terlebih dahulu

### Sheet Nilai Tidak Terbuat
**Penyebab:** Rombel belum memiliki mapel
**Solusi:**
1. Login sebagai admin
2. Edit rombel
3. Tambahkan minimal 1 mata pelajaran
4. Simpan

---

## ✨ Keuntungan

1. ✅ **Lebih Mudah** - Tidak perlu tambah mapel manual
2. ✅ **Lebih Cepat** - Mapel langsung tersedia
3. ✅ **Lebih Konsisten** - Mapel sama dengan rombel
4. ✅ **Auto-sync** - Perubahan mapel otomatis tersinkronisasi
5. ✅ **Aman** - Nilai yang sudah ada tidak hilang

---

**Status:** ✅ SELESAI
**Versi:** 2.0.1
**Tanggal:** 28 April 2026
