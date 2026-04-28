// ===== SETTING (per kelas) =====
// namaKelas & namaWali diambil otomatis dari data kelas — tidak ada di form ini

let settingAutoSaveTimer = null;

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
  const setting = buildSettingObj();
  try {
    await API.post('saveSetting', { kelasId, setting: JSON.stringify(setting) });
    showToast('Setting disimpan!', 'success');
  } catch(e) {}
}

function buildSettingObj() {
  return {
    urlKop:         document.getElementById('s_urlKop').value.trim(),
    namaSatuan:     document.getElementById('s_namaSatuan').value.trim(),
    namaKepala:     document.getElementById('s_namaKepala').value.trim(),
    semester:       document.getElementById('s_semester').value,
    tahunPelajaran: document.getElementById('s_tahunPelajaran').value.trim(),
    judul:          document.getElementById('s_judul').value.trim(),
    tempatRapor:    document.getElementById('s_tempatRapor').value.trim(),
    tglRapor:       document.getElementById('s_tglRapor').value,
  };
}

// Auto-save: simpan otomatis 1.5 detik setelah user berhenti mengetik
function settingChanged() {
  clearTimeout(settingAutoSaveTimer);
  settingAutoSaveTimer = setTimeout(async () => {
    const kelasId = getKelasId();
    if (!kelasId && currentUser?.role !== 'admin') return;
    const setting = buildSettingObj();
    try {
      await API.post('saveSetting', { kelasId, setting: JSON.stringify(setting) });
      // Toast kecil tanpa mengganggu
      const t = document.getElementById('toast');
      t.textContent = '💾 Tersimpan otomatis';
      t.className = 'toast success';
      t.classList.remove('hidden');
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.add('hidden'), 1800);
    } catch(e) {}
  }, 1500);
}

// Pasang event listener auto-save setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const ids = ['s_urlKop','s_namaSatuan','s_namaKepala',
               's_semester','s_tahunPelajaran','s_judul',
               's_tempatRapor','s_tglRapor'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  settingChanged);
      el.addEventListener('change', settingChanged);
    }
  });
});
