// ===== DATA SISWA (per kelas) =====

let siswaCacheList = [];

async function loadSiswa() {
  const kelasId = getActiveKelasId('siswa');
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  try {
    const data = await API.call('getSiswa', { kelasId });
    siswaCacheList = data.siswa || [];
    renderTabelSiswa(siswaCacheList);
    showToast('Data siswa dimuat!', 'success');
  } catch(e) {}
}

function renderTabelSiswa(list) {
  const tbody = document.getElementById('bodySiswa');
  tbody.innerHTML = '';
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="hint">Belum ada data siswa.</td></tr>';
    return;
  }
  list.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${s.nisn||''}</td>
      <td>${s.noInduk||''}</td>
      <td>${s.nama||''}</td>
      <td>${s.panggilan||''}</td>
      <td>${s.tempatLahir||''}</td>
      <td>${formatTanggal(s.tglLahir)}</td>
      <td>${s.namaOrtu||''}</td>
      <td style="max-width:160px;white-space:normal;">${s.pesan||''}</td>
      <td>
        <button class="btn-warning" onclick="editSiswa(${i})" style="padding:3px 8px;font-size:0.78rem;">✏️</button>
        <button class="btn-danger"  onclick="hapusSiswa(${i})" style="padding:3px 8px;font-size:0.78rem;margin-left:4px;">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function tambahSiswa() {
  document.getElementById('modalSiswaTitle').textContent = 'Tambah Siswa';
  document.getElementById('ms_rowIndex').value = '-1';
  ['ms_nisn','ms_noInduk','ms_nama','ms_panggilan','ms_tempatLahir','ms_tglLahir','ms_namaOrtu','ms_pesan']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('modalSiswa').classList.remove('hidden');
}

function editSiswa(idx) {
  const s = siswaCacheList[idx];
  document.getElementById('modalSiswaTitle').textContent = 'Edit Siswa';
  document.getElementById('ms_rowIndex').value   = idx;
  document.getElementById('ms_nisn').value       = s.nisn||'';
  document.getElementById('ms_noInduk').value    = s.noInduk||'';
  document.getElementById('ms_nama').value       = s.nama||'';
  document.getElementById('ms_panggilan').value  = s.panggilan||'';
  document.getElementById('ms_tempatLahir').value= s.tempatLahir||'';
  document.getElementById('ms_tglLahir').value   = s.tglLahir||'';
  document.getElementById('ms_namaOrtu').value   = s.namaOrtu||'';
  document.getElementById('ms_pesan').value      = s.pesan||'';
  document.getElementById('modalSiswa').classList.remove('hidden');
}

async function simpanSiswa() {
  const kelasId = getActiveKelasId('siswa');
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  const idx = parseInt(document.getElementById('ms_rowIndex').value);
  const siswa = {
    nisn:        document.getElementById('ms_nisn').value.trim(),
    noInduk:     document.getElementById('ms_noInduk').value.trim(),
    nama:        document.getElementById('ms_nama').value.trim(),
    panggilan:   document.getElementById('ms_panggilan').value.trim(),
    tempatLahir: document.getElementById('ms_tempatLahir').value.trim(),
    tglLahir:    document.getElementById('ms_tglLahir').value,
    namaOrtu:    document.getElementById('ms_namaOrtu').value.trim(),
    pesan:       document.getElementById('ms_pesan').value.trim(),
  };
  if (!siswa.nama) { showToast('Nama siswa wajib diisi!', 'error'); return; }
  try {
    await API.post('saveSiswa', { kelasId, siswa: JSON.stringify(siswa), rowIndex: idx });
    closeModal('modalSiswa');
    showToast('Data siswa disimpan!', 'success');
    await loadSiswa();
  } catch(e) {}
}

async function hapusSiswa(idx) {
  if (!confirm('Hapus data siswa ini?')) return;
  const kelasId = getActiveKelasId('siswa');
  if (!kelasId) return;
  try {
    await API.post('deleteSiswa', { kelasId, rowIndex: idx });
    showToast('Data siswa dihapus!', 'success');
    await loadSiswa();
  } catch(e) {}
}
