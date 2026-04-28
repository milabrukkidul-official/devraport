// ===== UPLOAD & DOWNLOAD EXCEL (SheetJS) =====
// Membutuhkan: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js

// ─── HELPER: Render tabel preview ──────────────────────────
function renderPreviewTable(headers, rows, maxRows = 6) {
  if (!rows.length) return '<p style="color:#888;font-size:0.85rem;">Tidak ada data.</p>';
  let html = `<div style="overflow-x:auto;max-height:200px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;">
    <table style="font-size:0.78rem;width:100%;border-collapse:collapse;">
      <thead><tr style="background:#1e3a5f;color:#fff;position:sticky;top:0;">`;
  headers.forEach(h => html += `<th style="padding:5px 8px;white-space:nowrap;">${h}</th>`);
  html += `</tr></thead><tbody>`;
  rows.slice(0, maxRows).forEach((r, i) => {
    html += `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">`;
    r.forEach(c => html += `<td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;">${c ?? ''}</td>`);
    html += '</tr>';
  });
  if (rows.length > maxRows) {
    html += `<tr><td colspan="${headers.length}" style="text-align:center;padding:5px;color:#888;font-size:0.78rem;font-style:italic;">
      ... dan ${rows.length - maxRows} baris lainnya</td></tr>`;
  }
  html += `</tbody></table></div>
  <p style="font-size:0.82rem;color:#16a34a;margin-top:6px;font-weight:600;">✅ ${rows.length} baris siap diimport.</p>`;
  return html;
}

// ─── HELPER: Konversi serial date Excel → string YYYY-MM-DD ─
function excelDateToString(val) {
  if (!val && val !== 0) return '';
  // Jika sudah string (misal "2010-05-17" atau "17/05/2010")
  if (typeof val === 'string') {
    // Coba parse berbagai format
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // sudah YYYY-MM-DD
    // Format DD/MM/YYYY
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return s;
  }
  // Jika number (serial date Excel)
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const mm = String(d.m).padStart(2,'0');
      const dd = String(d.d).padStart(2,'0');
      return `${d.y}-${mm}-${dd}`;
    }
  }
  // Jika Date object
  if (val instanceof Date) {
    const mm = String(val.getMonth()+1).padStart(2,'0');
    const dd = String(val.getDate()).padStart(2,'0');
    return `${val.getFullYear()}-${mm}-${dd}`;
  }
  return String(val);
}

// ─── HELPER: Buat workbook dengan styling header ────────────
function buatWorkbook(sheetName, headers, rows, kolomLebar) {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Lebar kolom otomatis
  ws['!cols'] = (kolomLebar || headers.map(() => ({ wch: 18 }))).map(w =>
    typeof w === 'number' ? { wch: w } : w
  );

  // Style header (baris pertama) — warna biru tua, teks putih, bold
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' } },
      fill:      { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left:   { style: 'thin', color: { rgb: '000000' } },
        right:  { style: 'thin', color: { rgb: '000000' } },
      }
    };
  }

  // Style baris data — border tipis, alternating color
  for (let R = 1; R <= range.e.r; R++) {
    const bg = R % 2 === 0 ? 'EFF6FF' : 'FFFFFF';
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = {
        fill:   { fgColor: { rgb: bg } },
        border: {
          top:    { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left:   { style: 'thin', color: { rgb: 'D1D5DB' } },
          right:  { style: 'thin', color: { rgb: 'D1D5DB' } },
        },
        alignment: { vertical: 'center' }
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

// ─── HELPER: Unduh workbook ─────────────────────────────────
function unduhExcel(wb, filename) {
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary', cellStyles: true });
}

// ─── HELPER: Baca file Excel → array of arrays ──────────────
function bacaExcel(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb   = XLSX.read(e.target.result, { type: 'array', cellDates: false, raw: false });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      callback(null, rows);
    } catch(err) {
      callback(err, null);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ═══════════════════════════════════════════════════════════
// TEMPLATE & UPLOAD SISWA
// ═══════════════════════════════════════════════════════════

function downloadTemplateSiswa() {
  const headers = [
    'NISN', 'No Induk', 'Nama Siswa', 'Nama Panggilan',
    'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)',
    'Nama Orang Tua', 'Pesan Wali Kelas'
  ];
  const contoh = [
    ['1234567890', '001', 'Ahmad Fauzi',  'Fauzi', 'Jakarta', '2010-05-17', 'Budi Santoso',  'Siswa rajin dan aktif'],
    ['0987654321', '002', 'Siti Rahayu',  'Siti',  'Bandung', '2010-08-23', 'Hendra Wijaya', ''],
    ['1122334455', '003', 'Budi Prasetyo', 'Budi', 'Surabaya','2010-11-01', 'Agus Wibowo',   'Perlu perhatian lebih'],
  ];
  const lebar = [14, 10, 22, 14, 14, 22, 22, 30];
  const wb = buatWorkbook('DATA SISWA', headers, contoh, lebar);
  unduhExcel(wb, 'template_siswa.xlsx');
  showToast('Template siswa diunduh!', 'success');
}

let xlsSiswaParsed = [];

function showModalUploadSiswa() {
  xlsSiswaParsed = [];
  document.getElementById('xlsSiswaFile').value = '';
  document.getElementById('xlsSiswaPreview').innerHTML = '';
  document.getElementById('btnImportSiswa').disabled = true;
  document.getElementById('modalUploadSiswa').classList.remove('hidden');
}

function previewXlsSiswa() {
  const file = document.getElementById('xlsSiswaFile').files[0];
  if (!file) { showToast('Pilih file Excel terlebih dahulu!', 'error'); return; }

  bacaExcel(file, (err, rows) => {
    if (err || rows.length < 2) {
      document.getElementById('xlsSiswaPreview').innerHTML =
        '<p style="color:#dc2626;">File tidak valid atau kosong.</p>';
      return;
    }
    const header = rows[0].map(String);
    const data   = rows.slice(1).filter(r => r[2]); // kolom 2 = Nama Siswa

    xlsSiswaParsed = data.map(r => ({
      nisn:        String(r[0] ?? ''),
      noInduk:     String(r[1] ?? ''),
      nama:        String(r[2] ?? ''),
      panggilan:   String(r[3] ?? ''),
      tempatLahir: String(r[4] ?? ''),
      tglLahir:    excelDateToString(r[5]),
      namaOrtu:    String(r[6] ?? ''),
      pesan:       String(r[7] ?? ''),
    })).filter(s => s.nama.trim());

    document.getElementById('xlsSiswaPreview').innerHTML =
      renderPreviewTable(header, data.map(r => r.map(c => c ?? '')));
    document.getElementById('btnImportSiswa').disabled = xlsSiswaParsed.length === 0;
  });
}

async function importXlsSiswa() {
  if (!xlsSiswaParsed.length) return;
  const kelasId = currentUser?.kelasId || '';
  try {
    await API.post('importSiswa', { kelasId, siswaList: JSON.stringify(xlsSiswaParsed) });
    closeModal('modalUploadSiswa');
    showToast(`${xlsSiswaParsed.length} siswa berhasil diimport!`, 'success');
    await loadSiswa();
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// TEMPLATE & UPLOAD NILAI
// ═══════════════════════════════════════════════════════════

function downloadTemplateNilai() {
  const siswa = siswaCacheList;
  const mapel = nilaiData.mapel || [];

  if (!siswa.length) {
    showToast('Muat data siswa terlebih dahulu!', 'error');
    return;
  }

  const headers = ['Nama Siswa', ...mapel, 'Sakit', 'Ijin', 'Alpa'];
  const rows = siswa.map(s => {
    const row = [s.nama];
    mapel.forEach(() => row.push(''));
    row.push('', '', '');
    return row;
  });

  // Lebar kolom: nama lebar, nilai sempit, kehadiran sempit
  const lebar = [24, ...mapel.map(() => 10), 8, 8, 8];
  const wb = buatWorkbook('REKAP NILAI', headers, rows, lebar);

  // Tambah sheet petunjuk
  const petunjukData = [
    ['PETUNJUK PENGISIAN REKAP NILAI'],
    [''],
    ['1. Isi nilai pada kolom mata pelajaran (0-100)'],
    ['2. Isi Sakit, Ijin, Alpa dengan jumlah hari'],
    ['3. Jangan mengubah nama siswa di kolom pertama'],
    ['4. Jangan menambah/menghapus kolom'],
    ['5. Simpan sebagai .xlsx lalu upload'],
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  wsPetunjuk['!cols'] = [{ wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'PETUNJUK');

  unduhExcel(wb, 'template_nilai.xlsx');
  showToast('Template nilai diunduh!', 'success');
}

let xlsNilaiParsed = { mapel: [], nilai: [] };

function showModalUploadNilai() {
  xlsNilaiParsed = { mapel: [], nilai: [] };
  document.getElementById('xlsNilaiFile').value = '';
  document.getElementById('xlsNilaiPreview').innerHTML = '';
  document.getElementById('btnImportNilai').disabled = true;
  document.getElementById('modalUploadNilai').classList.remove('hidden');
}

function previewXlsNilai() {
  const file = document.getElementById('xlsNilaiFile').files[0];
  if (!file) { showToast('Pilih file Excel terlebih dahulu!', 'error'); return; }

  bacaExcel(file, (err, rows) => {
    if (err || rows.length < 2) {
      document.getElementById('xlsNilaiPreview').innerHTML =
        '<p style="color:#dc2626;">File tidak valid atau kosong.</p>';
      return;
    }
    const header = rows[0].map(String);
    const data   = rows.slice(1).filter(r => r[0]);

    // header: ['Nama Siswa', 'Mapel1', ..., 'Sakit', 'Ijin', 'Alpa']
    // 3 kolom terakhir = Sakit, Ijin, Alpa
    const mapelCols = header.slice(1, header.length - 3);
    const baseIdx   = mapelCols.length; // index mulai Sakit di data row (offset +1 karena kolom 0 = nama)

    xlsNilaiParsed.mapel = mapelCols;
    xlsNilaiParsed.nilai = data.map(r => {
      const obj = { _nama: String(r[0] ?? '') };
      mapelCols.forEach((m, mi) => {
        const v = r[mi + 1];
        obj[mi] = (v !== '' && v !== null && v !== undefined) ? v : '';
      });
      obj['sakit'] = Number(r[baseIdx + 1]) || 0;
      obj['ijin']  = Number(r[baseIdx + 2]) || 0;
      obj['alpa']  = Number(r[baseIdx + 3]) || 0;
      return obj;
    });

    document.getElementById('xlsNilaiPreview').innerHTML =
      renderPreviewTable(header, data.map(r => r.map(c => c ?? '')));
    document.getElementById('btnImportNilai').disabled = xlsNilaiParsed.nilai.length === 0;
  });
}

async function importXlsNilai() {
  if (!xlsNilaiParsed.nilai.length) return;
  const kelasId = currentUser?.kelasId || '';

  const siswa = siswaCacheList;
  if (!siswa.length) {
    showToast('Muat data siswa terlebih dahulu!', 'error');
    return;
  }

  // Cocokkan berdasarkan nama (case-insensitive, trim)
  const nilaiByNama = {};
  xlsNilaiParsed.nilai.forEach(n => {
    nilaiByNama[n._nama.trim().toLowerCase()] = n;
  });

  const nilaiMapped = siswa.map(s => {
    return nilaiByNama[s.nama.trim().toLowerCase()] || {};
  });

  nilaiData.mapel = xlsNilaiParsed.mapel;
  nilaiData.nilai = nilaiMapped;

  try {
    await API.post('saveNilai', {
      kelasId,
      mapel: JSON.stringify(nilaiData.mapel),
      nilai: JSON.stringify(nilaiData.nilai)
    });
    closeModal('modalUploadNilai');
    showToast(`Nilai ${xlsNilaiParsed.nilai.length} siswa berhasil diimport!`, 'success');
    await loadNilai();
  } catch(e) {}
}
