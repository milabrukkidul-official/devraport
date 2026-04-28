// ===== ADMIN =====

let adminKelasCache = [];
let adminUserCache  = [];

async function loadAdminData() {
  const token = API.getToken();
  if (!token) { showToast('Sesi tidak valid, silakan login ulang.', 'error'); return; }
  try {
    const [kRes, uRes] = await Promise.all([API.call('getKelas'), API.call('getUsers')]);
    adminKelasCache = kRes.kelas || [];
    adminUserCache  = uRes.users || [];
    renderTabelKelas();
    renderTabelUser();
    onKelasListLoaded(adminKelasCache);
    await loadRombelAdmin();
  } catch(e) {}
}

// ============================================================
// KELAS
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

function renderTabelKelas() {
  const tbody = document.getElementById('bodyKelas');
  tbody.innerHTML = '';
  if (!adminKelasCache.length) { tbody.innerHTML = '<tr><td colspan="7" class="hint">Belum ada kelas.</td></tr>'; return; }
  adminKelasCache.forEach((k, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td><strong>${k.id}</strong></td><td>${k.nama}</td>
      <td>${k.waliNama||k.wali||'-'}</td><td>${k.semester||''}</td><td>${k.tahun||''}</td>
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
  document.getElementById('mk_wali').innerHTML = buildWaliOptions();
  if (isEdit) {
    const k = adminKelasCache[idx];
    document.getElementById('mk_id').value = k.id;
    document.getElementById('mk_id_input').value = k.id;
    document.getElementById('mk_id_input').disabled = true;
    document.getElementById('mk_nama').value = k.nama;
    document.getElementById('mk_wali').innerHTML = buildWaliOptions(k.wali);
    document.getElementById('mk_semester').value = k.semester || 'I (GANJIL)';
    document.getElementById('mk_tahun').value = k.tahun || '';
  } else {
    document.getElementById('mk_id').value = '';
    document.getElementById('mk_id_input').value = '';
    document.getElementById('mk_id_input').disabled = false;
    document.getElementById('mk_nama').value = '';
    document.getElementById('mk_semester').value = 'I (GANJIL)';
    document.getElementById('mk_tahun').value = '';
  }
  document.getElementById('modalKelas').classList.remove('hidden');
}

function autoNamaKelas() {
  const v = document.getElementById('mk_id_input').value;
  const n = document.getElementById('mk_nama');
  if (!n.value) n.value = v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

async function simpanKelas() {
  const id = (document.getElementById('mk_id').value || document.getElementById('mk_id_input').value).trim().replace(/\s+/g,'_');
  const nama = document.getElementById('mk_nama').value.trim();
  const wali = document.getElementById('mk_wali').value;
  const semester = document.getElementById('mk_semester').value;
  const tahun = document.getElementById('mk_tahun').value.trim();
  if (!id) { showToast('ID Kelas wajib diisi!','error'); return; }
  if (!nama) { showToast('Nama Kelas wajib diisi!','error'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(id)) { showToast('ID hanya huruf, angka, underscore!','error'); return; }
  try {
    await API.post('saveKelas', { kelas: JSON.stringify({ id, nama, wali, semester, tahun }) });
    closeModal('modalKelas');
    showToast(`Kelas "${nama}" disimpan!`, 'success');
    await loadAdminData();
  } catch(e) {}
}

async function hapusKelas(id) {
  if (!confirm(`Hapus kelas "${id}"?\nSEMUA data akan terhapus permanen!`)) return;
  try { await API.post('deleteKelas', { kelasId: id }); showToast('Kelas dihapus!','success'); await loadAdminData(); } catch(e) {}
}

// ============================================================
// BULK KELAS
// ============================================================
let bulkKelasRows = 0;
function modalBulkKelas() {
  bulkKelasRows = 0;
  document.getElementById('bulkKelasBody').innerHTML = '';
  document.getElementById('bulkKelasError').textContent = '';
  document.getElementById('bk_tahunDefault').value = '';
  document.getElementById('bk_semesterDefault').value = 'I (GANJIL)';
  tambahBarisBulk(); tambahBarisBulk(); tambahBarisBulk();
  document.getElementById('modalBulkKelas').classList.remove('hidden');
}
function tambahBarisBulk() {
  bulkKelasRows++;
  const n = bulkKelasRows;
  const sem = document.getElementById('bk_semesterDefault')?.value || 'I (GANJIL)';
  const thn = document.getElementById('bk_tahunDefault')?.value || '';
  const tr = document.createElement('tr');
  tr.id = `bkRow_${n}`;
  tr.style.background = n%2===0?'#f8fafc':'#fff';
  tr.innerHTML = `
    <td style="padding:4px 6px;text-align:center;color:#888;">${n}</td>
    <td style="padding:4px 6px;"><input type="text" id="bk_id_${n}" placeholder="kelas_1a"
      style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;" oninput="autoNamaBulk(${n})"/></td>
    <td style="padding:4px 6px;"><input type="text" id="bk_nama_${n}" placeholder="Kelas 1A"
      style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/></td>
    <td style="padding:4px 6px;">${buildWaliSelect(`bk_wali_${n}`)}</td>
    <td style="padding:4px 6px;"><select id="bk_sem_${n}" style="width:100%;padding:5px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.78rem;">
      <option value="I (GANJIL)" ${sem==='I (GANJIL)'?'selected':''}>I (GANJIL)</option>
      <option value="II (GENAP)" ${sem==='II (GENAP)'?'selected':''}>II (GENAP)</option></select></td>
    <td style="padding:4px 6px;"><input type="text" id="bk_thn_${n}" value="${thn}" placeholder="2024/2025"
      style="width:100%;padding:5px 7px;border:1px solid #d1d5db;border-radius:4px;font-size:0.82rem;"/></td>
    <td style="padding:4px 6px;text-align:center;"><button onclick="hapusBarisBulk(${n})"
      style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;font-size:0.8rem;">✖</button></td>`;
  document.getElementById('bulkKelasBody').appendChild(tr);
}
function hapusBarisBulk(n) { document.getElementById(`bkRow_${n}`)?.remove(); }
function autoNamaBulk(n) {
  const v = document.getElementById(`bk_id_${n}`)?.value||'';
  const el = document.getElementById(`bk_nama_${n}`);
  if (el && !el.value) el.value = v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function applyDefaultBulk() {
  const sem = document.getElementById('bk_semesterDefault').value;
  const thn = document.getElementById('bk_tahunDefault').value;
  for (let i=1;i<=bulkKelasRows;i++) {
    const s=document.getElementById(`bk_sem_${i}`); if(s) s.value=sem;
    const t=document.getElementById(`bk_thn_${i}`); if(t) t.value=thn;
  }
  showToast('Default diterapkan!','success');
}
async function simpanBulkKelas() {
  const errEl = document.getElementById('bulkKelasError');
  errEl.textContent = '';
  const kelasList = [], idSet = new Set();
  for (let i=1;i<=bulkKelasRows;i++) {
    const idEl = document.getElementById(`bk_id_${i}`);
    if (!idEl) continue;
    const id = idEl.value.trim().replace(/\s+/g,'_');
    const nama = document.getElementById(`bk_nama_${i}`)?.value.trim()||'';
    if (!id && !nama) continue;
    if (!id) { errEl.textContent=`Baris ${i}: ID wajib!`; return; }
    if (!nama) { errEl.textContent=`Baris ${i}: Nama wajib!`; return; }
    if (!/^[a-zA-Z0-9_]+$/.test(id)) { errEl.textContent=`Baris ${i}: ID "${id}" tidak valid!`; return; }
    if (idSet.has(id)) { errEl.textContent=`ID "${id}" duplikat!`; return; }
    idSet.add(id);
    kelasList.push({ id, nama, wali: document.getElementById(`bk_wali_${i}`)?.value||'',
      semester: document.getElementById(`bk_sem_${i}`)?.value||'I (GANJIL)',
      tahun: document.getElementById(`bk_thn_${i}`)?.value.trim()||'' });
  }
  if (!kelasList.length) { errEl.textContent='Tidak ada kelas!'; return; }
  const dup = kelasList.filter(k => adminKelasCache.some(e=>e.id===k.id));
  if (dup.length) { errEl.textContent=`ID sudah ada: ${dup.map(k=>k.id).join(', ')}`; return; }
  showLoading(true);
  let ok=0; const fail=[];
  for (const k of kelasList) {
    try { await API.post('saveKelas',{kelas:JSON.stringify(k)}); ok++; } catch { fail.push(k.id); }
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
    const tr = document.createElement('tr');
    // Parse kelasId: bisa string atau JSON array
    let kelasLabel = u.kelasId || '-';
    try {
      const arr = JSON.parse(u.kelasId);
      if (Array.isArray(arr)) kelasLabel = arr.length ? arr.join(', ') : '-';
    } catch(e) {}

    const assignBtn = u.role === 'guruMapel'
      ? `<button class="btn-primary" onclick="modalAssignKelasGuru('${u.username}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Assign Kelas">🏫</button>`
      : '';

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
// ROMBEL — dengan referensi mata pelajaran
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
    populateRombelSelect();
  } catch(e) {}
}

function renderTabelRombel() {
  const tbody = document.getElementById('bodyRombel');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!rombelCache.length) { tbody.innerHTML='<tr><td colspan="5" class="hint">Belum ada rombel.</td></tr>'; return; }
  rombelCache.forEach((r,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td><strong>${r.id}</strong></td><td>${r.nama}</td>
      <td style="font-size:0.8rem;color:#555;max-width:300px;">${r.mapel.join(', ')||'-'}</td>
      <td style="white-space:nowrap;">
        <button class="btn-primary" onclick="modalTerapkanRombel('${r.id}')" style="padding:3px 8px;font-size:0.78rem;" title="Terapkan ke Kelas">🏫</button>
        <button class="btn-warning" onclick="modalRombel(${i})" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Edit">✏️</button>
        <button class="btn-danger" onclick="hapusRombel('${r.id}')" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;" title="Hapus">🗑️</button>
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
    opt.value = r.id; opt.textContent = `${r.nama} (${r.mapel.length} mapel)`;
    if (r.id===prev) opt.selected = true;
    sel.appendChild(opt);
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
  if (idx >= 0) rombelMapelTemp.splice(idx,1);
  else rombelMapelTemp.push(nama);
  renderRefMapel();
  renderRombelMapelList();
}

function tambahMapelCustomRombel() {
  const inp = document.getElementById('mr_mapelCustom');
  const nama = inp.value.trim();
  if (!nama) return;
  if (rombelMapelTemp.includes(nama)) { showToast(`"${nama}" sudah ada!`,'error'); return; }
  rombelMapelTemp.push(nama);
  inp.value = '';
  renderRefMapel();
  renderRombelMapelList();
}

function kosongkanMapelRombel() {
  if (!rombelMapelTemp.length) return;
  if (!confirm('Kosongkan semua mapel?')) return;
  rombelMapelTemp = [];
  renderRefMapel();
  renderRombelMapelList();
}

function renderRombelMapelList() {
  const c = document.getElementById('rombelMapelList');
  const j = document.getElementById('mr_jumlah');
  if (j) j.textContent = rombelMapelTemp.length ? `(${rombelMapelTemp.length} mapel)` : '';
  if (!rombelMapelTemp.length) {
    c.innerHTML = '<p style="color:#888;font-size:0.83rem;padding:10px;text-align:center;">Belum ada mapel dipilih.</p>';
    return;
  }
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

// Enter di input custom langsung tambah
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
    await loadRombelAdmin();
  } catch(e) {}
}

async function hapusRombel(id) {
  if (!confirm(`Hapus rombel "${id}"?`)) return;
  try { await API.post('deleteRombel',{rombelId:id}); showToast('Rombel dihapus!','success'); await loadRombelAdmin(); } catch(e) {}
}

async function terapkanRombelKeKelas(kelasId) {
  // Dipanggil dari tab Rombel saat klik tombol "Terapkan ke Kelas"
  if (!kelasId) { showToast('Pilih kelas tujuan!','error'); return; }
  const rombelId = document.getElementById('mapelRombelSelect')?.value;
  if (!rombelId) { showToast('Pilih rombel!','error'); return; }
  const rombel = rombelCache.find(r=>r.id===rombelId);
  if (!rombel) { showToast('Rombel tidak ditemukan!','error'); return; }
  if (!confirm(`Terapkan ${rombel.mapel.length} mapel dari "${rombel.nama}" ke kelas "${kelasId}"?\nNilai yang ada dipertahankan.`)) return;
  try {
    await API.post('saveMapel',{kelasId,mapel:JSON.stringify(rombel.mapel)});
    showToast(`Mapel "${rombel.nama}" diterapkan ke ${kelasId}!`,'success');
  } catch(e) {}
}

let _terapkanRombelId = '';

function modalTerapkanRombel(rombelId) {
  const rombel = rombelCache.find(r => r.id === rombelId);
  if (!rombel) return;
  _terapkanRombelId = rombelId;
  document.getElementById('terapkanRombelLabel').textContent = `"${rombel.nama}" (${rombel.mapel.length} mapel)`;
  document.getElementById('terapkanError').textContent = '';

  const box = document.getElementById('terapkanKelasCheckboxes');
  box.innerHTML = '';
  if (!adminKelasCache.length) {
    box.innerHTML = '<p style="color:#888;font-size:0.85rem;">Belum ada kelas.</p>';
  } else {
    adminKelasCache.forEach(k => {
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;padding:4px 0;';
      lbl.innerHTML = `<input type="checkbox" value="${k.id}" style="width:16px;height:16px;"/>
        <span>${k.nama} <small style="color:#888;">(${k.id})</small></span>`;
      box.appendChild(lbl);
    });
  }
  document.getElementById('modalTerapkanRombel').classList.remove('hidden');
}

async function eksekusiTerapkanRombel() {
  const rombel = rombelCache.find(r => r.id === _terapkanRombelId);
  if (!rombel) return;
  const targets = [...document.querySelectorAll('#terapkanKelasCheckboxes input:checked')].map(c => c.value);
  if (!targets.length) {
    document.getElementById('terapkanError').textContent = 'Pilih minimal 1 kelas!'; return;
  }
  showLoading(true);
  let ok = 0; const fail = [];
  for (const kelasId of targets) {
    try {
      await API.post('saveMapel', { kelasId, mapel: JSON.stringify(rombel.mapel) });
      ok++;
    } catch { fail.push(kelasId); }
  }
  showLoading(false);
  closeModal('modalTerapkanRombel');
  fail.length
    ? showToast(`${ok} berhasil, gagal: ${fail.join(', ')}`, 'error')
    : showToast(`✅ Mapel "${rombel.nama}" diterapkan ke ${ok} kelas!`, 'success');
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

  // Parse kelas yang sudah di-assign
  let assigned = [];
  try {
    const parsed = JSON.parse(user.kelasId);
    if (Array.isArray(parsed)) assigned = parsed;
  } catch(e) {
    if (user.kelasId) assigned = [user.kelasId];
  }

  const box = document.getElementById('assignKelasCheckboxes');
  box.innerHTML = '';
  if (!adminKelasCache.length) {
    box.innerHTML = '<p style="color:#888;font-size:0.85rem;">Belum ada kelas.</p>';
  } else {
    adminKelasCache.forEach(k => {
      const checked = assigned.includes(k.id) ? 'checked' : '';
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;padding:4px 0;';
      lbl.innerHTML = `<input type="checkbox" value="${k.id}" ${checked} style="width:16px;height:16px;"/>
        <span>${k.nama} <small style="color:#888;">(${k.id})</small></span>`;
      box.appendChild(lbl);
    });
  }
  document.getElementById('modalAssignKelasGuru').classList.remove('hidden');
}

async function simpanAssignKelasGuru() {
  const username  = document.getElementById('assignGuruUsername').value;
  const kelasList = [...document.querySelectorAll('#assignKelasCheckboxes input:checked')].map(c => c.value);
  try {
    await API.post('saveGuruKelas', { username, kelasList });
    closeModal('modalAssignKelasGuru');
    showToast(`Kelas untuk ${username} disimpan (${kelasList.length} kelas)!`, 'success');
    await loadAdminData();
  } catch(e) {}
}
