// ===== AUTH =====

let currentUser = null; // { username, nama, role, kelasId, token }

async function initApp() {
  const saved = sessionStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainApp();
    return;
  }
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Username dan password wajib diisi.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await API.login(username, password);
    if (!data.success) {
      errEl.textContent = data.message || 'Username atau password salah.';
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
  if (currentUser.role === 'admin') {
    showPage('admin');
    const override = localStorage.getItem('gasUrl');
    const inp = document.getElementById('adminGasUrl');
    if (inp) inp.value = override || '';
    const st = document.getElementById('connStatus');
    if (st) {
      st.textContent = override ? '✅ Override aktif' : '✅ Menggunakan GAS_URL dari api.js';
      st.className = 'conn-status ok';
    }
    loadAdminData();
  } else if (currentUser.role === 'walikelas') {
    showPage('setting');
    loadSetting();
  } else {
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
    pages.push({ id: 'nilai', label: '📊 Nilai' });
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
  const kelasInfo = kelasId ? ` — ${kelasId}` : '';
  document.getElementById('navUserInfo').textContent =
    `👤 ${nama} (${roleLabel[role] || role}${kelasInfo})`;
}

window.addEventListener('DOMContentLoaded', () => {
  initApp();
  ['loginUser', 'loginPass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });
});
