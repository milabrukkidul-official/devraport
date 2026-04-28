// ===== ADMIN =====

let adminKelasCache = [];
let adminUserCache  = [];

async function loadAdminData() {
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

// ===== KELAS =====
function renderTabelKelas() {
  const tbody = document.getElementById('bodyKelas');
  tbody.innerHTML = '';
  if (!adminKelasCache.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="hint">Belum ada kelas.</td></tr>';
    return;
  }
  adminKelasCache.forEach((k, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${k.id}</strong></td>
      <td>${k.nama}</td>
      <td>${k.wali || '-'}</td>
      <td>${k.semester || ''}</td>
      <td>${k.tahun || ''}</td>
      <td>
        <button class="btn-warning" onclick="modalKelas(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        <button class="btn-danger"  onclick="hapusKelas('${k.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
      </td>`;
    // Fix: thead has 6 cols but we render 7 tds — fix header
    tbody.appendChild(tr);
  });
}

function modalKelas(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalKelasTitle').textContent = isEdit ? 'Edit Kelas' : 'Tambah Kelas';
  if (isEdit) {
    const k = adminKelasCache[idx];
    document.getElementById('mk_id').value        = k.id;
    document.getElementById('mk_id_input').value  = k.id;
    document.getElementById('mk_id_input').disabled = true;
    document.getElementById('mk_nama').value      = k.nama;
    document.getElementById('mk_wali').value      = k.wali || '';
    document.getElementById('mk_semester').value  = k.semester || 'I (GANJIL)';
    document.getElementById('mk_tahun').value     = k.tahun || '';
  } else {
    document.getElementById('mk_id').value        = '';
    document.getElementById('mk_id_input').value  = '';
    document.getElementById('mk_id_input').disabled = false;
    document.getElementById('mk_nama').value      = '';
    document.getElementById('mk_wali').value      = '';
    document.getElementById('mk_semester').value  = 'I (GANJIL)';
    document.getElementById('mk_tahun').value     = '';
  }
  document.getElementById('modalKelas').classList.remove('hidden');
}

async function simpanKelas() {
  const id       = document.getElementById('mk_id').value || document.getElementById('mk_id_input').value.trim().replace(/\s+/g,'_');
  const nama     = document.getElementById('mk_nama').value.trim();
  const wali     = document.getElementById('mk_wali').value.trim();
  const semester = document.getElementById('mk_semester').value;
  const tahun    = document.getElementById('mk_tahun').value.trim();
  if (!id || !nama) { showToast('ID dan Nama Kelas wajib diisi!', 'error'); return; }
  try {
    await API.post('saveKelas', { kelas: JSON.stringify({ id, nama, wali, semester, tahun }) });
    closeModal('modalKelas');
    showToast('Kelas disimpan!', 'success');
    await loadAdminData();
  } catch(e) {}
}

async function hapusKelas(id) {
  if (!confirm(`Hapus kelas "${id}"? Semua data kelas ini akan terhapus!`)) return;
  try {
    await API.post('deleteKelas', { kelasId: id });
    showToast('Kelas dihapus!', 'success');
    await loadAdminData();
  } catch(e) {}
}

// ===== USER =====
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
        <button class="btn-warning" onclick="modalUser(${i})" style="padding:3px 8px;font-size:0.78rem;" title="Edit User">✏️</button>
        <button class="btn-primary" onclick="modalResetPassword('${u.username}','${u.nama}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Reset Password">🔑</button>
        <button class="btn-danger"  onclick="hapusUser('${u.username}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Hapus User">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function modalUser(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalUserTitle').textContent = isEdit ? 'Edit User' : 'Tambah User';
  document.getElementById('mu_idx').value = isEdit ? idx : -1;

  // Populate kelas dropdown
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
    document.getElementById('mu_username').value  = u.username;
    document.getElementById('mu_username').disabled = true;
    document.getElementById('mu_password').value  = '';
    document.getElementById('mu_nama').value      = u.nama;
    document.getElementById('mu_role').value      = u.role;
    document.getElementById('mu_kelas').value     = u.kelasId || '';
  } else {
    document.getElementById('mu_username').value  = '';
    document.getElementById('mu_username').disabled = false;
    document.getElementById('mu_password').value  = '';
    document.getElementById('mu_nama').value      = '';
    document.getElementById('mu_role').value      = 'walikelas';
    document.getElementById('mu_kelas').value     = '';
  }
  toggleUserKelas();
  document.getElementById('modalUser').classList.remove('hidden');
}

function toggleUserKelas() {
  const role = document.getElementById('mu_role').value;
  const grp  = document.getElementById('mu_kelasGroup');
  grp.style.display = (role === 'admin') ? 'none' : 'flex';
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

// ===== RESET PASSWORD =====
function modalResetPassword(username, nama) {
  document.getElementById('rp_username').value       = username;
  document.getElementById('rp_usernameLabel').textContent = `${nama} (${username})`;
  document.getElementById('rp_newPass').value        = '';
  document.getElementById('rp_confirmPass').value    = '';
  document.getElementById('rp_error').classList.add('hidden');
  // Pastikan input kembali ke type password
  document.getElementById('rp_newPass').type = 'password';
  document.getElementById('rp_eyeBtn').textContent   = '👁️';
  document.getElementById('modalResetPass').classList.remove('hidden');
}

function togglePassVisibility(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁️';
  }
}

async function simpanResetPassword() {
  const username    = document.getElementById('rp_username').value;
  const newPass     = document.getElementById('rp_newPass').value;
  const confirmPass = document.getElementById('rp_confirmPass').value;
  const errEl       = document.getElementById('rp_error');
  errEl.classList.add('hidden');

  if (!newPass) {
    errEl.textContent = 'Password baru tidak boleh kosong.';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPass.length < 6) {
    errEl.textContent = 'Password minimal 6 karakter.';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPass !== confirmPass) {
    errEl.textContent = 'Konfirmasi password tidak cocok.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    await API.post('resetPassword', { username, newPassword: newPass });
    closeModal('modalResetPass');
    showToast(`Password ${username} berhasil direset!`, 'success');
  } catch(e) {}
}
