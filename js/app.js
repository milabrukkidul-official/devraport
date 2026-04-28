// ===== APP CORE =====

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(b => { if (b.getAttribute('onclick')?.includes(name)) b.classList.add('active'); });
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function saveGasUrl() {
  const url = document.getElementById('gasUrl').value.trim();
  if (!url) { showToast('Masukkan URL terlebih dahulu', 'error'); return; }
  localStorage.setItem('gasUrl', url);
  const st = document.getElementById('connStatus');
  st.textContent = '✅ Tersimpan';
  st.className = 'conn-status ok';
  showToast('URL berhasil disimpan!', 'success');
}

// Load saved URL on startup
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gasUrl');
  if (saved) {
    document.getElementById('gasUrl').value = saved;
    const st = document.getElementById('connStatus');
    st.textContent = '✅ Terhubung';
    st.className = 'conn-status ok';
  }
});

// Helper: format tanggal Indonesia
function formatTanggal(dateStr) {
  if (!dateStr) return '';
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper: hitung predikat berdasarkan nilai dan KKM
function hitungPredikat(nilai, kkm) {
  nilai = parseFloat(nilai);
  kkm   = parseFloat(kkm) || 70;
  if (isNaN(nilai)) return '-';
  if (nilai >= 90) return 'A';
  if (nilai >= kkm) return 'B';
  if (nilai >= 60) return 'C';
  return 'D';
}

function deskripsiPredikat(predikat, panggilan, mapel) {
  const map = { A: 'sangat baik', B: 'baik', C: 'cukup', D: 'perlu bimbingan' };
  const ket = map[predikat] || 'cukup';
  return `Ananda ${panggilan} ${predikat === 'A' ? 'sangat baik' : predikat === 'B' ? 'baik' : predikat === 'C' ? 'cukup' : 'perlu bimbingan'} dalam memahami pelajaran ${mapel}.`;
}
