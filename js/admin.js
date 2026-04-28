// ===== ADMIN =====

let adminKelasCache = [];
let adminUserCache  = [];

async function loadAdminData() {
  const token = API.getToken();
  if (!token) { showToast('Sesi tidak valid, silakan login ulang.', 'error'); return; }
  try {
    const [kRes, uRes, rRes] = await Promise.all([
      API.call('getKelas'),
      API.call('getUsers'),
      API.call('getRombel')
    ]);
    adminKelasCache = kRes.kelas || [];
    adminUserCache  = uRes.users || [];
    rombelCache     = rRes.rombel || [];
    renderTabelRombel();
    renderTabelKelas();
    renderTabelUser();
    onRombelListLoaded(rombelCache);
  } catch(e) {}
}

// ============================================================
// HELPERS
// ============================================================
function buildWaliOptions(sel = '') {
  const list = adminUserCache.filter(u => u.role === 'walikelas');
  let o = '<option value="">-- Pilih Wali Kelas (opsional) --</option>';
  list.forEach(u => { o += `<option value="${u.username}" ${u.username===sel?'selected':''}>${u.nama} (${u.username})</option>`; });
  if (!list.length) o += '<option value="" disabled>Belum ada user Wali Kelas</option>';
  return o;
}
function buildWaliSelect(id, sel = '') {
  const list = adminUserCache.filter(u => u.role === 'walikelas');
  let h = `<select id="${id}" style="width:100%;padding:5px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.78rem;"><option value="">-- Pilih --</option>`;
  list.forEach(u => { h += `<option value="${u.username}" ${u.username===sel?'selected':''}>${u.nama}</option>`; });
  return h + '</select>';
}
function buildRombelOptions(sel = '') {
  let o = '<option value="">-- Pilih Rombel --</option>';
  rombelCache.forEach(r => { o += `<option value="${r.id}" ${r.id===sel?'selected':''}>${r.nama} (${r.mapel.length} mapel)</option>`; });
  if (!rombelCache.length) o += '<option value="" disabled>Belum ada rombel</option>';
  return o;
}
function buildRombelSelect(id, sel = '') {
  let h = `<select id="${id}" style="width:100%;padding:5px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.78rem;"><option value="">-- Pilih Rombel --</option>`;
  rombelCache.forEach(r => { h += `<option value="${r.id}" ${r.id===sel?'selected':''}>${r.nama}</option>`; });
  return h + '</select>';
}

// ============================================================
// KELAS — ID otomatis dari nama kelas (slug)
// ============================================================
function namaKeKelasId(nama) {
  return nama.trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function renderTabelKelas() {
  const tbody = document.getElementById('bodyKelas');
  tbody.innerHTML = '';
  if (!adminKelasCache.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="hint">Belum ada kelas. Buat Rombel dulu, lalu tambah kelas.</td></tr>';
    return;
  }
  adminKelasCache.forEach((k, i) => {
    const rombelNama = rombelCache.find(r => r.id === k.rombelId)?.nama || k.rombelId || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${k.nama}</strong> <small style="color:#888;">(${k.id})</small></td>
      <td><span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:12px;font-size:0.78rem;">${rombelNama}</span></td>
      <td>${k.waliNama||k.wali||'-'}</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalKelas(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        <button class="btn-danger" onclick="hapusKelas('${k.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function modalKelas(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalKelasTitle').textContent = isEdit ? 'Edit Kelas' : 'Tambah Kelas';
  document.getElementById('mk_wali').innerHTML   = buildWaliOptions();
  document.getElementById('mk_rombel').innerHTML = buildRombelOptions();
  if (isEdit) {
    const k = adminKelasCache[idx];
    document.getElementById('mk_id').value             = k.id;
    document.getElementById('mk_nama').value           = k.nama;
    document.getElementById('mk_rombel').innerHTML     = buildRombelOptions(k.rombelId || '');
    document.getElementById('mk_wali').innerHTML       = buildWaliOptions(k.wali);
  } else {
    document.getElementById('mk_id').value   = '';
    document.getElementById('mk_nama').value = '';
  }
  document.getElementById('modalKelas').classList.remove('hidden');
}

async function simpanKelas() {
  const nama     = document.getElementById('mk_nama').value.trim();
  const rombelId = document.getElementById('mk_rombel').value;
  const wali     = document.getElementById('mk_wali').value;
  const idLama   = document.getElementById('mk_id').value;

  if (!nama)     { showToast('Nama Kelas wajib diisi!', 'error'); return; }
  if (!rombelId) { showToast('Pilih Rombel terlebih dahulu!', 'error'); return; }

  // ID otomatis dari nama kelas jika baru
  const id = idLama || namaKeKelasId(nama);
  if (!id) { showToast('Nama kelas tidak valid untuk dijadikan ID!', 'error'); return; }

  try {
    await API.post('saveKelas', { kelas: JSON.stringify({ id, nama, rombelId, wali }) });
    closeModal('modalKelas');
    showToast(`Kelas "${nama}" disimpan!`, 'success');
    await loadAdminData();
  } catch(e) {}
}

async function hapusKelas(id) {
  if (!confirm(`Hapus kelas "${id}"?\nSEMUA data (siswa, nilai, ekskul, KKM) akan terhapus permanen!`)) return;
  try { await API.post('deleteKelas', { kelasId: id }); showToast('Kelas dihapus!', 'success'); await loadAdminData(); } catch(e) {}
}

// ============================================================
// BULK KELAS
// ============================================================
let bulkKelasRows = 0;

function modalBulkKelas() {
  bulkKelasRows = 0;
  document.getElementById('bulkKelasBody').innerHTML = '';
  document.getElementById('bulkKelasError').textContent = '';
  tambahBarisBulk(); tambahBarisBulk(); tambahBarisBulk();
  document.getElementById('modalBulkKelas').classList.remove('hidden');
}

function tambahBarisBulk() {
  bulkKelasRows++;
  const n = bulkKelasRows;
  const tr = document.createElement('tr');
  tr.id = `bkRow_${n}`;
  tr.style.background = n%2===0 ? '#f8fafc' : '#fff';
  tr.innerHTML = `
    <td style="padding:4px 6px;text-align:center;color:#888;">${n}</td>
    <td style="padding:4px 6px;">
      <input type="text" id="bk_nama_${n}" placeholder="Kelas 1A"
        style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/>
    </td>
    <td style="padding:4px 6px;">${buildRombelSelect(`bk_rombel_${n}`)}</td>
    <td style="padding:4px 6px;">${buildWaliSelect(`bk_wali_${n}`)}</td>
    <td style="padding:4px 6px;text-align:center;">
      <button onclick="hapusBarisBulk(${n})"
        style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;font-size:0.8rem;">✖</button>
    </td>`;
  document.getElementById('bulkKelasBody').appendChild(tr);
}

function hapusBarisBulk(n) { document.getElementById(`bkRow_${n}`)?.remove(); }

async function simpanBulkKelas() {
  const errEl = document.getElementById('bulkKelasError');
  errEl.textContent = '';
  const kelasList = [], namaSet = new Set();

  for (let i = 1; i <= bulkKelasRows; i++) {
    const namaEl = document.getElementById(`bk_nama_${i}`);
    if (!namaEl) continue;
    const nama     = namaEl.value.trim();
    const rombelId = document.getElementById(`bk_rombel_${i}`)?.value || '';
    if (!nama && !rombelId) continue; // baris kosong

    if (!nama)     { errEl.textContent = `Baris ${i}: Nama Kelas wajib!`; return; }
    if (!rombelId) { errEl.textContent = `Baris ${i}: Pilih Rombel!`; return; }

    const id = namaKeKelasId(nama);
    if (!id) { errEl.textContent = `Baris ${i}: Nama "${nama}" tidak valid!`; return; }
    if (namaSet.has(id)) { errEl.textContent = `Nama "${nama}" duplikat!`; return; }
    namaSet.add(id);

    kelasList.push({
      id, nama, rombelId,
      wali: document.getElementById(`bk_wali_${i}`)?.value || ''
    });
  }

  if (!kelasList.length) { errEl.textContent = 'Tidak ada kelas!'; return; }

  const dup = kelasList.filter(k => adminKelasCache.some(e => e.id === k.id));
  if (dup.length) { errEl.textContent = `Kelas sudah ada: ${dup.map(k=>k.nama).join(', ')}`; return; }

  showLoading(true);
  let ok = 0; const fail = [];
  for (const k of kelasList) {
    try { await API.post('saveKelas', { kelas: JSON.stringify(k) }); ok++; }
    catch { fail.push(k.nama); }
  }
  showLoading(false);
  closeModal('modalBulkKelas');
  fail.length ? showToast(`${ok} disimpan, gagal: ${fail.join(', ')}`, 'error')
              : showToast(`✅ ${ok} kelas ditambahkan!`, 'success');
  await loadAdminData();
}

// ============================================================
// USER
// ============================================================
function renderTabelUser() {
  const tbody = document.getElementById('bodyUser');
  tbody.innerHTML = '';
  if (!adminUserCache.length) { tbody.innerHTML='<tr><td colspan="6" class="hint">Belum ada user.</td></tr>'; return; }
  const rl = { admin:'🔴 Admin', walikelas:'🟡 Wali Kelas', guruMapel:'🟢 Guru Mapel' };
  adminUserCache.forEach((u,i) => {
    let kelasLabel = u.kelasId || '-';
    try { const a = JSON.parse(u.kelasId); if (Array.isArray(a)) kelasLabel = a.length ? a.join(', ') : '-'; } catch(e) {}
    const assignBtn = u.role === 'guruMapel'
      ? `<button class="btn-primary" onclick="modalAssignKelasGuru('${u.username}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Assign Kelas">🏫</button>`
      : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td><strong>${u.username}</strong></td><td>${u.nama}</td>
      <td>${rl[u.role]||u.role}</td>
      <td style="font-size:0.8rem;max-width:160px;">${kelasLabel}</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalUser(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        ${assignBtn}
        <button class="btn-primary" onclick="modalResetPassword('${u.username}','${u.nama}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🔑</button>
        <button class="btn-danger" onclick="hapusUser('${u.username}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
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
    document.getElementById('mu_username').value = u.username;
    document.getElementById('mu_username').disabled = true;
    document.getElementById('mu_password').value = '';
    document.getElementById('mu_nama').value = u.nama;
    document.getElementById('mu_role').value = u.role;
  } else {
    document.getElementById('mu_username').value = '';
    document.getElementById('mu_username').disabled = false;
    document.getElementById('mu_password').value = '';
    document.getElementById('mu_nama').value = '';
    document.getElementById('mu_role').value = 'walikelas';
  }
  document.getElementById('modalUser').classList.remove('hidden');
}
function toggleUserKelas() {}
async function simpanUser() {
  const idx = parseInt(document.getElementById('mu_idx').value);
  const username = document.getElementById('mu_username').value.trim();
  const password = document.getElementById('mu_password').value;
  const nama = document.getElementById('mu_nama').value.trim();
  const role = document.getElementById('mu_role').value;
  if (!username||!nama) { showToast('Username dan Nama wajib!','error'); return; }
  if (idx===-1&&!password) { showToast('Password wajib untuk user baru!','error'); return; }
  try {
    await API.post('saveUser',{user:JSON.stringify({username,password,nama,role,kelasId:''}),isNew:idx===-1});
    closeModal('modalUser'); showToast('User disimpan!','success'); await loadAdminData();
  } catch(e) {}
}
async function hapusUser(username) {
  if (username==='admin') { showToast('User admin tidak bisa dihapus!','error'); return; }
  if (!confirm(`Hapus user "${username}"?`)) return;
  try { await API.post('deleteUser',{username}); showToast('User dihapus!','success'); await loadAdminData(); } catch(e) {}
}

// ============================================================
// RESET PASSWORD
// ============================================================
function modalResetPassword(username, nama) {
  document.getElementById('rp_username').value = username;
  document.getElementById('rp_usernameLabel').textContent = `${nama} (${username})`;
  document.getElementById('rp_newPass').value = '';
  document.getElementById('rp_confirmPass').value = '';
  document.getElementById('rp_error').classList.add('hidden');
  document.getElementById('rp_newPass').type = 'password';
  document.getElementById('rp_eyeBtn').textContent = '👁️';
  document.getElementById('modalResetPass').classList.remove('hidden');
}
function togglePassVisibility(inputId, btnId) {
  const inp = document.getElementById(inputId), btn = document.getElementById(btnId);
  if (inp.type==='password') { inp.type='text'; btn.textContent='🙈'; }
  else { inp.type='password'; btn.textContent='👁️'; }
}
async function simpanResetPassword() {
  const username = document.getElementById('rp_username').value;
  const newPass = document.getElementById('rp_newPass').value;
  const confirmPass = document.getElementById('rp_confirmPass').value;
  const errEl = document.getElementById('rp_error');
  errEl.classList.add('hidden');
  if (!newPass) { errEl.textContent='Password tidak boleh kosong.'; errEl.classList.remove('hidden'); return; }
  if (newPass.length<6) { errEl.textContent='Minimal 6 karakter.'; errEl.classList.remove('hidden'); return; }
  if (newPass!==confirmPass) { errEl.textContent='Konfirmasi tidak cocok.'; errEl.classList.remove('hidden'); return; }
  try { await API.post('resetPassword',{username,newPassword:newPass}); closeModal('modalResetPass'); showToast(`Password ${username} direset!`,'success'); } catch(e) {}
}

// ============================================================
// ROMBEL
// ============================================================
const MAPEL_UTAMA = [
  'Al-Qur\'an Hadits','Aqidah Akhlak','Fiqih','Bahasa Arab',
  'PPKn','Bahasa Indonesia','Matematika','SBdP','PJOK',
  'IPA','IPS','Sejarah Kebudayaan Islam'
];
const MAPEL_MULOK = ['Bahasa Daerah','Bahasa Inggris','Pego'];

let rombelCache = [];

async function loadRombelAdmin() {
  try {
    const data = await API.call('getRombel');
    rombelCache = data.rombel || [];
    renderTabelRombel();
  } catch(e) {}
}

function renderTabelRombel() {
  const tbody = document.getElementById('bodyRombel');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!rombelCache.length) { tbody.innerHTML='<tr><td colspan="5" class="hint">Belum ada rombel. Klik "Tambah Rombel".</td></tr>'; return; }
  rombelCache.forEach((r,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td><strong>${r.id}</strong></td><td>${r.nama}</td>
      <td style="font-size:0.8rem;color:#555;max-width:300px;">${r.mapel.join(', ')||'-'}</td>
      <td style="white-space:nowrap;">
        <button class="btn-warning" onclick="modalRombel(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        <button class="btn-danger" onclick="hapusRombel('${r.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

let rombelMapelTemp = [];

function modalRombel(idx) {
  const isEdit = idx !== undefined;
  document.getElementById('modalRombelTitle').textContent = isEdit ? 'Edit Rombel' : 'Tambah Rombel';
  if (isEdit) {
    const r = rombelCache[idx];
    document.getElementById('mr_id_hidden').value = r.id;
    document.getElementById('mr_id').value = r.id;
    document.getElementById('mr_id').disabled = true;
    document.getElementById('mr_nama').value = r.nama;
    rombelMapelTemp = [...r.mapel];
  } else {
    document.getElementById('mr_id_hidden').value = '';
    document.getElementById('mr_id').value = '';
    document.getElementById('mr_id').disabled = false;
    document.getElementById('mr_nama').value = '';
    rombelMapelTemp = [];
  }
  document.getElementById('mr_mapelCustom').value = '';
  renderRefMapel();
  renderRombelMapelList();
  document.getElementById('modalRombel').classList.remove('hidden');
}

function renderRefMapel() {
  _renderRefGroup('refMapelUtama', MAPEL_UTAMA);
  _renderRefGroup('refMapelMulok', MAPEL_MULOK);
}
function _renderRefGroup(containerId, list) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  list.forEach(m => {
    const dipilih = rombelMapelTemp.includes(m);
    const btn = document.createElement('button');
    btn.textContent = (dipilih ? '✅ ' : '') + m;
    btn.style.cssText = `padding:4px 10px;border-radius:20px;border:1px solid ${dipilih?'#16a34a':'#d1d5db'};
      background:${dipilih?'#dcfce7':'#fff'};color:${dipilih?'#15803d':'#374151'};
      cursor:pointer;font-size:0.8rem;transition:all 0.15s;`;
    btn.onclick = () => toggleRefMapel(m);
    c.appendChild(btn);
  });
}
function toggleRefMapel(nama) {
  const idx = rombelMapelTemp.indexOf(nama);
  if (idx >= 0) rombelMapelTemp.splice(idx,1); else rombelMapelTemp.push(nama);
  renderRefMapel(); renderRombelMapelList();
}
function tambahMapelCustomRombel() {
  const inp = document.getElementById('mr_mapelCustom');
  const nama = inp.value.trim();
  if (!nama) return;
  if (rombelMapelTemp.includes(nama)) { showToast(`"${nama}" sudah ada!`,'error'); return; }
  rombelMapelTemp.push(nama); inp.value = '';
  renderRefMapel(); renderRombelMapelList();
}
function kosongkanMapelRombel() {
  if (!rombelMapelTemp.length) return;
  if (!confirm('Kosongkan semua mapel?')) return;
  rombelMapelTemp = []; renderRefMapel(); renderRombelMapelList();
}
function renderRombelMapelList() {
  const c = document.getElementById('rombelMapelList');
  const j = document.getElementById('mr_jumlah');
  if (j) j.textContent = rombelMapelTemp.length ? `(${rombelMapelTemp.length} mapel)` : '';
  if (!rombelMapelTemp.length) { c.innerHTML='<p style="color:#888;font-size:0.83rem;padding:10px;text-align:center;">Belum ada mapel dipilih.</p>'; return; }
  c.innerHTML = rombelMapelTemp.map((m,i) => `
    <div style="display:flex;gap:6px;align-items:center;background:#fff;padding:4px 6px;border-radius:4px;border:1px solid #e5e7eb;">
      <span style="color:#888;font-size:0.78rem;min-width:22px;">${i+1}.</span>
      <input type="text" value="${m}" onchange="updateMapelRombel(${i},this.value)"
        style="flex:1;padding:4px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.83rem;"/>
      <button onclick="naikkMapelRombel(${i})" style="background:none;border:none;cursor:pointer;font-size:0.85rem;">⬆️</button>
      <button onclick="turunMapelRombel(${i})" style="background:none;border:none;cursor:pointer;font-size:0.85rem;">⬇️</button>
      <button onclick="hapusMapelRombel(${i})" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:0.78rem;">✖</button>
    </div>`).join('');
}
function updateMapelRombel(i,val) { rombelMapelTemp[i]=val.trim(); renderRefMapel(); }
function hapusMapelRombel(i) { rombelMapelTemp.splice(i,1); renderRefMapel(); renderRombelMapelList(); }
function naikkMapelRombel(i) { if(i>0){[rombelMapelTemp[i-1],rombelMapelTemp[i]]=[rombelMapelTemp[i],rombelMapelTemp[i-1]];renderRombelMapelList();} }
function turunMapelRombel(i) { if(i<rombelMapelTemp.length-1){[rombelMapelTemp[i],rombelMapelTemp[i+1]]=[rombelMapelTemp[i+1],rombelMapelTemp[i]];renderRombelMapelList();} }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mr_mapelCustom')?.addEventListener('keydown', e => {
    if (e.key==='Enter') tambahMapelCustomRombel();
  });
});

async function simpanRombel() {
  const id = (document.getElementById('mr_id_hidden').value||document.getElementById('mr_id').value).trim().replace(/\s+/g,'_');
  const nama = document.getElementById('mr_nama').value.trim();
  if (!id) { showToast('ID Rombel wajib!','error'); return; }
  if (!nama) { showToast('Nama Rombel wajib!','error'); return; }
  if (!rombelMapelTemp.length) { showToast('Minimal 1 mapel!','error'); return; }
  try {
    await API.post('saveRombel',{rombel:JSON.stringify({id,nama,mapel:rombelMapelTemp})});
    closeModal('modalRombel');
    showToast(`Rombel "${nama}" disimpan!`,'success');
    await loadAdminData();
  } catch(e) {}
}
async function hapusRombel(id) {
  const kelasYangPakai = adminKelasCache.filter(k => k.rombelId === id);
  if (kelasYangPakai.length) {
    showToast(`Rombel dipakai oleh: ${kelasYangPakai.map(k=>k.nama).join(', ')}. Hapus kelas dulu!`, 'error');
    return;
  }
  if (!confirm(`Hapus rombel "${id}"?`)) return;
  try { await API.post('deleteRombel',{rombelId:id}); showToast('Rombel dihapus!','success'); await loadAdminData(); } catch(e) {}
}

// ============================================================
// ASSIGN KELAS KE GURU MAPEL
// ============================================================
function modalAssignKelasGuru(username) {
  const user = adminUserCache.find(u => u.username === username);
  if (!user) return;
  document.getElementById('assignGuruUsername').value = username;
  document.getElementById('assignGuruLabel').textContent = `${user.nama} (${username})`;
  document.getElementById('assignError').textContent = '';
  let assigned = [];
  try { const p = JSON.parse(user.kelasId); if (Array.isArray(p)) assigned = p; } catch(e) { if (user.kelasId) assigned = [user.kelasId]; }
  const box = document.getElementById('assignKelasCheckboxes');
  box.innerHTML = '';
  if (!adminKelasCache.length) { box.innerHTML='<p style="color:#888;font-size:0.85rem;">Belum ada kelas.</p>'; }
  else {
    adminKelasCache.forEach(k => {
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;padding:4px 0;';
      lbl.innerHTML = `<input type="checkbox" value="${k.id}" ${assigned.includes(k.id)?'checked':''} style="width:16px;height:16px;"/>
        <span>${k.nama} <small style="color:#888;">(${k.id})</small></span>`;
      box.appendChild(lbl);
    });
  }
  document.getElementById('modalAssignKelasGuru').classList.remove('hidden');
}
async function simpanAssignKelasGuru() {
  const username  = document.getElementById('assignGuruUsername').value;
  const kelasList = [...document.querySelectorAll('#assignKelasCheckboxes input:checked')].map(c=>c.value);
  try {
    await API.post('saveGuruKelas',{username,kelasList});
    closeModal('modalAssignKelasGuru');
    showToast(`Kelas untuk ${username} disimpan (${kelasList.length} kelas)!`,'success');
    await loadAdminData();
  } catch(e) {}
}
