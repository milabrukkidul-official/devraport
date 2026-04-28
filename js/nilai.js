// ===== REKAP NILAI =====

let nilaiData = { mapel: [], siswa: [], nilai: [] };

async function loadNilai() {
  try {
    const data = await API.call('getNilai');
    nilaiData = data;
    renderTabelNilai();
    showToast('Data nilai dimuat!', 'success');
  } catch(e) {}
}

function renderTabelNilai() {
  const container = document.getElementById('nilaiContainer');
  const { mapel, siswa, nilai } = nilaiData;

  if (!siswa.length) {
    container.innerHTML = '<p class="hint">Belum ada data siswa. Tambahkan siswa terlebih dahulu.</p>';
    return;
  }

  let html = `<table id="tblNilai">
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Siswa</th>`;
  mapel.forEach((m, mi) => {
    html += `<th>${m}<br/><button class="btn-danger" onclick="hapusMapel(${mi})" style="padding:2px 6px;font-size:0.7rem;margin-top:4px;">✖</button></th>`;
  });
  html += `<th>Sakit</th><th>Ijin</th><th>Alpa</th></tr></thead><tbody>`;

  siswa.forEach((s, si) => {
    html += `<tr><td>${si+1}</td><td>${s.nama}</td>`;
    mapel.forEach((m, mi) => {
      const val = (nilai[si] && nilai[si][mi] !== undefined) ? nilai[si][mi] : '';
      html += `<td><input type="number" min="0" max="100" value="${val}" 
               onchange="updateNilai(${si},${mi},this.value)" style="width:60px;"/></td>`;
    });
    // Kehadiran
    const sakit = (nilai[si] && nilai[si]['sakit']) ? nilai[si]['sakit'] : '';
    const ijin  = (nilai[si] && nilai[si]['ijin'])  ? nilai[si]['ijin']  : '';
    const alpa  = (nilai[si] && nilai[si]['alpa'])  ? nilai[si]['alpa']  : '';
    html += `<td><input type="number" min="0" value="${sakit}" onchange="updateKehadiran(${si},'sakit',this.value)" style="width:50px;"/></td>`;
    html += `<td><input type="number" min="0" value="${ijin}"  onchange="updateKehadiran(${si},'ijin',this.value)"  style="width:50px;"/></td>`;
    html += `<td><input type="number" min="0" value="${alpa}"  onchange="updateKehadiran(${si},'alpa',this.value)"  style="width:50px;"/></td>`;
    html += `</tr>`;
  });

  html += `</tbody></table>`;
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
  const nama = prompt('Nama Mata Pelajaran:');
  if (!nama) return;
  nilaiData.mapel.push(nama.trim());
  renderTabelNilai();
}

function hapusMapel(mi) {
  if (!confirm(`Hapus mata pelajaran "${nilaiData.mapel[mi]}"?`)) return;
  nilaiData.mapel.splice(mi, 1);
  nilaiData.nilai.forEach(row => {
    if (Array.isArray(row)) row.splice(mi, 1);
  });
  renderTabelNilai();
}

async function saveNilai() {
  try {
    await API.post('saveNilai', {
      mapel: JSON.stringify(nilaiData.mapel),
      nilai: JSON.stringify(nilaiData.nilai)
    });
    showToast('Data nilai disimpan!', 'success');
  } catch(e) {}
}
