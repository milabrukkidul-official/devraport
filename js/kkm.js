// ===== KKM =====

let kkmData = {};

async function loadKKM() {
  try {
    const data = await API.call('getKKM');
    kkmData = data.kkm || {};
    // Juga ambil daftar mapel dari nilai
    const nilaiData = await API.call('getNilai');
    renderKKM(nilaiData.mapel || []);
    showToast('Data KKM dimuat!', 'success');
  } catch(e) {}
}

function renderKKM(mapelList) {
  const container = document.getElementById('kkmContainer');
  if (!mapelList.length) {
    container.innerHTML = '<p class="hint">Belum ada mata pelajaran. Tambahkan di menu Rekap Nilai.</p>';
    return;
  }
  let html = `<table>
    <thead>
      <tr><th>No</th><th>Mata Pelajaran</th><th>KKM (0-100)</th></tr>
    </thead>
    <tbody>`;
  mapelList.forEach((m, i) => {
    const val = kkmData[m] || 70;
    html += `<tr>
      <td>${i+1}</td>
      <td>${m}</td>
      <td><input type="number" min="0" max="100" value="${val}" 
          onchange="updateKKM('${m.replace(/'/g,"\\'")}',this.value)" style="width:80px;"/></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function updateKKM(mapel, val) {
  kkmData[mapel] = parseInt(val) || 70;
}

async function saveKKM() {
  try {
    await API.post('saveKKM', { kkm: JSON.stringify(kkmData) });
    showToast('KKM berhasil disimpan!', 'success');
  } catch(e) {}
}
