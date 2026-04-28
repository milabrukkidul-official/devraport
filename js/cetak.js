// ===== CETAK RAPOR (per kelas, A4) =====
// namaKelas & namaWali diambil dari data kelas (_KELAS), bukan dari setting

let cetakCache = {};

async function loadCetakData() {
  const kelasId = getActiveKelasId('cetak');
  if (!kelasId) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }
  try {
    // Ambil semua data paralel, termasuk info kelas dari daftar kelas
    const [settingRes, siswaRes, nilaiRes, kkmRes, ekskulRes, kelasRes] = await Promise.all([
      API.call('getSetting', { kelasId }),
      API.call('getSiswa',   { kelasId }),
      API.call('getNilai',   { kelasId }),
      API.call('getKKM',     { kelasId }),
      API.call('getEkskul',  { kelasId }),
      API.call('getKelasPublic'),           // ambil daftar kelas untuk namaKelas & namaWali
    ]);

    // Cari data kelas yang sesuai dengan kelasId user
    const kelasList = kelasRes.kelas || [];
    const kelasInfo = kelasList.find(k => k.id === kelasId) || {};

    cetakCache = {
      setting:   settingRes.setting  || {},
      siswa:     siswaRes.siswa      || [],
      mapel:     nilaiRes.mapel      || [],
      nilai:     nilaiRes.nilai      || [],
      kkm:       kkmRes.kkm          || {},
      kegiatan:  ekskulRes.kegiatan  || [],
      ekskul:    ekskulRes.nilai     || [],
      // Data kelas otomatis dari _KELAS sheet
      namaKelas: kelasInfo.nama      || '',
      namaWali:  kelasInfo.waliNama  || kelasInfo.wali || '',  // waliNama = nama lengkap wali kelas
    };
    populateSiswaSelect();
    showToast('Data rapor dimuat!', 'success');
  } catch(e) {}
}

function populateSiswaSelect() {
  const sel = document.getElementById('selectSiswa');
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  cetakCache.siswa.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${i+1}. ${s.nama}`;
    sel.appendChild(opt);
  });
}

function renderRapor() {
  const idx = document.getElementById('selectSiswa').value;
  if (idx === '') { document.getElementById('raporPreview').innerHTML = ''; return; }
  const si = parseInt(idx);
  const { setting, siswa, mapel, nilai, kkm, kegiatan, ekskul, namaKelas, namaWali } = cetakCache;
  const s = siswa[si];
  if (!s) return;

  const nilaiSiswa  = nilai[si]  || {};
  const ekskulSiswa = ekskul[si] || {};

  // ===== KOP =====
  let kopHtml = '';
  if (setting.urlKop) {
    kopHtml = `<img src="${setting.urlKop}" class="rapor-kop-img" alt="KOP"
      onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
      <div class="rapor-kop-text" style="display:none;">
        <h2>${setting.namaSatuan || ''}</h2>
      </div>`;
  } else {
    kopHtml = `<div class="rapor-kop-text">
      <h2>${setting.namaSatuan || 'NAMA SATUAN PENDIDIKAN'}</h2>
    </div>`;
  }

  // ===== IDENTITAS =====
  const tglFmt = formatTanggal(s.tglLahir);
  const ttl    = [s.tempatLahir, tglFmt].filter(Boolean).join(', ');

  // ===== TABEL NILAI =====
  let nilaiRows = '';
  mapel.forEach((m, mi) => {
    const nVal     = (nilaiSiswa[mi] !== undefined && nilaiSiswa[mi] !== '') ? nilaiSiswa[mi] : '';
    const kkmVal   = kkm[m] !== undefined ? kkm[m] : 70;
    const predikat = nVal !== '' ? hitungPredikat(nVal, kkmVal) : '-';
    const predClass= predikat !== '-' ? `predikat-${predikat}` : '';
    const deskripsi= nVal !== '' ? deskripsiPredikat(predikat, s.panggilan || s.nama, m) : '-';
    nilaiRows += `<tr>
      <td>${mi+1}</td>
      <td>${m}</td>
      <td>${kkmVal}</td>
      <td>${nVal !== '' ? nVal : '-'}</td>
      <td class="${predClass}">${predikat}</td>
      <td>${deskripsi}</td>
    </tr>`;
  });

  // ===== EKSKUL (hanya yang terisi) =====
  let ekskulRows = '';
  let adaEkskul  = false;
  kegiatan.forEach((k, ki) => {
    const val = ekskulSiswa[ki];
    if (val) {
      adaEkskul = true;
      const ket = val === 'A' ? 'Sangat Baik' : val === 'B' ? 'Baik' : 'Cukup';
      ekskulRows += `<tr>
        <td>${ki+1}</td>
        <td>${k}</td>
        <td class="predikat-${val}">${val} – ${ket}</td>
      </tr>`;
    }
  });

  // ===== KEHADIRAN =====
  const sakit = nilaiSiswa['sakit'] || 0;
  const ijin  = nilaiSiswa['ijin']  || 0;
  const alpa  = nilaiSiswa['alpa']  || 0;

  // ===== TEMPAT & TGL =====
  const tglRaporFmt = formatTanggal(setting.tglRapor);
  const tempatTgl   = [setting.tempatRapor, tglRaporFmt].filter(Boolean).join(', ');

  // Huruf seksi
  const sekB = adaEkskul ? 'C' : 'B';
  const sekC = adaEkskul ? 'D' : 'C';

  const html = `
  <div class="rapor-page">

    ${kopHtml}
    <hr class="rapor-divider"/>

    <div class="rapor-judul">
      <h3>${setting.judul || 'LAPORAN HASIL BELAJAR SISWA'}</h3>
      <p>Semester ${setting.semester || ''} &nbsp;&bull;&nbsp; Tahun Pelajaran ${setting.tahunPelajaran || ''}</p>
    </div>

    <div class="rapor-identitas">
      <table>
        <tr><td>N a m a</td><td>:</td><td><strong>${s.nama || ''}</strong></td></tr>
        <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttl}</td></tr>
        <tr><td>Nama Orang Tua</td><td>:</td><td>${s.namaOrtu || ''}</td></tr>
        <tr><td>Nomor Induk</td><td>:</td><td>${s.noInduk || ''}</td></tr>
        <tr><td>NISN</td><td>:</td><td>${s.nisn || ''}</td></tr>
        <tr><td>Kelas</td><td>:</td><td>${namaKelas}</td></tr>
      </table>
    </div>

    <div class="rapor-section-title">A. NILAI MATA PELAJARAN</div>
    <table class="rapor-nilai-table">
      <thead>
        <tr>
          <th style="width:32px;">No</th>
          <th>Mata Pelajaran</th>
          <th style="width:48px;">KKM</th>
          <th style="width:48px;">Nilai</th>
          <th style="width:60px;">Predikat</th>
          <th>Deskripsi</th>
        </tr>
      </thead>
      <tbody>
        ${nilaiRows || '<tr><td colspan="6" style="text-align:center;">Belum ada data nilai</td></tr>'}
      </tbody>
    </table>

    ${adaEkskul ? `
    <div class="rapor-section-title">B. EKSTRAKURIKULER</div>
    <table class="rapor-ekskul-table">
      <thead><tr>
        <th style="width:32px;">No</th>
        <th>Kegiatan</th>
        <th style="width:130px;">Predikat</th>
      </tr></thead>
      <tbody>${ekskulRows}</tbody>
    </table>` : ''}

    <div class="rapor-section-title">${sekB}. KETIDAKHADIRAN</div>
    <table class="rapor-kehadiran-table">
      <thead><tr><th>Sakit</th><th>Ijin</th><th>Alpa</th></tr></thead>
      <tbody><tr>
        <td>${sakit} hari</td>
        <td>${ijin} hari</td>
        <td>${alpa} hari</td>
      </tr></tbody>
    </table>

    ${s.pesan ? `
    <div class="rapor-section-title">${sekC}. CATATAN WALI KELAS</div>
    <div class="rapor-catatan">${s.pesan}</div>` : ''}

    <div class="rapor-tempat-tgl">${tempatTgl}</div>

    <div class="rapor-ttd">
      <div class="ttd-box">
        <p>Orang Tua / Wali Murid</p>
        <div class="ttd-space"></div>
        <div class="ttd-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
      </div>
      <div class="ttd-box">
        <p>Wali Kelas</p>
        <div class="ttd-space"></div>
        <div class="ttd-name">( ${namaWali || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} )</div>
      </div>
      <div class="ttd-box">
        <p>Kepala Madrasah</p>
        <div class="ttd-space"></div>
        <div class="ttd-name">( ${setting.namaKepala || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} )</div>
      </div>
    </div>

  </div>`;

  document.getElementById('raporPreview').innerHTML = html;
}

function cetakRapor() {
  const idx = document.getElementById('selectSiswa').value;
  if (idx === '') { showToast('Pilih siswa terlebih dahulu!', 'error'); return; }
  window.print();
}
