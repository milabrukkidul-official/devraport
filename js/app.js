// ===== APP CORE =====

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-page="${name}"]`);
  if (btn) btn.classList.add('active');
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3200);
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function saveGasUrl() {
  const url = document.getElementById('adminGasUrl').value.trim();
  if (!url) { showToast('Masukkan URL terlebih dahulu', 'error'); return; }
  localStorage.setItem('gasUrl', url);
  const st = document.getElementById('connStatus');
  st.textContent = '✅ Override tersimpan';
  st.className = 'conn-status ok';
  showToast('URL override disimpan!', 'success');
  loadKelasLogin();
}

function clearGasUrl() {
  localStorage.removeItem('gasUrl');
  document.getElementById('adminGasUrl').value = '';
  const st = document.getElementById('connStatus');
  st.textContent = '✅ Menggunakan URL dari kode';
  st.className = 'conn-status ok';
  showToast('Override dihapus, menggunakan GAS_URL dari api.js', 'success');
}

// ===== KELAS AKTIF (admin bisa pilih kelas, wali kelas otomatis) =====

// Ambil kelasId yang sedang aktif untuk halaman tertentu
function getActiveKelasId(page) {
  if (!currentUser) return '';
  const role = currentUser.role;
  // Admin: ambil dari selector halaman
  if (role === 'admin') {
    const sel = document.getElementById(`adminKelasSelect-${page}`);
    return sel ? sel.value : '';
  }
  // Guru mapel: kelasId adalah array, ambil dari selector nilai
  if (role === 'guruMapel') {
    const sel = document.getElementById(`adminKelasSelect-${page}`);
    return sel ? sel.value : '';
  }
  // Wali kelas: string tunggal
  return currentUser.kelasId || '';
}

// Isi semua selector kelas admin dengan daftar kelas dari cache
function populateAdminKelasSelectors() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const pages = ['setting','siswa','nilai','ekskul','kkm','cetak'];
  pages.forEach(page => {
    const bar = document.getElementById(`adminKelasBar-${page}`);
    const sel = document.getElementById(`adminKelasSelect-${page}`);
    if (!bar || !sel) return;
    bar.classList.remove('hidden');
    const prev = sel.value;
    sel.innerHTML = '<option value="">-- Pilih Rombel --</option>';
    (window._rombelList || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.nama} (${r.id})`;
      if (r.id === prev) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

// Dipanggil setelah loadAdminData berhasil
function onRombelListLoaded(rombelList) {
  window._rombelList = rombelList || [];
  populateAdminKelasSelectors();
}

// ===== HELPERS =====
function formatTanggal(dateStr) {
  if (!dateStr) return '';
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function hitungPredikat(nilai, kkm) {
  nilai = parseFloat(nilai);
  kkm   = parseFloat(kkm) || 70;
  if (isNaN(nilai) || nilai === '') return '-';
  if (nilai >= 90)   return 'A';
  if (nilai >= kkm)  return 'B';
  if (nilai >= 60)   return 'C';
  return 'D';
}

function deskripsiPredikat(predikat, panggilan, mapel) {
  const ket = { A: 'sangat baik', B: 'baik', C: 'cukup', D: 'perlu bimbingan' };
  return `Ananda ${panggilan} ${ket[predikat] || 'cukup'} dalam memahami pelajaran ${mapel}.`;
}

function adminTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('adminTab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

// Preview KOP
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('s_urlKop');
  if (inp) {
    inp.addEventListener('blur', () => {
      const prev = document.getElementById('kopPreview');
      if (!prev) return;
      const url = inp.value.trim();
      prev.innerHTML = url
        ? `<img src="${url}" style="max-height:80px;max-width:300px;border:1px solid #ddd;border-radius:4px;" onerror="this.style.display='none'" />`
        : '';
    });
  }
});
