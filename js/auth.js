// ===== AUTH =====

let currentUser = null; // { username, nama, role, kelasId, token }

async function initApp() {
  // Cek session tersimpan
  const saved = sessionStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainApp();
    return;
  }
  // Tampilkan login
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  // Load kelas untuk dropdown
  await loadKelasLogin();
}

async function loadKelasLogin() {
  const gasUrl = localStorage.getItem('gasUrl');
  const sel = document.getElementById('loginKelas');
  if (!gasUrl) {
    sel.innerHTML = '<option value="">-- Set URL dulu di Admin --</option>';
    return;
  }
  try {
    const data = await API.getKelasPublic();
    const kelasList = data.kelas || [];
    sel.innerHTML = '<option value="">-- Pilih Kelas (jika bukan Admin) --</option>';
    kelasList.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = k.nama;
      sel.appendChild(opt);
    });
  } catch {
    sel.innerHTML = '<option value="">Gagal memuat kelas</option>';
  }
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const kelasId  = document.getElementById('loginKelas').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Username dan password wajib diisi.';
    errEl.classList.remove('hidden');
    return;
  }

  // Cek GAS URL
  const gasUrl = localStorage.getItem('gasUrl');
  if (!gasUrl) {
    // Mode offline: cek admin default
    if (username === 'admin' && password === 'admin123') {
      currentUser = { username: 'admin', nama: 'Administrator', role: 'admin', kelasId: '', token: 'local' };
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      showMainApp();
      return;
    }
    errEl.textContent = 'URL Apps Script belum diset. Hubungi admin.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await API.login(username, password, kelasId);
    if (!data.success) {
      errEl.textContent = data.message || 'Username/password salah.';
      errEl.classList.remove('hidden');
      return;
    }
    currentUser = data.user;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
  } catch {
    errEl.textContent = 'Gagal terhubung ke server.';
    errEl.classList.remove('hidden');
  }
}

function doLogout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showToast('Berhasil keluar.', 'success');
}

function showMainApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  buildNavbar();
  // Tampilkan halaman default
  if (currentUser.role === 'admin') {
    showPage('admin');
    // Load GAS URL ke input admin
    const saved = localStorage.getItem('gasUrl');
    if (saved) document.getElementById('adminGasUrl').value = saved;
    loadAdminData();
  } else if (currentUser.role === 'walikelas') {
    showPage('setting');
    loadSetting();
  } else {
    // guruMapel
    showPage('nilai');
    loadNilai();
  }
}

function buildNavbar() {
  const nav = document.getElementById('navLinks');
  nav.innerHTML = '';
  const { role, nama, kelasId } = currentUser;

  const pages = [];
  if (role === 'admin') {
    pages.push({ id: 'admin',   label: '🛠️ Admin' });
    pages.push({ id: 'setting', label: '⚙️ Setting' });
    pages.push({ id: 'siswa',   label: '👤 Siswa' });
    pages.push({ id: 'nilai',   label: '📊 Nilai' });
    pages.push({ id: 'ekskul',  label: '🏆 Ekskul' });
    pages.push({ id: 'kkm',     label: '📌 KKM' });
    pages.push({ id: 'cetak',   label: '🖨️ Cetak' });
  } else if (role === 'walikelas') {
    pages.push({ id: 'setting', label: '⚙️ Setting' });
    pages.push({ id: 'siswa',   label: '👤 Siswa' });
    pages.push({ id: 'nilai',   label: '📊 Nilai' });
    pages.push({ id: 'ekskul',  label: '🏆 Ekskul' });
    pages.push({ id: 'kkm',     label: '📌 KKM' });
    pages.push({ id: 'cetak',   label: '🖨️ Cetak' });
  } else {
    // guruMapel: hanya nilai
    pages.push({ id: 'nilai',   label: '📊 Nilai' });
  }

  pages.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.dataset.page = p.id;
    btn.textContent = p.label;
    btn.onclick = () => showPage(p.id);
    nav.appendChild(btn);
  });

  const roleLabel = { admin: 'Admin', walikelas: 'Wali Kelas', guruMapel: 'Guru Mapel' };
  document.getElementById('navUserInfo').textContent =
    `👤 ${nama} (${roleLabel[role] || role}${kelasId ? ' - ' + kelasId : ''})`;
}

// Jalankan saat halaman load
window.addEventListener('DOMContentLoaded', initApp);
