# Ringkasan Perubahan: Menghapus Konsep "Kelas" dan Menggunakan "Rombel"

## Status Perubahan

### ✅ SUDAH SELESAI:
1. index.html - Hapus bagian Daftar Kelas dari tab admin
2. index.html - Hapus modal Kelas dan Bulk Kelas
3. index.html - Update tab label menjadi "Kelola Rombel"
4. index.html - Update semua selector dari adminKelasBar/adminKelasSelect menjadi adminRombelBar/adminRombelSelect untuk halaman: siswa, nilai, ekskul, kkm, cetak
5. index.html - Update peringatan dari siswaKelasWarning menjadi siswaRombelWarning
6. app.js - Update fungsi getActiveKelasId menjadi getActiveRombelId
7. app.js - Update fungsi populateAdminKelasSelectors menjadi populateAdminRombelSelectors
8. siswa.js - Update loadSiswa, simpanSiswa, hapusSiswa untuk menggunakan getActiveRombelId
9. upload.js - Update downloadTemplateSiswa untuk menggunakan getActiveRombelId dan info rombel

### ⚠️ MASIH PERLU DIUBAH:
1. upload.js - showModalUploadSiswa, importXlsSiswa, importXlsNilai
2. nilai.js - loadNilai, saveNilai
3. kkm.js - loadKKM, saveKKM
4. ekskul.js - loadEkskul, saveEkskul
5. cetak.js - loadCetakData
6. index.html - uploadSiswaKelasInfo menjadi uploadSiswaRombelInfo
7. admin.js - Hapus semua fungsi terkait kelas (renderTabelKelas, modalKelas, simpanKelas, hapusKelas, modalBulkKelas, dll)
8. auth.js - Update referensi kelasId menjadi rombelId untuk user
9. gas/Code.gs - Perlu update backend untuk menghapus sheet _KELAS dan menggunakan _ROMBEL

## Catatan Penting:
- Backend (Google Apps Script) juga perlu diupdate untuk menghapus konsep kelas
- User dengan role "walikelas" sekarang akan memiliki field "rombelId" bukan "kelasId"
- Semua API call yang menggunakan parameter "kelasId" tetap menggunakan nama yang sama di backend untuk kompatibilitas, tapi nilainya adalah rombelId
