// ===== ADMIN =====

let adminKelasCache = [];
let adminUserCache  = [];

async function loadAdminData() {
  // Pastikan token sudah ada sebelum request
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
  } catch(e) {}
}

// ============================================================
// KELAS — Tambah Satu
// ============================================================
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
  if (isEdit) {
    const k = adminKelasCache[idx];
    document.getElementById('mk_id').value           = k.id;
    document.getElementById('mk_id_input').value     = k.id;
    document.getElementById('mk_id_input').disabled  = true;
    document.getElementById('mk_nama').value         = k.nama;
    document.getElementById('mk_wali').value         = k.wali || '';
    document.getElementById('mk_semester').value     = k.semester || 'I (GANJIL)';
    document.getElementById('mk_tahun').value        = k.tahun || '';
  } else {
    document.getElementById('mk_id').value           = '';
    document.getElementById('mk_id_input').value     = '';
    document.getElementById('mk_id_input').disabled  = false;
    document.getElementById('mk_nama').value         = '';
    document.getElementById('mk_wali').value         = '';
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
  const wali     = document.getElementById('mk_wali').value.trim();
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
      <input type="text" id="bk_wali_${n}" placeholder="username"
        style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/>
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
      wali:     document.getElementById(`bk_wali_${i}`)?.value.trim() || '',
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

  const sel = document.getElementById('mu_kelas');
  sel.innerHTML = '<option value="">-- Tidak ada kelas --</option>';
  adminKelasCache.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = `${k.nama} (${k.id})`;
    sel.appendChild(opt);
  });

  if (isEdit) {
    const u = adminUserCache[idx];
    document.getElementById('mu_username').value    = u.username;
    document.getElementById('mu_username').disabled = true;
    document.getElementById('mu_password').value    = '';
    document.getElementById('mu_nama').value        = u.nama;
    document.getElementById('mu_role').value        = u.role;
    document.getElementById('mu_kelas').value       = u.kelasId || '';
  } else {
    document.getElementById('mu_username').value    = '';
    document.getElementById('mu_username').disabled = false;
    document.getElementById('mu_password').value    = '';
    document.getElementById('mu_nama').value        = '';
    document.getElementById('mu_role').value        = 'walikelas';
    document.getElementById('mu_kelas').value       = '';
  }
  toggleUserKelas();
  document.getElementById('modalUser').classList.remove('hidden');
}

function toggleUserKelas() {
  const role = document.getElementById('mu_role').value;
  document.getElementById('mu_kelasGroup').style.display = (role === 'admin') ? 'none' : 'flex';
}

async function simpanUser() {
  const idx      = parseInt(document.getElementById('mu_idx').value);
  const username = document.getElementById('mu_username').value.trim();
  const password = document.getElementById('mu_password').value;
  const nama     = document.getElementById('mu_nama').value.trim();
  const role     = document.getElementById('mu_role').value;
  const kelasId  = document.getElementById('mu_kelas').value;

  if (!username || !nama) { showToast('Username dan Nama wajib diisi!', 'error'); return; }
  if (idx === -1 && !password) { showToast('Password wajib diisi untuk user baru!', 'error'); return; }

  try {
    await API.post('saveUser', { user: JSON.stringify({ username, password, nama, role, kelasId }), isNew: idx === -1 });
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
