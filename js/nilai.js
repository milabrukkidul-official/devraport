// ===== REKAP NILAI (per rombel) =====

let nilaiData = { mapel: [], siswa: [], nilai: [] };

async function loadNilai() {
  const rombelId = getActiveRombelId('nilai');
  if (!rombelId) {
    // Jika admin belum pilih rombel, tampilkan pesan tanpa error
    if (currentUser && currentUser.role === 'admin') {
      nilaiData = { mapel: [], siswa: [], nilai: [] };
      renderTabelNilai();
      return;
    }
    showToast('Pilih rombel terlebih dahulu!', 'error');
    return;
  }
  try {
    const data = await API.call('getNilai', { kelasId: rombelId });
    if (data.error) {
      showToast('Error: ' + data.error, 'error');
      return;
    }
    nilaiData = data;
    renderTabelNilai();
    showToast('Data nilai dimuat!', 'success');
  } catch(e) {
    showToast('Error memuat data nilai: ' + e.message, 'error');
    console.error('Error loadNilai:', e);
  }
}

function renderTabelNilai() {
  const container = document.getElementById('nilaiContainer');
  const { mapel, siswa, nilai } = nilaiData;
  const isAdmin = currentUser?.role === 'admin';

  if (!siswa || !siswa.length) {
    container.innerHTML = '<p class="hint">Belum ada data siswa di kelas ini.</p>';
    return;
  }
  if (!mapel || !mapel.length) {
    container.innerHTML = `<p class="hint">Belum ada mata pelajaran.${isAdmin ? ' Tambahkan di panel Admin → Kelola Mapel.' : ' Hubungi admin untuk menambahkan mata pelajaran.'}</p>`;
    return;
  }

  let html = `<div style="overflow-x:auto;"><table>
    <thead><tr>
      <th>No</th><th>Nama Siswa</th>`;
  mapel.forEach(m => {
    html += `<th style="min-width:90px;">${m}</th>`;
  });
  html += `<th>Sakit</th><th>Ijin</th><th>Alpa</th></tr></thead><tbody>`;

  siswa.forEach((s, si) => {
    html += `<tr><td>${si+1}</td><td style="white-space:nowrap;">${s.nama}</td>`;
    mapel.forEach((m, mi) => {
      const val = (nilai[si] && nilai[si][mi] !== undefined) ? nilai[si][mi] : '';
      html += `<td><input type="number" min="0" max="100" value="${val}"
               onchange="updateNilai(${si},${mi},this.value)" style="width:65px;"/></td>`;
    });
    const sakit = (nilai[si] && nilai[si]['sakit']) ? nilai[si]['sakit'] : '';
    const ijin  = (nilai[si] && nilai[si]['ijin'])  ? nilai[si]['ijin']  : '';
    const alpa  = (nilai[si] && nilai[si]['alpa'])  ? nilai[si]['alpa']  : '';
    html += `<td><input type="number" min="0" value="${sakit}" onchange="updateKehadiran(${si},'sakit',this.value)" style="width:50px;"/></td>`;
    html += `<td><input type="number" min="0" value="${ijin}"  onchange="updateKehadiran(${si},'ijin',this.value)"  style="width:50px;"/></td>`;
    html += `<td><input type="number" min="0" value="${alpa}"  onchange="updateKehadiran(${si},'alpa',this.value)"  style="width:50px;"/></td>`;
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function updateNilai(si, mi, val) {
  if (!nilaiData.nilai[si]) nilaiData.nilai[si] = {};
  nilaiData.nilai[si][mi] = val;
}

function updateKehadiran(si, key, val) {
  if (!nilaiData.nilai[si]) nilaiData.nilai[si] = {};
  nilaiData.nilai[si][key] = val;
}

// tambahMapel & hapusMapel hanya dipanggil dari panel admin
function tambahMapel() {
  if (currentUser?.role !== 'admin') {
    showToast('Hanya admin yang bisa menambah mata pelajaran.', 'error'); return;
  }
  const nama = prompt('Nama Mata Pelajaran:');
  if (!nama || !nama.trim()) return;
  nilaiData.mapel.push(nama.trim());
  renderTabelNilai();
}

function hapusMapel(mi) {
  if (currentUser?.role !== 'admin') {
    showToast('Hanya admin yang bisa menghapus mata pelajaran.', 'error'); return;
  }
  if (!confirm(`Hapus mata pelajaran "${nilaiData.mapel[mi]}"? Semua nilai mapel ini akan hilang!`)) return;
  nilaiData.mapel.splice(mi, 1);
  nilaiData.nilai.forEach(row => {
    if (row && typeof row === 'object') {
      const keys = Object.keys(row).filter(k => !isNaN(k)).map(Number).sort((a,b)=>a-b);
      keys.forEach(k => {
        if (k > mi)      { row[k-1] = row[k]; delete row[k]; }
        else if (k === mi) { delete row[k]; }
      });
    }
  });
  renderTabelNilai();
}

async function saveNilai() {
  const rombelId = getActiveRombelId('nilai');
  if (!rombelId) { showToast('Pilih rombel terlebih dahulu!', 'error'); return; }
  try {
    await API.post('saveNilai', {
      kelasId: rombelId,
      mapel: JSON.stringify(nilaiData.mapel),
      nilai: JSON.stringify(nilaiData.nilai)
    });
    showToast('Data nilai disimpan!', 'success');
  } catch(e) {}
}
