// ===== EKSTRAKURIKULER (per rombel) =====

let ekskulData = { kegiatan: [], siswa: [], nilai: [] };

async function loadEkskul() {
  const rombelId = getActiveRombelId('ekskul');
  if (!rombelId) { showToast('Pilih rombel terlebih dahulu!', 'error'); return; }
  try {
    const data = await API.call('getEkskul', { kelasId: rombelId });
    ekskulData = data;
    renderTabelEkskul();
    showToast('Data ekskul dimuat!', 'success');
  } catch(e) {}
}

function renderTabelEkskul() {
  const container = document.getElementById('ekskulContainer');
  const { kegiatan, siswa, nilai } = ekskulData;
  if (!siswa || !siswa.length) {
    container.innerHTML = '<p class="hint">Belum ada data siswa.</p>';
    return;
  }
  let html = `<div style="overflow-x:auto;"><table>
    <thead><tr><th>No</th><th>Nama Siswa</th>`;
  kegiatan.forEach((k, ki) => {
    html += `<th style="min-width:110px;">${k}<br/>
      <button class="btn-danger" onclick="hapusKegiatan(${ki})" style="padding:1px 5px;font-size:0.7rem;margin-top:3px;">✖</button>
    </th>`;
  });
  html += `</tr></thead><tbody>`;
  siswa.forEach((s, si) => {
    html += `<tr><td>${si+1}</td><td style="white-space:nowrap;">${s.nama}</td>`;
    kegiatan.forEach((k, ki) => {
      const val = (nilai[si] && nilai[si][ki] !== undefined) ? nilai[si][ki] : '';
      html += `<td>
        <select onchange="updateEkskul(${si},${ki},this.value)" style="width:110px;">
          <option value="">-</option>
          <option value="A" ${val==='A'?'selected':''}>A (Sangat Baik)</option>
          <option value="B" ${val==='B'?'selected':''}>B (Baik)</option>
          <option value="C" ${val==='C'?'selected':''}>C (Cukup)</option>
        </select>
      </td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function updateEkskul(si, ki, val) {
  if (!ekskulData.nilai[si]) ekskulData.nilai[si] = {};
  ekskulData.nilai[si][ki] = val;
}

function tambahEkskul() {
  const nama = prompt('Nama Kegiatan Ekstrakurikuler:');
  if (!nama) return;
  ekskulData.kegiatan.push(nama.trim());
  renderTabelEkskul();
}

function hapusKegiatan(ki) {
  if (!confirm(`Hapus kegiatan "${ekskulData.kegiatan[ki]}"?`)) return;
  ekskulData.kegiatan.splice(ki, 1);
  ekskulData.nilai.forEach(row => {
    if (row && typeof row === 'object') delete row[ki];
  });
  renderTabelEkskul();
}

async function saveEkskul() {
  const rombelId = getActiveRombelId('ekskul');
  if (!rombelId) { showToast('Pilih rombel terlebih dahulu!', 'error'); return; }
  try {
    await API.post('saveEkskul', {
      kelasId: rombelId,
      kegiatan: JSON.stringify(ekskulData.kegiatan),
      nilai:    JSON.stringify(ekskulData.nilai)
    });
    showToast('Data ekskul disimpan!', 'success');
  } catch(e) {}
}
