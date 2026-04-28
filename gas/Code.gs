// ============================================================
// GOOGLE APPS SCRIPT - RAPOR DIGITAL (Multi-Kelas + Auth)
// ============================================================
// CARA SETUP (SEKALI SAJA):
// 1. Paste kode ini di Google Apps Script
// 2. Jalankan fungsi setupSheets() SEKALI
// 3. Deploy → New Deployment → Web App
//    Execute as: Me | Who has access: Anyone
// 4. Copy URL Web App → paste ke konstanta GAS_URL di js/api.js
// 5. Commit & push ke GitHub — selesai, tidak perlu diubah lagi
// ============================================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

const SH_USERS = '_USERS';
const SH_KELAS = '_KELAS';

// ===== RESPONSE =====
function R(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SHEET HELPER =====
function getSheet(name) {
  return SS.getSheetByName(name) || SS.insertSheet(name);
}
function shName(kelasId, suffix) {
  return kelasId + '_' + suffix;
}

// ===== AUTH =====
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length < 2) return null;
  const username = parts[0];
  const users = getUsers_().users;
  const user = users.find(u => u.username === username);
  if (!user) return null;
  const expected = Utilities.base64Encode(username + ':' + user.password);
  if (parts[1] !== expected) return null;
  return user;
}
function isAdmin(token) {
  const u = verifyToken(token);
  return u && u.role === 'admin';
}
function canAccessKelas(token, kelasId) {
  const u = verifyToken(token);
  if (!u) return false;
  if (u.role === 'admin') return true;
  return u.kelasId === kelasId;
}
function canEditNilai(token, kelasId) {
  const u = verifyToken(token);
  if (!u) return false;
  if (u.role === 'admin') return true;
  return (u.role === 'walikelas' || u.role === 'guruMapel') && u.kelasId === kelasId;
}

// ===== ROUTER =====
function doGet(e) {
  const p = e.parameter;
  try {
    switch(p.action) {
      case 'login':          return R(login_(p.username, p.password, p.kelasId));
      case 'getKelasPublic': return R(getKelasPublic_());
      case 'getKelas':       return R(requireAdmin(p.token, () => getKelasPublic_()));
      case 'getUsers':       return R(requireAdmin(p.token, () => getUsers_()));
      case 'getSetting':     return R(requireKelas(p.token, p.kelasId, () => getSetting_(p.kelasId)));
      case 'getSiswa':       return R(requireKelas(p.token, p.kelasId, () => getSiswa_(p.kelasId)));
      case 'getNilai':       return R(requireNilai(p.token, p.kelasId, () => getNilai_(p.kelasId)));
      case 'getKKM':         return R(requireKelas(p.token, p.kelasId, () => getKKM_(p.kelasId)));
      case 'getEkskul':      return R(requireKelas(p.token, p.kelasId, () => getEkskul_(p.kelasId)));
      default:               return R({ error: 'Unknown action' });
    }
  } catch(err) { return R({ error: err.message }); }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  try {
    switch(body.action) {
      case 'saveKelas':     return R(requireAdmin(body.token, () => saveKelas_(body)));
      case 'deleteKelas':   return R(requireAdmin(body.token, () => deleteKelas_(body)));
      case 'saveUser':      return R(requireAdmin(body.token, () => saveUser_(body)));
      case 'deleteUser':    return R(requireAdmin(body.token, () => deleteUser_(body)));
      case 'resetPassword': return R(requireAdmin(body.token, () => resetPassword_(body)));
      case 'saveSetting':   return R(requireKelas(body.token, body.kelasId, () => saveSetting_(body)));
      case 'saveSiswa':     return R(requireKelas(body.token, body.kelasId, () => saveSiswa_(body)));
      case 'deleteSiswa':   return R(requireKelas(body.token, body.kelasId, () => deleteSiswa_(body)));
      case 'importSiswa':   return R(requireKelas(body.token, body.kelasId, () => importSiswa_(body)));
      case 'saveNilai':     return R(requireNilai(body.token, body.kelasId, () => saveNilai_(body)));
      case 'saveKKM':       return R(requireKelas(body.token, body.kelasId, () => saveKKM_(body)));
      case 'saveEkskul':    return R(requireKelas(body.token, body.kelasId, () => saveEkskul_(body)));
      default:              return R({ error: 'Unknown action' });
    }
  } catch(err) { return R({ error: err.message }); }
}

// ===== AUTH GUARDS =====
function requireAdmin(token, fn) {
  if (!isAdmin(token)) return { error: 'Akses ditolak. Hanya admin.' };
  return fn();
}
function requireKelas(token, kelasId, fn) {
  if (!canAccessKelas(token, kelasId)) return { error: 'Akses ditolak.' };
  return fn();
}
function requireNilai(token, kelasId, fn) {
  if (!canEditNilai(token, kelasId)) return { error: 'Akses ditolak.' };
  return fn();
}

// ============================================================
// LOGIN
// ============================================================
function login_(username, password, kelasId) {
  if (!username || !password) return { success: false, message: 'Username/password kosong.' };
  const { users } = getUsers_();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, message: 'Username atau password salah.' };

  if (user.role !== 'admin') {
    if (!kelasId) return { success: false, message: 'Pilih kelas terlebih dahulu.' };
    if (user.kelasId !== kelasId) return { success: false, message: 'Anda tidak memiliki akses ke kelas ini.' };
  }

  const token = user.username + ':' + Utilities.base64Encode(user.username + ':' + user.password);
  return {
    success: true,
    user: {
      username: user.username,
      nama:     user.nama,
      role:     user.role,
      kelasId:  user.role === 'admin' ? (kelasId || '') : user.kelasId,
      token:    token
    }
  };
}

// ============================================================
// KELAS
// Kolom _KELAS: id | nama | wali (username) | semester | tahun | waliNama
// waliNama = nama lengkap wali kelas (diambil otomatis dari _USERS saat saveKelas)
// ============================================================
function getKelasPublic_() {
  const sh = getSheet(SH_KELAS);
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return { kelas: [] };
  const kelas = data.slice(1).map(r => ({
    id:       String(r[0] || ''),
    nama:     String(r[1] || ''),
    wali:     String(r[2] || ''),
    semester: String(r[3] || ''),
    tahun:    String(r[4] || ''),
    waliNama: String(r[5] || '')   // nama lengkap wali kelas
  })).filter(k => k.id);
  return { kelas };
}

function saveKelas_(body) {
  const k  = JSON.parse(body.kelas);
  const sh = getSheet(SH_KELAS);
  const data = sh.getDataRange().getValues();

  // Cari nama lengkap wali kelas dari _USERS
  let waliNama = '';
  if (k.wali) {
    const { users } = getUsers_();
    const waliUser = users.find(u => u.username === k.wali);
    if (waliUser) waliNama = waliUser.nama;
  }

  let found = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === k.id) { found = i + 1; break; }
  }
  const row = [k.id, k.nama, k.wali, k.semester, k.tahun, waliNama];
  if (found > 0) {
    sh.getRange(found, 1, 1, 6).setValues([row]);
  } else {
    sh.appendRow(row);
    // Inisialisasi setting default untuk kelas baru
    initSettingKelas_(k.id, k.nama, k.semester, k.tahun);
  }
  return { success: true };
}

// Inisialisasi setting default saat kelas baru dibuat
function initSettingKelas_(kelasId, namaKelas, semester, tahun) {
  const sh = getSheet(shName(kelasId, 'SETTING'));
  if (sh.getLastRow() === 0) {
    const defaults = [
      ['urlKop',         ''],
      ['namaSatuan',     ''],
      ['namaKepala',     ''],
      ['semester',       semester || 'I (GANJIL)'],
      ['tahunPelajaran', tahun    || ''],
      ['judul',          'LAPORAN HASIL BELAJAR SISWA'],
      ['tempatRapor',    ''],
      ['tglRapor',       ''],
    ];
    sh.getRange(1, 1, defaults.length, 2).setValues(defaults);
  }
}

function deleteKelas_(body) {
  const kelasId = body.kelasId;
  const sh = getSheet(SH_KELAS);
  const data = sh.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === kelasId) { sh.deleteRow(i + 1); break; }
  }
  ['_SETTING','_SISWA','_NILAI','_KKM','_EKSKUL'].forEach(suffix => {
    const s = SS.getSheetByName(kelasId + suffix);
    if (s) SS.deleteSheet(s);
  });
  return { success: true };
}

// ============================================================
// USERS
// ============================================================
function getUsers_() {
  const sh = getSheet(SH_USERS);
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return { users: [] };
  const users = data.slice(1).map(r => ({
    username: String(r[0] || ''),
    password: String(r[1] || ''),
    nama:     String(r[2] || ''),
    role:     String(r[3] || ''),
    kelasId:  String(r[4] || '')
  })).filter(u => u.username);
  return { users };
}

function saveUser_(body) {
  const u     = JSON.parse(body.user);
  const isNew = body.isNew === true || body.isNew === 'true';
  const sh    = getSheet(SH_USERS);
  const data  = sh.getDataRange().getValues();
  let found   = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === u.username) { found = i + 1; break; }
  }
  let password = u.password;
  if (!isNew && !password && found > 0) password = String(data[found-1][1]);
  const row = [u.username, password, u.nama, u.role, u.kelasId || ''];
  if (found > 0) {
    sh.getRange(found, 1, 1, 5).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  // Update waliNama di _KELAS jika user ini adalah wali kelas
  if (u.kelasId && (u.role === 'walikelas')) {
    updateWaliNamaKelas_(u.kelasId, u.nama);
  }
  return { success: true };
}

function updateWaliNamaKelas_(kelasId, waliNama) {
  const sh   = getSheet(SH_KELAS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === kelasId) {
      sh.getRange(i + 1, 6).setValue(waliNama); // kolom 6 = waliNama
      break;
    }
  }
}

function deleteUser_(body) {
  const username = body.username;
  if (username === 'admin') return { error: 'User admin tidak bisa dihapus.' };
  const sh   = getSheet(SH_USERS);
  const data = sh.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === username) { sh.deleteRow(i + 1); break; }
  }
  return { success: true };
}

function resetPassword_(body) {
  const { username, newPassword } = body;
  if (!username || !newPassword) return { error: 'Data tidak lengkap.' };
  if (newPassword.length < 6) return { error: 'Password minimal 6 karakter.' };
  const sh   = getSheet(SH_USERS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === username) {
      sh.getRange(i + 1, 2).setValue(newPassword);
      return { success: true };
    }
  }
  return { error: 'User tidak ditemukan.' };
}

// ============================================================
// SETTING (per kelas) — auto-save dari frontend
// ============================================================
function getSetting_(kelasId) {
  const sh   = getSheet(shName(kelasId, 'SETTING'));
  const data = sh.getDataRange().getValues();
  const setting = {};
  data.forEach(r => { if (r[0]) setting[r[0]] = r[1] !== undefined ? String(r[1]) : ''; });
  return { setting };
}

function saveSetting_(body) {
  const kelasId = body.kelasId;
  const setting = JSON.parse(body.setting);
  const sh = getSheet(shName(kelasId, 'SETTING'));
  sh.clearContents();
  const rows = Object.entries(setting).map(([k, v]) => [k, v]);
  if (rows.length) sh.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

// ============================================================
// SISWA (per kelas)
// ============================================================
const SISWA_H = ['nisn','noInduk','nama','panggilan','tempatLahir','tglLahir','namaOrtu','pesan'];

function getSiswa_(kelasId) {
  const sh   = getSheet(shName(kelasId, 'SISWA'));
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return { siswa: [] };
  return {
    siswa: data.slice(1).map(r => {
      const obj = {};
      SISWA_H.forEach((h, i) => obj[h] = r[i] !== undefined ? String(r[i]) : '');
      return obj;
    }).filter(s => s.nama)
  };
}

function saveSiswa_(body) {
  const { kelasId, rowIndex } = body;
  const siswa = JSON.parse(body.siswa);
  const sh    = getSheet(shName(kelasId, 'SISWA'));
  if (sh.getLastRow() === 0) sh.appendRow(SISWA_H);
  const rowData = SISWA_H.map(h => siswa[h] || '');
  if (parseInt(rowIndex) === -1) {
    sh.appendRow(rowData);
  } else {
    sh.getRange(parseInt(rowIndex) + 2, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true };
}

function deleteSiswa_(body) {
  const sh = getSheet(shName(body.kelasId, 'SISWA'));
  sh.deleteRow(parseInt(body.rowIndex) + 2);
  return { success: true };
}

function importSiswa_(body) {
  const { kelasId } = body;
  const siswaList   = JSON.parse(body.siswaList);
  if (!siswaList || !siswaList.length) return { error: 'Data kosong.' };
  const sh = getSheet(shName(kelasId, 'SISWA'));
  if (sh.getLastRow() === 0) sh.appendRow(SISWA_H);
  const rows = siswaList.filter(s => s.nama).map(s => SISWA_H.map(h => s[h] || ''));
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, SISWA_H.length).setValues(rows);
  return { success: true, imported: rows.length };
}

// ============================================================
// NILAI (per kelas)
// ============================================================
function getNilai_(kelasId) {
  const sh       = getSheet(shName(kelasId, 'NILAI'));
  const data     = sh.getDataRange().getValues();
  const siswaRes = getSiswa_(kelasId).siswa;
  if (data.length < 2) return { mapel: [], siswa: siswaRes, nilai: [] };

  const header = data[0];
  const mapel  = header.slice(1, header.length - 3);
  const nilaiMap = {};
  data.slice(1).forEach(r => { nilaiMap[r[0]] = r.slice(1); });

  const nilai = siswaRes.map(s => {
    const row  = nilaiMap[s.nama] || [];
    const obj  = {};
    mapel.forEach((m, mi) => obj[mi] = row[mi] !== undefined ? row[mi] : '');
    const base = mapel.length;
    obj['sakit'] = row[base]   || 0;
    obj['ijin']  = row[base+1] || 0;
    obj['alpa']  = row[base+2] || 0;
    return obj;
  });
  return { mapel, siswa: siswaRes, nilai };
}

function saveNilai_(body) {
  const { kelasId } = body;
  const mapel = JSON.parse(body.mapel);
  const nilai = JSON.parse(body.nilai);
  const siswa = getSiswa_(kelasId).siswa;
  const sh    = getSheet(shName(kelasId, 'NILAI'));
  sh.clearContents();
  const header = ['NAMA', ...mapel, 'sakit', 'ijin', 'alpa'];
  const rows   = [header];
  siswa.forEach((s, si) => {
    const n   = nilai[si] || {};
    const row = [s.nama];
    mapel.forEach((m, mi) => row.push(n[mi] !== undefined ? n[mi] : ''));
    row.push(n['sakit'] || 0, n['ijin'] || 0, n['alpa'] || 0);
    rows.push(row);
  });
  sh.getRange(1, 1, rows.length, header.length).setValues(rows);
  return { success: true };
}

// ============================================================
// KKM (per kelas)
// ============================================================
function getKKM_(kelasId) {
  const sh   = getSheet(shName(kelasId, 'KKM'));
  const data = sh.getDataRange().getValues();
  const kkm  = {};
  data.forEach(r => { if (r[0]) kkm[String(r[0])] = r[1] || 70; });
  return { kkm };
}

function saveKKM_(body) {
  const { kelasId } = body;
  const kkm = JSON.parse(body.kkm);
  const sh  = getSheet(shName(kelasId, 'KKM'));
  sh.clearContents();
  const rows = Object.entries(kkm).map(([k, v]) => [k, v]);
  if (rows.length) sh.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

// ============================================================
// EKSKUL (per kelas)
// ============================================================
function getEkskul_(kelasId) {
  const sh       = getSheet(shName(kelasId, 'EKSKUL'));
  const data     = sh.getDataRange().getValues();
  const siswaRes = getSiswa_(kelasId).siswa;
  if (data.length < 2) return { kegiatan: [], siswa: siswaRes, nilai: [] };

  const kegiatan  = data[0].slice(1);
  const ekskulMap = {};
  data.slice(1).forEach(r => { ekskulMap[r[0]] = r.slice(1); });

  const nilai = siswaRes.map(s => {
    const row = ekskulMap[s.nama] || [];
    const obj = {};
    kegiatan.forEach((k, ki) => obj[ki] = row[ki] || '');
    return obj;
  });
  return { kegiatan, siswa: siswaRes, nilai };
}

function saveEkskul_(body) {
  const { kelasId } = body;
  const kegiatan = JSON.parse(body.kegiatan);
  const nilai    = JSON.parse(body.nilai);
  const siswa    = getSiswa_(kelasId).siswa;
  const sh       = getSheet(shName(kelasId, 'EKSKUL'));
  sh.clearContents();
  const header = ['NAMA', ...kegiatan];
  const rows   = [header];
  siswa.forEach((s, si) => {
    const n   = nilai[si] || {};
    const row = [s.nama];
    kegiatan.forEach((k, ki) => row.push(n[ki] || ''));
    rows.push(row);
  });
  if (rows.length > 0) sh.getRange(1, 1, rows.length, header.length).setValues(rows);
  return { success: true };
}

// ============================================================
// SETUP AWAL — Jalankan SEKALI setelah paste kode ini
// ============================================================
function setupSheets() {
  const shUsers = getSheet(SH_USERS);
  if (shUsers.getLastRow() === 0) {
    shUsers.appendRow(['username','password','nama','role','kelasId']);
    shUsers.appendRow(['admin','admin123','Administrator','admin','']);
  }

  const shKelas = getSheet(SH_KELAS);
  if (shKelas.getLastRow() === 0) {
    // Header dengan kolom waliNama
    shKelas.appendRow(['id','nama','wali','semester','tahun','waliNama']);
  }

  SpreadsheetApp.getUi().alert(
    '✅ Setup selesai!\n\n' +
    'User default:\n' +
    '  Username : admin\n' +
    '  Password : admin123\n\n' +
    'Langkah selanjutnya:\n' +
    '1. Deploy sebagai Web App (Execute as: Me, Access: Anyone)\n' +
    '2. Copy URL Web App\n' +
    '3. Paste ke konstanta GAS_URL di js/api.js\n' +
    '4. Commit & push ke GitHub\n\n' +
    'Setelah itu tidak perlu diubah lagi!'
  );
}
