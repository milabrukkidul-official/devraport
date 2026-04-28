// ===== SETTING (per kelas) =====

function getKelasId() {
  return currentUser?.kelasId || '';
}

async function loadSetting() {
  const kelasId = getKelasId();
  if (!kelasId && currentUser?.role !== 'admin') {
    showToast('Tidak ada kelas yang dipilih.', 'error'); return;
  }
  try {
    const data = await API.call('getSetting', { kelasId });
    const s = data.setting || {};
    document.getElementById('s_urlKop').value         = s.urlKop || '';
    document.getElementById('s_namaSatuan').value     = s.namaSatuan || '';
    document.getElementById('s_namaKepala').value     = s.namaKepala || '';
    document.getElementById('s_namaKelas').value      = s.namaKelas || '';
    document.getElementById('s_namaWali').value       = s.namaWali || '';
    document.getElementById('s_semester').value       = s.semester || 'I (GANJIL)';
    document.getElementById('s_tahunPelajaran').value = s.tahunPelajaran || '';
    document.getElementById('s_judul').value          = s.judul || 'LAPORAN HASIL BELAJAR SISWA';
    document.getElementById('s_tempatRapor').value    = s.tempatRapor || '';
    document.getElementById('s_tglRapor').value       = s.tglRapor || '';
    document.getElementById('settingKelasLabel').textContent = kelasId || '(semua)';
    showToast('Setting dimuat!', 'success');
  } catch(e) {}
}

async function saveSetting() {
  const kelasId = getKelasId();
  const setting = {
    urlKop:         document.getElementById('s_urlKop').value.trim(),
    namaSatuan:     document.getElementById('s_namaSatuan').value.trim(),
    namaKepala:     document.getElementById('s_namaKepala').value.trim(),
    namaKelas:      document.getElementById('s_namaKelas').value.trim(),
    namaWali:       document.getElementById('s_namaWali').value.trim(),
    semester:       document.getElementById('s_semester').value,
    tahunPelajaran: document.getElementById('s_tahunPelajaran').value.trim(),
    judul:          document.getElementById('s_judul').value.trim(),
    tempatRapor:    document.getElementById('s_tempatRapor').value.trim(),
    tglRapor:       document.getElementById('s_tglRapor').value,
  };
  try {
    await API.post('saveSetting', { kelasId, setting: JSON.stringify(setting) });
    showToast('Setting disimpan!', 'success');
  } catch(e) {}
}
