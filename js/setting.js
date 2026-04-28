// ===== SETTING =====

async function loadSetting() {
  try {
    const data = await API.call('getSetting');
    const s = data.setting || {};
    document.getElementById('s_urlKop').value        = s.urlKop || '';
    document.getElementById('s_namaSatuan').value    = s.namaSatuan || '';
    document.getElementById('s_namaKepala').value    = s.namaKepala || '';
    document.getElementById('s_namaKelas').value     = s.namaKelas || '';
    document.getElementById('s_namaWali').value      = s.namaWali || '';
    document.getElementById('s_semester').value      = s.semester || 'I (GANJIL)';
    document.getElementById('s_tahunPelajaran').value= s.tahunPelajaran || '';
    document.getElementById('s_judul').value         = s.judul || '';
    document.getElementById('s_tempatRapor').value   = s.tempatRapor || '';
    document.getElementById('s_tglRapor').value      = s.tglRapor || '';
    showToast('Setting berhasil dimuat!', 'success');
  } catch(e) {}
}

async function saveSetting() {
  const setting = {
    urlKop:        document.getElementById('s_urlKop').value.trim(),
    namaSatuan:    document.getElementById('s_namaSatuan').value.trim(),
    namaKepala:    document.getElementById('s_namaKepala').value.trim(),
    namaKelas:     document.getElementById('s_namaKelas').value.trim(),
    namaWali:      document.getElementById('s_namaWali').value.trim(),
    semester:      document.getElementById('s_semester').value,
    tahunPelajaran:document.getElementById('s_tahunPelajaran').value.trim(),
    judul:         document.getElementById('s_judul').value.trim(),
    tempatRapor:   document.getElementById('s_tempatRapor').value.trim(),
    tglRapor:      document.getElementById('s_tglRapor').value,
  };
  try {
    await API.post('saveSetting', { setting: JSON.stringify(setting) });
    showToast('Setting berhasil disimpan!', 'success');
  } catch(e) {}
}
