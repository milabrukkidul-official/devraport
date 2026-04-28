// ===== REKAP NILAI (per kelas) =====

let nilaiData = { mapel: [], siswa: [], nilai: [] };

async function loadNilai() {
  const kelasId = getActiveKelasId('nilai');
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  try {
    const data = await API.call('getNilai', { kelasId });
    nilaiData = data;
    renderTabelNilai();
    showToast('Data nilai dimuat!', 'success');
  } catch(e) {}
}

function renderTabelNilai() {
  const container = document.getElementById('nilaiContainer');
  const { mapel, siswa, nilai } = nilaiData;
  if (!siswa || !siswa.length) {
    container.innerHTML = '<p class="hint">Belum ada data siswa di kelas ini.</p>';
    return;
  }

  // Cek akses: guruMapel hanya bisa edit nilai, tidak bisa tambah/hapus mapel
  const isGuru = currentUser?.role === 'guruMapel';

  let html = `<div style="overflow-x:auto;"><table>
    <thead><tr>
      <th>No</th><th>Nama Siswa</th>`;
  mapel.forEach((m, mi) => {
    html += `<th style="min-width:90px;">${m}`;
    if (!isGuru) html += `<br/><button class="btn-danger" onclick="hapusMapel(${mi})" style="padding:1px 5px;font-size:0.7rem;margin-top:3px;">✖</button>`;
    html += `</th>`;
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

function tambahMapel() {
  if (currentUser?.role === 'guruMapel') { showToast('Guru Mapel tidak bisa menambah mata pelajaran.', 'error'); return; }
  const nama = prompt('Nama Mata Pelajaran:');
  if (!nama) return;
  nilaiData.mapel.push(nama.trim());
  renderTabelNilai();
}

function hapusMapel(mi) {
  if (!confirm(`Hapus mata pelajaran "${nilaiData.mapel[mi]}"?`)) return;
  nilaiData.mapel.splice(mi, 1);
  nilaiData.nilai.forEach(row => {
    if (row && typeof row === 'object') {
      // Geser index
      const keys = Object.keys(row).filter(k => !isNaN(k)).map(Number).sort((a,b)=>a-b);
      keys.forEach(k => { if (k > mi) { row[k-1] = row[k]; delete row[k]; } else if (k === mi) { delete row[k]; } });
    }
  });
  renderTabelNilai();
}

async function saveNilai() {
  const kelasId = getActiveKelasId('nilai');
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  try {
    await API.post('saveNilai', {
      kelasId,
      mapel: JSON.stringify(nilaiData.mapel),
      nilai: JSON.stringify(nilaiData.nilai)
    });
    showToast('Data nilai disimpan!', 'success');
  } catch(e) {}
}
