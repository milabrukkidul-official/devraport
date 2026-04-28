// ============================================================
// GOOGLE APPS SCRIPT - RAPOR DIGITAL
// Paste seluruh kode ini di Google Apps Script
// Deploy sebagai Web App: Execute as Me, Access: Anyone
// ============================================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

// ===== NAMA SHEET =====
const SHEET_SETTING  = 'SETTING';
const SHEET_SISWA    = 'DATA SISWA';
const SHEET_NILAI    = 'REKAP NILAI';
const SHEET_KKM      = 'KKM';
const SHEET_EKSKUL   = 'EKSTRAKURIKULER';

// ===== CORS HELPER =====
function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== ROUTER =====
function doGet(e) {
  const action = e.parameter.action;
  try {
    switch(action) {
      case 'getSetting': return makeResponse(getSetting());
      case 'getSiswa':   return makeResponse(getSiswa());
      case 'getNilai':   return makeResponse(getNilai());
      case 'getKKM':     return makeResponse(getKKM());
      case 'getEkskul':  return makeResponse(getEkskul());
      default:           return makeResponse({ error: 'Unknown action: ' + action });
    }
  } catch(err) {
    return makeResponse({ error: err.message });
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    switch(action) {
      case 'saveSetting': return makeResponse(saveSetting(body));
      case 'saveSiswa':   return makeResponse(saveSiswa(body));
      case 'deleteSiswa': return makeResponse(deleteSiswa(body));
      case 'saveNilai':   return makeResponse(saveNilai(body));
      case 'saveKKM':     return makeResponse(saveKKM(body));
      case 'saveEkskul':  return makeResponse(saveEkskul(body));
      default:            return makeResponse({ error: 'Unknown action: ' + action });
    }
  } catch(err) {
    return makeResponse({ error: err.message });
  }
}

// ===== HELPER: GET OR CREATE SHEET =====
function getSheet(name) {
  let sh = SS.getSheetByName(name);
  if (!sh) sh = SS.insertSheet(name);
  return sh;
}

// ============================================================
// SETTING
// ============================================================
function getSetting() {
  const sh = getSheet(SHEET_SETTING);
  const data = sh.getDataRange().getValues();
  const setting = {};
  data.forEach(row => {
    if (row[0]) setting[row[0]] = row[1] !== undefined ? row[1] : '';
  });
  return { setting };
}

function saveSetting(body) {
  const setting = JSON.parse(body.setting);
  const sh = getSheet(SHEET_SETTING);
  sh.clearContents();
  const rows = Object.entries(setting).map(([k, v]) => [k, v]);
  if (rows.length) sh.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

// ============================================================
// DATA SISWA
// ============================================================
const SISWA_HEADERS = ['nisn','noInduk','nama','panggilan','tempatLahir','tglLahir','namaOrtu','pesan'];

function getSiswa() {
  const sh = getSheet(SHEET_SISWA);
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return { siswa: [] };
  const siswa = data.slice(1).map(row => {
    const obj = {};
    SISWA_HEADERS.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]) : '');
    return obj;
  });
  return { siswa };
}

function saveSiswa(body) {
  const siswa    = JSON.parse(body.siswa);
  const rowIndex = parseInt(body.rowIndex);
  const sh = getSheet(SHEET_SISWA);

  // Pastikan header ada
  const firstRow = sh.getRange(1, 1, 1, SISWA_HEADERS.length).getValues()[0];
  if (!firstRow[0]) {
    sh.getRange(1, 1, 1, SISWA_HEADERS.length).setValues([SISWA_HEADERS]);
  }

  const rowData = SISWA_HEADERS.map(h => siswa[h] || '');
  const lastRow = sh.getLastRow();

  if (rowIndex === -1) {
    // Tambah baru
    sh.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Edit (rowIndex 0-based, data mulai baris 2)
    sh.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true };
}

function deleteSiswa(body) {
  const rowIndex = parseInt(body.rowIndex);
  const sh = getSheet(SHEET_SISWA);
  sh.deleteRow(rowIndex + 2); // +2 karena header di baris 1, data mulai baris 2
  return { success: true };
}

// ============================================================
// REKAP NILAI
// ============================================================
function getNilai() {
  const sh = getSheet(SHEET_NILAI);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return { mapel: [], siswa: [], nilai: [] };

  const header = data[0]; // ['NAMA', 'mapel1', 'mapel2', ..., 'sakit', 'ijin', 'alpa']
  const mapel  = header.slice(1, header.length - 3); // exclude 3 kolom kehadiran
  const siswaRes = getSiswa().siswa;

  const nilaiMap = {};
  data.slice(1).forEach(row => {
    const nama = row[0];
    nilaiMap[nama] = row.slice(1);
  });

  const nilai = siswaRes.map(s => {
    const row = nilaiMap[s.nama] || [];
    const obj = {};
    mapel.forEach((m, mi) => obj[mi] = row[mi] !== undefined ? row[mi] : '');
    const baseIdx = mapel.length;
    obj['sakit'] = row[baseIdx]   || 0;
    obj['ijin']  = row[baseIdx+1] || 0;
    obj['alpa']  = row[baseIdx+2] || 0;
    return obj;
  });

  return { mapel, siswa: siswaRes, nilai };
}

function saveNilai(body) {
  const mapel = JSON.parse(body.mapel);
  const nilai = JSON.parse(body.nilai);
  const siswa = getSiswa().siswa;
  const sh = getSheet(SHEET_NILAI);
  sh.clearContents();

  const header = ['NAMA', ...mapel, 'sakit', 'ijin', 'alpa'];
  const rows = [header];
  siswa.forEach((s, si) => {
    const n = nilai[si] || {};
    const row = [s.nama];
    mapel.forEach((m, mi) => row.push(n[mi] !== undefined ? n[mi] : ''));
    row.push(n['sakit'] || 0, n['ijin'] || 0, n['alpa'] || 0);
    rows.push(row);
  });
  sh.getRange(1, 1, rows.length, header.length).setValues(rows);
  return { success: true };
}

// ============================================================
// KKM
// ============================================================
function getKKM() {
  const sh = getSheet(SHEET_KKM);
  const data = sh.getDataRange().getValues();
  const kkm = {};
  data.forEach(row => {
    if (row[0]) kkm[row[0]] = row[1] || 70;
  });
  return { kkm };
}

function saveKKM(body) {
  const kkm = JSON.parse(body.kkm);
  const sh = getSheet(SHEET_KKM);
  sh.clearContents();
  const rows = Object.entries(kkm).map(([k, v]) => [k, v]);
  if (rows.length) sh.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

// ============================================================
// EKSTRAKURIKULER
// ============================================================
function getEkskul() {
  const sh = getSheet(SHEET_EKSKUL);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return { kegiatan: [], siswa: [], nilai: [] };

  const header   = data[0];
  const kegiatan = header.slice(1);
  const siswaRes = getSiswa().siswa;

  const ekskulMap = {};
  data.slice(1).forEach(row => {
    ekskulMap[row[0]] = row.slice(1);
  });

  const nilai = siswaRes.map(s => {
    const row = ekskulMap[s.nama] || [];
    const obj = {};
    kegiatan.forEach((k, ki) => obj[ki] = row[ki] || '');
    return obj;
  });

  return { kegiatan, siswa: siswaRes, nilai };
}

function saveEkskul(body) {
  const kegiatan = JSON.parse(body.kegiatan);
  const nilai    = JSON.parse(body.nilai);
  const siswa    = getSiswa().siswa;
  const sh = getSheet(SHEET_EKSKUL);
  sh.clearContents();

  const header = ['NAMA', ...kegiatan];
  const rows = [header];
  siswa.forEach((s, si) => {
    const n = nilai[si] || {};
    const row = [s.nama];
    kegiatan.forEach((k, ki) => row.push(n[ki] || ''));
    rows.push(row);
  });
  if (rows.length > 1) {
    sh.getRange(1, 1, rows.length, header.length).setValues(rows);
  } else {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
  }
  return { success: true };
}

// ============================================================
// SETUP AWAL - Jalankan sekali untuk membuat semua sheet
// ============================================================
function setupSheets() {
  [SHEET_SETTING, SHEET_SISWA, SHEET_NILAI, SHEET_KKM, SHEET_EKSKUL].forEach(name => {
    if (!SS.getSheetByName(name)) SS.insertSheet(name);
  });
  // Header SETTING
  const shSetting = SS.getSheetByName(SHEET_SETTING);
  if (shSetting.getLastRow() === 0) {
    shSetting.getRange('A1:B10').setValues([
      ['urlKop', ''],
      ['namaSatuan', 'MI/MTs/MA ...'],
      ['namaKepala', 'Nama Kepala Madrasah'],
      ['namaKelas', 'Kelas 1A'],
      ['namaWali', 'Nama Wali Kelas'],
      ['semester', 'I (GANJIL)'],
      ['tahunPelajaran', '2024/2025'],
      ['judul', 'LAPORAN HASIL BELAJAR SISWA'],
      ['tempatRapor', 'Nama Kota'],
      ['tglRapor', ''],
    ]);
  }
  // Header SISWA
  const shSiswa = SS.getSheetByName(SHEET_SISWA);
  if (shSiswa.getLastRow() === 0) {
    shSiswa.getRange(1, 1, 1, 8).setValues([['nisn','noInduk','nama','panggilan','tempatLahir','tglLahir','namaOrtu','pesan']]);
  }
  SpreadsheetApp.getUi().alert('Setup selesai! Semua sheet telah dibuat.');
}
