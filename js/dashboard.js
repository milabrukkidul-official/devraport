// ===== DASHBOARD =====

async function loadDashboard() {
  const role = currentUser?.role;

  // Reset semua stat
  setStatEl('dash-stat-rombel', '—');
  setStatEl('dash-stat-siswa',  '—');
  setStatEl('dash-stat-user',   '—');
  setStatEl('dash-stat-mapel',  '—');

  // Info user di welcome banner
  const roleLabel = { admin: 'Administrator', walikelas: 'Wali Kelas', guruMapel: 'Guru Mapel' };
  const el = document.getElementById('dash-user-info');
  if (el) {
    el.innerHTML = `
      <div class="dash-avatar">${getInitials(currentUser.nama)}</div>
      <div>
        <div class="dash-user-name">${currentUser.nama}</div>
        <div class="dash-user-role">${roleLabel[role] || role}</div>
      </div>`;
  }

  // Tampilkan/sembunyikan kartu sesuai role
  toggleDashCard('dash-card-rombel', role === 'admin');
  toggleDashCard('dash-card-user',   role === 'admin');

  // Tampilkan editor pengumuman hanya untuk admin
  const editor = document.getElementById('dash-announcement-editor');
  if (editor) editor.classList.toggle('hidden', role !== 'admin');

  try {
    if (role === 'admin') {
      const [rRes, uRes] = await Promise.all([
        API.call('getRombel'),
        API.call('getUsers')
      ]);
      const rombelList = rRes.rombel || [];
      const userList   = uRes.users  || [];

      setStatEl('dash-stat-rombel', rombelList.length);
      setStatEl('dash-stat-user',   userList.length);

      let totalSiswa = 0, totalMapel = 0;
      if (rombelList.length) {
        const siswaResults = await Promise.all(
          rombelList.map(r => API.call('getSiswa', { kelasId: r.id }).catch(() => ({ siswa: [] })))
        );
        siswaResults.forEach(res => { totalSiswa += (res.siswa || []).length; });
        const nilaiRes = await API.call('getNilai', { kelasId: rombelList[0].id }).catch(() => ({ mapel: [] }));
        totalMapel = (nilaiRes.mapel || []).length;
      }
      setStatEl('dash-stat-siswa', totalSiswa);
      setStatEl('dash-stat-mapel', totalMapel);

      // Muat pengumuman ke form editor
      await loadAnnouncementToEditor();

    } else if (role === 'walikelas') {
      const rombelId = currentUser.rombelId;
      if (rombelId) {
        const [sRes, nRes] = await Promise.all([
          API.call('getSiswa', { kelasId: rombelId }),
          API.call('getNilai', { kelasId: rombelId })
        ]);
        setStatEl('dash-stat-siswa', (sRes.siswa || []).length);
        setStatEl('dash-stat-mapel', (nRes.mapel || []).length);
      }
      // Tampilkan pengumuman untuk non-admin
      await loadAnnouncementDisplay();

    } else {
      // guruMapel
      const rombelList = Array.isArray(currentUser.rombelId) ? currentUser.rombelId : [];
      setStatEl('dash-stat-rombel', rombelList.length);
      await loadAnnouncementDisplay();
    }
  } catch (e) {
    console.error('loadDashboard error:', e);
  }
}

// ===== PENGUMUMAN =====

async function loadAnnouncementDisplay() {
  const box = document.getElementById('dash-announcement');
  if (!box) return;
  try {
    const res = await API.call('getAnnouncement');
    const ann = res.announcement || {};
    if (!ann.isi && !ann.judul) {
      box.classList.add('hidden');
      return;
    }
    const urlHtml = ann.url
      ? `<a href="${escHtml(ann.url)}" target="_blank" rel="noopener" class="dash-ann-link">🔗 Buka Tautan</a>`
      : '';
    box.innerHTML = `
      <div class="dash-ann-header">
        <span class="dash-ann-icon">📢</span>
        <div class="dash-ann-judul">${escHtml(ann.judul || 'Pengumuman')}</div>
      </div>
      <div class="dash-ann-isi">${escHtml(ann.isi || '')}</div>
      ${urlHtml}`;
    box.classList.remove('hidden');
  } catch (e) {
    box.classList.add('hidden');
  }
}

async function loadAnnouncementToEditor() {
  try {
    const res = await API.call('getAnnouncement');
    const ann = res.announcement || {};
    const judulEl = document.getElementById('ann-judul');
    const isiEl   = document.getElementById('ann-isi');
    const urlEl   = document.getElementById('ann-url');
    if (judulEl) judulEl.value = ann.judul || '';
    if (isiEl)   isiEl.value   = ann.isi   || '';
    if (urlEl)   urlEl.value   = ann.url   || '';
  } catch (e) { /* abaikan */ }
}

async function saveAnnouncement() {
  const judul = document.getElementById('ann-judul')?.value.trim() || '';
  const isi   = document.getElementById('ann-isi')?.value.trim()   || '';
  const url   = document.getElementById('ann-url')?.value.trim()   || '';
  try {
    await API.post('saveAnnouncement', { announcement: JSON.stringify({ judul, isi, url }) });
    showToast('Pengumuman disimpan!', 'success');
  } catch (e) {
    showToast('Gagal menyimpan pengumuman.', 'error');
  }
}

// ===== HELPERS =====

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setStatEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function toggleDashCard(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
}

function getInitials(nama) {
  if (!nama) return '?';
  return nama.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
