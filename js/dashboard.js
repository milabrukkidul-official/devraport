// ===== DASHBOARD =====

async function loadDashboard() {
  const role = currentUser?.role;

  // Reset semua stat
  setStatEl('dash-stat-rombel', '—');
  setStatEl('dash-stat-siswa', '—');
  setStatEl('dash-stat-user', '—');
  setStatEl('dash-stat-mapel', '—');

  // Info user
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

  // Sembunyikan/tampilkan kartu sesuai role
  toggleDashCard('dash-card-rombel', role === 'admin');
  toggleDashCard('dash-card-user',   role === 'admin');

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

      // Hitung total siswa dari semua rombel (paralel)
      let totalSiswa = 0;
      let totalMapel = 0;
      if (rombelList.length) {
        const siswaResults = await Promise.all(
          rombelList.map(r => API.call('getSiswa', { kelasId: r.id }).catch(() => ({ siswa: [] })))
        );
        siswaResults.forEach(res => { totalSiswa += (res.siswa || []).length; });

        // Ambil mapel dari rombel pertama sebagai sampel
        const nilaiRes = await API.call('getNilai', { kelasId: rombelList[0].id }).catch(() => ({ mapel: [] }));
        totalMapel = (nilaiRes.mapel || []).length;
      }
      setStatEl('dash-stat-siswa', totalSiswa);
      setStatEl('dash-stat-mapel', totalMapel);

      // Render daftar rombel di dashboard
      renderDashRombelList(rombelList);

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
      renderDashRombelList([]);

    } else {
      // guruMapel
      const rombelList = Array.isArray(currentUser.rombelId) ? currentUser.rombelId : [];
      setStatEl('dash-stat-rombel', rombelList.length);
      renderDashRombelList([]);
    }
  } catch (e) {
    console.error('loadDashboard error:', e);
  }
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

function renderDashRombelList(rombelList) {
  const wrap = document.getElementById('dash-rombel-list');
  if (!wrap) return;

  if (!rombelList.length) {
    const role = currentUser?.role;
    if (role === 'walikelas') {
      wrap.innerHTML = `<div class="dash-rombel-item">
        <span class="dash-rombel-icon">🏫</span>
        <div>
          <div class="dash-rombel-nama">${currentUser.rombelId || 'Rombel Anda'}</div>
          <div class="dash-rombel-sub">Kelas yang Anda ampu</div>
        </div>
      </div>`;
    } else if (role === 'guruMapel') {
      const list = Array.isArray(currentUser.rombelId) ? currentUser.rombelId : [];
      if (!list.length) {
        wrap.innerHTML = '<p class="hint" style="padding:16px;">Belum ditugaskan ke rombel.</p>';
        return;
      }
      wrap.innerHTML = list.map(rid => `
        <div class="dash-rombel-item">
          <span class="dash-rombel-icon">🏫</span>
          <div>
            <div class="dash-rombel-nama">${rid}</div>
            <div class="dash-rombel-sub">Rombel yang Anda ampu</div>
          </div>
        </div>`).join('');
    } else {
      wrap.innerHTML = '<p class="hint" style="padding:16px;">Belum ada rombel.</p>';
    }
    return;
  }

  wrap.innerHTML = rombelList.map(r => `
    <div class="dash-rombel-item" onclick="showPage('siswa')" style="cursor:pointer;" title="Lihat siswa ${r.nama}">
      <span class="dash-rombel-icon">🏫</span>
      <div style="flex:1;min-width:0;">
        <div class="dash-rombel-nama">${r.nama}</div>
        <div class="dash-rombel-sub">${r.waliNama || r.wali || 'Belum ada wali kelas'}</div>
      </div>
      <span style="color:#9ca3af;font-size:0.8rem;">${(r.mapel || []).length} mapel</span>
    </div>`).join('');
}

