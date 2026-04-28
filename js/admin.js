// ===== ADMIN =====

let adminKelasCache = [];
let adminUserCache  = [];

async function loadAdminData() {
  const token = API.getToken();
  if (!token) {
    showToast('Sesi tidak valid, silakan login ulang.', 'error');
    return;
  }
  try {
    const [kRes, uRes] = await Promise.all([
      API.call('getKelas'),
      API.call('getUsers')
    ]);
    adminKelasCache = kRes.kelas || [];
    adminUserCache  = uRes.users || [];
    renderTabelKelas();
    renderTabelUser();
    onKelasListLoaded(adminKelasCache);
    populateMapelKelasSelect();
    await loadRombelAdmin();
  } catch(e) {}
}

// ============================================================
// KELAS — Tambah Satu
// ============================================================

// Helper: bangun <option> list dari user role walikelas
function buildWaliOptions(selectedUsername = '') {
  const waliList = adminUserCache.filter(u => u.role === 'walikelas');
  let opts = '<option value="">-- Pilih Wali Kelas (opsional) --</option>';
  waliList.forEach(u => {
    const sel = u.username === selectedUsername ? 'selected' : '';
    opts += `<option value="${u.username}" ${sel}>${u.nama} (${u.username})</option>`;
  });
  if (!waliList.length) {
    opts += '<option value="" disabled>Belum ada user Wali Kelas</option>';
  }
  return opts;
}

// Helper: bangun <select> wali kelas inline untuk bulk (string HTML)
function buildWaliSelect(id, selectedUsername = '') {
  const waliList = adminUserCache.filter(u => u.role === 'walikelas');
  let html = `<select id="${id}" style="width:100%;padding:5px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.78rem;">
    <option value="">-- Pilih --</option>`;
  waliList.forEach(u => {
    const sel = u.username === selectedUsername ? 'selected' : '';
    html += `<option value="${u.username}" ${sel}>${u.nama}</option>`;
  });
  html += '</select>';
  return html;
}
function renderTabelKelas() {
  const tbody = document.getElementById('bodyKelas');
  tbody.innerHTML = '';
  if (!adminKelasCache.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="hint">Belum ada kelas. Klik "Tambah Kelas" atau "Tambah Banyak Kelas".</td></tr>';
    return;
  }
  adminKelasCache.forEach((k, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${k.id}</strong></td>
      <td>${k.nama}</td>
      <td>${k.waliNama || k.wali || '-'}</td>
      <td>${k.semester || ''}</td>
      <td>${k.tahun || ''}</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalKelas(${i})" style="padding:3px 8px;font-size:0.78rem;" title="Edit">✏️</button>
        <button class="btn-danger"  onclick="hapusKelas('${k.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Hapus">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function modalKelas(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalKelasTitle').textContent = isEdit ? 'Edit Kelas' : 'Tambah Kelas';

  // Populate dropdown wali kelas dari user role walikelas
  document.getElementById('mk_wali').innerHTML = buildWaliOptions();

  if (isEdit) {
    const k = adminKelasCache[idx];
    document.getElementById('mk_id').value           = k.id;
    document.getElementById('mk_id_input').value     = k.id;
    document.getElementById('mk_id_input').disabled  = true;
    document.getElementById('mk_nama').value         = k.nama;
    document.getElementById('mk_wali').innerHTML     = buildWaliOptions(k.wali);
    document.getElementById('mk_semester').value     = k.semester || 'I (GANJIL)';
    document.getElementById('mk_tahun').value        = k.tahun || '';
  } else {
    document.getElementById('mk_id').value           = '';
    document.getElementById('mk_id_input').value     = '';
    document.getElementById('mk_id_input').disabled  = false;
    document.getElementById('mk_nama').value         = '';
    document.getElementById('mk_semester').value     = 'I (GANJIL)';
    document.getElementById('mk_tahun').value        = '';
  }
  document.getElementById('modalKelas').classList.remove('hidden');
}

// Auto-isi nama kelas dari ID saat mengetik ID
function autoNamaKelas() {
  const idVal  = document.getElementById('mk_id_input').value;
  const namaEl = document.getElementById('mk_nama');
  if (!namaEl.value) {
    // Ubah "kelas_1a" → "Kelas 1A"
    namaEl.value = idVal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

async function simpanKelas() {
  const id       = (document.getElementById('mk_id').value || document.getElementById('mk_id_input').value).trim().replace(/\s+/g,'_');
  const nama     = document.getElementById('mk_nama').value.trim();
  const wali     = document.getElementById('mk_wali').value;   // value dari <select>
  const semester = document.getElementById('mk_semester').value;
  const tahun    = document.getElementById('mk_tahun').value.trim();

  if (!id)   { showToast('ID Kelas wajib diisi!', 'error'); return; }
  if (!nama) { showToast('Nama Kelas wajib diisi!', 'error'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(id)) {
    showToast('ID Kelas hanya boleh huruf, angka, dan underscore!', 'error'); return;
  }

  try {
    await API.post('saveKelas', { kelas: JSON.stringify({ id, nama, wali, semester, tahun }) });
    closeModal('modalKelas');
    showToast(`Kelas "${nama}" berhasil disimpan!`, 'success');
    await loadAdminData();
  } catch(e) {}
}

async function hapusKelas(id) {
  if (!confirm(`Hapus kelas "${id}"?\n\nSEMUA data kelas ini (siswa, nilai, ekskul, KKM, setting) akan terhapus permanen!`)) return;
  try {
    await API.post('deleteKelas', { kelasId: id });
    showToast('Kelas dihapus!', 'success');
    await loadAdminData();
  } catch(e) {}
}

// ============================================================
// KELAS — Tambah Banyak Sekaligus (Bulk)
// ============================================================
let bulkKelasRows = 0;

function modalBulkKelas() {
  bulkKelasRows = 0;
  document.getElementById('bulkKelasBody').innerHTML = '';
  document.getElementById('bulkKelasError').textContent = '';
  document.getElementById('bk_tahunDefault').value = '';
  document.getElementById('bk_semesterDefault').value = 'I (GANJIL)';
  // Tambah 3 baris awal
  tambahBarisBulk();
  tambahBarisBulk();
  tambahBarisBulk();
  document.getElementById('modalBulkKelas').classList.remove('hidden');
}

function tambahBarisBulk() {
  bulkKelasRows++;
  const n   = bulkKelasRows;
  const sem = document.getElementById('bk_semesterDefault')?.value || 'I (GANJIL)';
  const thn = document.getElementById('bk_tahunDefault')?.value || '';
  const tbody = document.getElementById('bulkKelasBody');
  const tr = document.createElement('tr');
  tr.id = `bkRow_${n}`;
  tr.style.background = n % 2 === 0 ? '#f8fafc' : '#fff';
  tr.innerHTML = `
    <td style="padding:4px 6px;text-align:center;color:#888;">${n}</td>
    <td style="padding:4px 6px;">
      <input type="text" id="bk_id_${n}" placeholder="kelas_1a"
        style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"
        oninput="autoNamaBulk(${n})"/>
    </td>
    <td style="padding:4px 6px;">
      <input type="text" id="bk_nama_${n}" placeholder="Kelas 1A"
        style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/>
    </td>
    <td style="padding:4px 6px;">
      ${buildWaliSelect(`bk_wali_${n}`)}
    </td>
    <td style="padding:4px 6px;">
      <select id="bk_sem_${n}" style="width:100%;padding:5px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.78rem;">
        <option value="I (GANJIL)"  ${sem==='I (GANJIL)' ?'selected':''}>I (GANJIL)</option>
        <option value="II (GENAP)"  ${sem==='II (GENAP)' ?'selected':''}>II (GENAP)</option>
      </select>
    </td>
    <td style="padding:4px 6px;">
      <input type="text" id="bk_thn_${n}" value="${thn}" placeholder="2024/2025"
        style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/>
    </td>
    <td style="padding:4px 6px;text-align:center;">
      <button onclick="hapusBarisBulk(${n})" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;font-size:0.8rem;">✖</button>
    </td>`;
  tbody.appendChild(tr);
}

function hapusBarisBulk(n) {
  const row = document.getElementById(`bkRow_${n}`);
  if (row) row.remove();
}

function autoNamaBulk(n) {
  const idVal  = document.getElementById(`bk_id_${n}`)?.value || '';
  const namaEl = document.getElementById(`bk_nama_${n}`);
  if (namaEl && !namaEl.value) {
    namaEl.value = idVal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

function applyDefaultBulk() {
  const sem = document.getElementById('bk_semesterDefault').value;
  const thn = document.getElementById('bk_tahunDefault').value;
  for (let i = 1; i <= bulkKelasRows; i++) {
    const semEl = document.getElementById(`bk_sem_${i}`);
    const thnEl = document.getElementById(`bk_thn_${i}`);
    if (semEl) semEl.value = sem;
    if (thnEl) thnEl.value = thn;
  }
  showToast('Default diterapkan ke semua baris!', 'success');
}

async function simpanBulkKelas() {
  const errEl = document.getElementById('bulkKelasError');
  errEl.textContent = '';

  // Kumpulkan semua baris yang terisi
  const kelasList = [];
  const idSet = new Set();

  for (let i = 1; i <= bulkKelasRows; i++) {
    const idEl = document.getElementById(`bk_id_${i}`);
    if (!idEl) continue; // baris dihapus
    const id   = idEl.value.trim().replace(/\s+/g,'_');
    const nama = document.getElementById(`bk_nama_${i}`)?.value.trim() || '';
    if (!id && !nama) continue; // baris kosong, skip

    if (!id) { errEl.textContent = `Baris ${i}: ID Kelas wajib diisi!`; return; }
    if (!nama) { errEl.textContent = `Baris ${i}: Nama Kelas wajib diisi!`; return; }
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
      errEl.textContent = `Baris ${i}: ID "${id}" hanya boleh huruf, angka, underscore!`; return;
    }
    if (idSet.has(id)) {
      errEl.textContent = `ID "${id}" duplikat! Setiap kelas harus punya ID unik.`; return;
    }
    idSet.add(id);

    kelasList.push({
      id,
      nama,
      wali:     document.getElementById(`bk_wali_${i}`)?.value || '',
      semester: document.getElementById(`bk_sem_${i}`)?.value || 'I (GANJIL)',
      tahun:    document.getElementById(`bk_thn_${i}`)?.value.trim() || '',
    });
  }

  if (!kelasList.length) {
    errEl.textContent = 'Tidak ada kelas yang diisi!'; return;
  }

  // Cek duplikat dengan kelas yang sudah ada
  const existingIds = adminKelasCache.map(k => k.id);
  const duplikat = kelasList.filter(k => existingIds.includes(k.id));
  if (duplikat.length) {
    errEl.textContent = `ID sudah ada: ${duplikat.map(k=>k.id).join(', ')}. Gunakan ID lain atau edit kelas yang ada.`;
    return;
  }

  // Simpan satu per satu (GAS tidak support batch insert kelas karena tiap kelas buat sheet baru)
  showLoading(true);
  let berhasil = 0;
  const gagal  = [];
  for (const k of kelasList) {
    try {
      await API.post('saveKelas', { kelas: JSON.stringify(k) });
      berhasil++;
    } catch(e) {
      gagal.push(k.id);
    }
  }
  showLoading(false);

  closeModal('modalBulkKelas');
  if (gagal.length) {
    showToast(`${berhasil} kelas disimpan, ${gagal.length} gagal: ${gagal.join(', ')}`, 'error');
  } else {
    showToast(`✅ ${berhasil} kelas berhasil ditambahkan!`, 'success');
  }
  await loadAdminData();
}

// ============================================================
// USER
// ============================================================
function renderTabelUser() {
  const tbody = document.getElementById('bodyUser');
  tbody.innerHTML = '';
  if (!adminUserCache.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="hint">Belum ada user.</td></tr>';
    return;
  }
  const roleLabel = { admin: '🔴 Admin', walikelas: '🟡 Wali Kelas', guruMapel: '🟢 Guru Mapel' };
  adminUserCache.forEach((u, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${u.username}</strong></td>
      <td>${u.nama}</td>
      <td>${roleLabel[u.role] || u.role}</td>
      <td>${u.kelasId || '-'}</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalUser(${i})" style="padding:3px 8px;font-size:0.78rem;" title="Edit">✏️</button>
        <button class="btn-primary" onclick="modalResetPassword('${u.username}','${u.nama}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Reset Password">🔑</button>
        <button class="btn-danger"  onclick="hapusUser('${u.username}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Hapus">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function modalUser(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalUserTitle').textContent = isEdit ? 'Edit User' : 'Tambah User';
  document.getElementById('mu_idx').value = isEdit ? idx : -1;

  if (isEdit) {
    const u = adminUserCache[idx];
    document.getElementById('mu_username').value    = u.username;
    document.getElementById('mu_username').disabled = true;
    document.getElementById('mu_password').value    = '';
    document.getElementById('mu_nama').value        = u.nama;
    document.getElementById('mu_role').value        = u.role;
  } else {
    document.getElementById('mu_username').value    = '';
    document.getElementById('mu_username').disabled = false;
    document.getElementById('mu_password').value    = '';
    document.getElementById('mu_nama').value        = '';
    document.getElementById('mu_role').value        = 'walikelas';
  }
  document.getElementById('modalUser').classList.remove('hidden');
}

function toggleUserKelas() {} // tidak dipakai lagi, dibiarkan kosong agar tidak error jika ada referensi lama

async function simpanUser() {
  const idx      = parseInt(document.getElementById('mu_idx').value);
  const username = document.getElementById('mu_username').value.trim();
  const password = document.getElementById('mu_password').value;
  const nama     = document.getElementById('mu_nama').value.trim();
  const role     = document.getElementById('mu_role').value;

  if (!username || !nama) { showToast('Username dan Nama wajib diisi!', 'error'); return; }
  if (idx === -1 && !password) { showToast('Password wajib diisi untuk user baru!', 'error'); return; }

  try {
    // kelasId tidak dikirim dari sini — dikelola lewat Kelola Kelas
    await API.post('saveUser', { user: JSON.stringify({ username, password, nama, role, kelasId: '' }), isNew: idx === -1 });
    closeModal('modalUser');
    showToast('User disimpan!', 'success');
    await loadAdminData();
  } catch(e) {}
}

async function hapusUser(username) {
  if (username === 'admin') { showToast('User admin tidak bisa dihapus!', 'error'); return; }
  if (!confirm(`Hapus user "${username}"?`)) return;
  try {
    await API.post('deleteUser', { username });
    showToast('User dihapus!', 'success');
    await loadAdminData();
  } catch(e) {}
}

// ============================================================
// RESET PASSWORD
// ============================================================
function modalResetPassword(username, nama) {
  document.getElementById('rp_username').value             = username;
  document.getElementById('rp_usernameLabel').textContent  = `${nama} (${username})`;
  document.getElementById('rp_newPass').value              = '';
  document.getElementById('rp_confirmPass').value          = '';
  document.getElementById('rp_error').classList.add('hidden');
  document.getElementById('rp_newPass').type               = 'password';
  document.getElementById('rp_eyeBtn').textContent         = '👁️';
  document.getElementById('modalResetPass').classList.remove('hidden');
}

function togglePassVisibility(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁️'; }
}

async function simpanResetPassword() {
  const username    = document.getElementById('rp_username').value;
  const newPass     = document.getElementById('rp_newPass').value;
  const confirmPass = document.getElementById('rp_confirmPass').value;
  const errEl       = document.getElementById('rp_error');
  errEl.classList.add('hidden');

  if (!newPass)              { errEl.textContent = 'Password baru tidak boleh kosong.';    errEl.classList.remove('hidden'); return; }
  if (newPass.length < 6)    { errEl.textContent = 'Password minimal 6 karakter.';         errEl.classList.remove('hidden'); return; }
  if (newPass !== confirmPass){ errEl.textContent = 'Konfirmasi password tidak cocok.';    errEl.classList.remove('hidden'); return; }

  try {
    await API.post('resetPassword', { username, newPassword: newPass });
    closeModal('modalResetPass');
    showToast(`Password ${username} berhasil direset!`, 'success');
  } catch(e) {}
}

// ============================================================
// KELOLA MAPEL (hanya admin)
// ============================================================

let mapelAdminData = []; // mapel aktif untuk kelas yang dipilih

function populateMapelKelasSelect() {
  const sel = document.getElementById('mapelKelasSelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  adminKelasCache.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = `${k.nama} (${k.id})`;
    if (k.id === prev) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function loadMapelAdmin() {
  const kelasId = document.getElementById('mapelKelasSelect').value;
  if (!kelasId) {
    document.getElementById('mapelAdminContainer').innerHTML = '<p class="hint">Pilih kelas terlebih dahulu.</p>';
    return;
  }
  try {
    const data = await API.call('getNilai', { kelasId });
    mapelAdminData = data.mapel || [];
    renderMapelAdmin();
    showToast('Mapel dimuat!', 'success');
  } catch(e) {}
}

function renderMapelAdmin() {
  const container = document.getElementById('mapelAdminContainer');
  if (!mapelAdminData.length) {
    container.innerHTML = '<p class="hint">Belum ada mata pelajaran. Klik "Tambah Mapel".</p>';
    return;
  }
  let html = `<table>
    <thead><tr><th style="width:40px;">No</th><th>Nama Mata Pelajaran</th><th style="width:80px;">Urutan</th><th style="width:60px;">Hapus</th></tr></thead>
    <tbody>`;
  mapelAdminData.forEach((m, i) => {
    html += `<tr>
      <td>${i+1}</td>
      <td><input type="text" value="${m}" onchange="updateMapelAdmin(${i}, this.value)"
          style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:0.85rem;"/></td>
      <td style="text-align:center;">
        <button onclick="naikkMapel(${i})" style="background:none;border:none;cursor:pointer;font-size:1rem;" title="Naik">⬆️</button>
        <button onclick="turunMapel(${i})" style="background:none;border:none;cursor:pointer;font-size:1rem;" title="Turun">⬇️</button>
      </td>
      <td style="text-align:center;">
        <button class="btn-danger" onclick="hapusMapelAdmin(${i})" style="padding:3px 8px;font-size:0.78rem;">✖</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function updateMapelAdmin(i, val) {
  mapelAdminData[i] = val.trim();
}

function tambahMapelAdmin() {
  const nama = prompt('Nama Mata Pelajaran:');
  if (!nama || !nama.trim()) return;
  mapelAdminData.push(nama.trim());
  renderMapelAdmin();
}

function hapusMapelAdmin(i) {
  if (!confirm(`Hapus mata pelajaran "${mapelAdminData[i]}"?\nSemua nilai mapel ini di kelas ini akan hilang!`)) return;
  mapelAdminData.splice(i, 1);
  renderMapelAdmin();
}

function naikkMapel(i) {
  if (i === 0) return;
  [mapelAdminData[i-1], mapelAdminData[i]] = [mapelAdminData[i], mapelAdminData[i-1]];
  renderMapelAdmin();
}

function turunMapel(i) {
  if (i >= mapelAdminData.length - 1) return;
  [mapelAdminData[i], mapelAdminData[i+1]] = [mapelAdminData[i+1], mapelAdminData[i]];
  renderMapelAdmin();
}

async function saveMapelAdmin() {
  const kelasId = document.getElementById('mapelKelasSelect').value;
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  if (!mapelAdminData.length) { showToast('Minimal 1 mata pelajaran!', 'error'); return; }
  try {
    // Simpan hanya struktur mapel, nilai tetap dipertahankan
    await API.post('saveMapel', { kelasId, mapel: JSON.stringify(mapelAdminData) });
    showToast(`Mapel kelas berhasil disimpan!`, 'success');
  } catch(e) {}
}

// Salin mapel ke kelas lain
function modalSalinMapel() {
  const kelasId = document.getElementById('mapelKelasSelect').value;
  if (!kelasId) { showToast('Pilih kelas sumber terlebih dahulu!', 'error'); return; }
  if (!mapelAdminData.length) { showToast('Muat mapel kelas sumber terlebih dahulu!', 'error'); return; }

  document.getElementById('salinDariLabel').textContent = kelasId;
  document.getElementById('salinError').textContent = '';

  const box = document.getElementById('salinKelasCheckboxes');
  box.innerHTML = '';
  adminKelasCache
    .filter(k => k.id !== kelasId)
    .forEach(k => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;';
      label.innerHTML = `<input type="checkbox" value="${k.id}" style="width:16px;height:16px;"/>
        <span>${k.nama} <small style="color:#888;">(${k.id})</small></span>`;
      box.appendChild(label);
    });

  if (!box.children.length) {
    box.innerHTML = '<p style="color:#888;font-size:0.85rem;">Tidak ada kelas lain.</p>';
  }
  document.getElementById('modalSalinMapel').classList.remove('hidden');
}

async function eksekusiSalinMapel() {
  const targets = [...document.querySelectorAll('#salinKelasCheckboxes input:checked')].map(c => c.value);
  if (!targets.length) {
    document.getElementById('salinError').textContent = 'Pilih minimal 1 kelas tujuan!';
    return;
  }
  showLoading(true);
  let berhasil = 0, gagal = [];
  for (const kelasId of targets) {
    try {
      await API.post('saveMapel', { kelasId, mapel: JSON.stringify(mapelAdminData) });
      berhasil++;
    } catch { gagal.push(kelasId); }
  }
  showLoading(false);
  closeModal('modalSalinMapel');
  if (gagal.length) {
    showToast(`${berhasil} berhasil, gagal: ${gagal.join(', ')}`, 'error');
  } else {
    showToast(`✅ Mapel disalin ke ${berhasil} kelas!`, 'success');
  }
}

// ============================================================
// ROMBEL (Rombongan Belajar)
// ============================================================

let rombelCache = [];

async function loadRombelAdmin() {
  try {
    const data = await API.call('getRombel');
    rombelCache = data.rombel || [];
    renderTabelRombel();
    populateRombelSelect();
  } catch(e) {}
}

function renderTabelRombel() {
  const tbody = document.getElementById('bodyRombel');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!rombelCache.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="hint">Belum ada rombel.</td></tr>';
    return;
  }
  rombelCache.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${r.id}</strong></td>
      <td>${r.nama}</td>
      <td>${r.mapel.length} mapel</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalRombel(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        <button class="btn-danger"  onclick="hapusRombel('${r.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function populateRombelSelect() {
  const sel = document.getElementById('mapelRombelSelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">-- Pilih Rombel --</option>';
  rombelCache.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.nama} (${r.mapel.length} mapel)`;
    if (r.id === prev) opt.selected = true;
    sel.appendChild(opt);
  });
}

// Modal tambah/edit rombel
let rombelMapelTemp = [];

function modalRombel(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalRombelTitle').textContent = isEdit ? 'Edit Rombel' : 'Tambah Rombel';
  if (isEdit) {
    const r = rombelCache[idx];
    document.getElementById('mr_id_hidden').value = r.id;
    document.getElementById('mr_id').value        = r.id;
    document.getElementById('mr_id').disabled     = true;
    document.getElementById('mr_nama').value      = r.nama;
    rombelMapelTemp = [...r.mapel];
  } else {
    document.getElementById('mr_id_hidden').value = '';
    document.getElementById('mr_id').value        = '';
    document.getElementById('mr_id').disabled     = false;
    document.getElementById('mr_nama').value      = '';
    rombelMapelTemp = [];
  }
  renderRombelMapelList();
  document.getElementById('modalRombel').classList.remove('hidden');
}

function renderRombelMapelList() {
  const container = document.getElementById('rombelMapelList');
  if (!rombelMapelTemp.length) {
    container.innerHTML = '<p style="color:#888;font-size:0.83rem;padding:8px;">Belum ada mata pelajaran.</p>';
    return;
  }
  container.innerHTML = rombelMapelTemp.map((m, i) => `
    <div style="display:flex;gap:6px;align-items:center;">
      <span style="color:#888;font-size:0.8rem;min-width:24px;">${i+1}.</span>
      <input type="text" value="${m}" onchange="updateMapelRombel(${i},this.value)"
        style="flex:1;padding:5px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:0.85rem;"/>
      <button onclick="naikkMapelRombel(${i})" style="background:none;border:none;cursor:pointer;font-size:0.9rem;" title="Naik">⬆️</button>
      <button onclick="turunMapelRombel(${i})" style="background:none;border:none;cursor:pointer;font-size:0.9rem;" title="Turun">⬇️</button>
      <button onclick="hapusMapelRombel(${i})" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:0.8rem;">✖</button>
    </div>`).join('');
}

function tambahMapelRombel() {
  const nama = prompt('Nama Mata Pelajaran:');
  if (!nama || !nama.trim()) return;
  rombelMapelTemp.push(nama.trim());
  renderRombelMapelList();
}
function updateMapelRombel(i, val) { rombelMapelTemp[i] = val.trim(); }
function hapusMapelRombel(i)  { rombelMapelTemp.splice(i,1); renderRombelMapelList(); }
function naikkMapelRombel(i)  { if(i>0){[rombelMapelTemp[i-1],rombelMapelTemp[i]]=[rombelMapelTemp[i],rombelMapelTemp[i-1]];renderRombelMapelList();} }
function turunMapelRombel(i)  { if(i<rombelMapelTemp.length-1){[rombelMapelTemp[i],rombelMapelTemp[i+1]]=[rombelMapelTemp[i+1],rombelMapelTemp[i]];renderRombelMapelList();} }

async function simpanRombel() {
  const id   = (document.getElementById('mr_id_hidden').value || document.getElementById('mr_id').value).trim().replace(/\s+/g,'_');
  const nama = document.getElementById('mr_nama').value.trim();
  if (!id)   { showToast('ID Rombel wajib diisi!', 'error'); return; }
  if (!nama) { showToast('Nama Rombel wajib diisi!', 'error'); return; }
  if (!rombelMapelTemp.length) { showToast('Minimal 1 mata pelajaran!', 'error'); return; }
  try {
    await API.post('saveRombel', { rombel: JSON.stringify({ id, nama, mapel: rombelMapelTemp }) });
    closeModal('modalRombel');
    showToast(`Rombel "${nama}" disimpan!`, 'success');
    await loadRombelAdmin();
  } catch(e) {}
}

async function hapusRombel(id) {
  if (!confirm(`Hapus rombel "${id}"?`)) return;
  try {
    await API.post('deleteRombel', { rombelId: id });
    showToast('Rombel dihapus!', 'success');
    await loadRombelAdmin();
  } catch(e) {}
}

// Terapkan mapel dari rombel ke kelas yang dipilih di tab Mapel
async function terapkanRombelKeKelas() {
  const rombelId = document.getElementById('mapelRombelSelect').value;
  const kelasId  = document.getElementById('mapelKelasSelect').value;
  if (!rombelId) { showToast('Pilih rombel terlebih dahulu!', 'error'); return; }
  if (!kelasId)  { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }

  const rombel = rombelCache.find(r => r.id === rombelId);
  if (!rombel)  { showToast('Rombel tidak ditemukan!', 'error'); return; }

  if (!confirm(`Terapkan ${rombel.mapel.length} mapel dari Rombel "${rombel.nama}" ke kelas "${kelasId}"?\nNilai yang sudah ada akan dipertahankan.`)) return;

  mapelAdminData = [...rombel.mapel];
  renderMapelAdmin();
  showToast(`Mapel dari Rombel "${rombel.nama}" diterapkan. Klik Simpan untuk menyimpan.`, 'success');
}
