// ===== CETAK RAPOR =====

let cetakCache = {};

async function loadCetakData() {
  try {
    const [settingRes, siswaRes, nilaiRes, kkmRes, ekskulRes] = await Promise.all([
      API.call('getSetting'),
      API.call('getSiswa'),
      API.call('getNilai'),
      API.call('getKKM'),
      API.call('getEkskul'),
    ]);
    cetakCache = {
      setting: settingRes.setting || {},
      siswa:   siswaRes.siswa || [],
      mapel:   nilaiRes.mapel || [],
      nilai:   nilaiRes.nilai || [],
      kkm:     kkmRes.kkm || {},
      kegiatan:ekskulRes.kegiatan || [],
      ekskul:  ekskulRes.nilai || [],
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
  const { setting, siswa, mapel, nilai, kkm, kegiatan, ekskul } = cetakCache;
  const s = siswa[si];
  if (!s) return;

  const nilaiSiswa  = nilai[si] || {};
  const ekskulSiswa = ekskul[si] || {};

  // KOP
  let kopHtml = '';
  if (setting.urlKop) {
    kopHtml = `<img src="${setting.urlKop}" class="rapor-kop" alt="KOP" onerror="this.style.display='none'" />`;
  } else {
    kopHtml = `<div class="rapor-kop-fallback">
      <h2>${setting.namaSatuan || 'NAMA SATUAN PENDIDIKAN'}</h2>
      <p>Kop sekolah belum diatur. Silakan isi URL KOP di menu Setting.</p>
    </div>`;
  }

  // Identitas
  const tglLahirFmt = formatTanggal(s.tglLahir);
  const ttlStr = [s.tempatLahir, tglLahirFmt].filter(Boolean).join(', ');

  // Tabel Nilai
  let nilaiRows = '';
  mapel.forEach((m, mi) => {
    const nilaiVal = nilaiSiswa[mi] !== undefined ? nilaiSiswa[mi] : '';
    const kkmVal   = kkm[m] || 70;
    const predikat = nilaiVal !== '' ? hitungPredikat(nilaiVal, kkmVal) : '-';
    const predClass = predikat !== '-' ? `predikat-${predikat}` : '';
    const deskripsi = nilaiVal !== '' ? deskripsiPredikat(predikat, s.panggilan || s.nama, m) : '-';
    nilaiRows += `<tr>
      <td>${mi+1}</td>
      <td>${m}</td>
      <td style="text-align:center;">${kkmVal}</td>
      <td style="text-align:center;">${nilaiVal !== '' ? nilaiVal : '-'}</td>
      <td style="text-align:center;" class="${predClass}">${predikat}</td>
      <td>${deskripsi}</td>
    </tr>`;
  });

  // Tabel Ekskul (hanya yang terisi)
  let ekskulRows = '';
  let adaEkskul = false;
  kegiatan.forEach((k, ki) => {
    const val = ekskulSiswa[ki];
    if (val) {
      adaEkskul = true;
      const keterangan = val === 'A' ? 'Sangat Baik' : val === 'B' ? 'Baik' : 'Cukup';
      ekskulRows += `<tr>
        <td>${ki+1}</td>
        <td>${k}</td>
        <td class="predikat-${val}">${val} - ${keterangan}</td>
      </tr>`;
    }
  });

  // Kehadiran
  const sakit = nilaiSiswa['sakit'] || 0;
  const ijin  = nilaiSiswa['ijin']  || 0;
  const alpa  = nilaiSiswa['alpa']  || 0;

  // Tanggal rapor
  const tglRaporFmt = formatTanggal(setting.tglRapor);
  const tempatTgl   = [setting.tempatRapor, tglRaporFmt].filter(Boolean).join(', ');

  const html = `
    <div id="raporCetak">
      ${kopHtml}
      <hr class="rapor-divider"/>

      <div class="rapor-judul">
        <h3>${setting.judul || 'LAPORAN HASIL BELAJAR SISWA'}</h3>
        <p>Semester ${setting.semester || ''} &nbsp;|&nbsp; Tahun Pelajaran ${setting.tahunPelajaran || ''}</p>
      </div>

      <div class="rapor-identitas">
        <table>
          <tr><td>N a m a</td><td>:</td><td>${s.nama || ''}</td></tr>
          <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttlStr}</td></tr>
          <tr><td>Nama Orang Tua</td><td>:</td><td>${s.namaOrtu || ''}</td></tr>
          <tr><td>Nomor Induk</td><td>:</td><td>${s.noInduk || ''}</td></tr>
          <tr><td>NISN</td><td>:</td><td>${s.nisn || ''}</td></tr>
          <tr><td>Kelas</td><td>:</td><td>${setting.namaKelas || ''}</td></tr>
        </table>
      </div>

      <div class="rapor-section-title">A. NILAI MATA PELAJARAN</div>
      <table class="rapor-nilai-table">
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th>Mata Pelajaran</th>
            <th style="width:60px;">KKM</th>
            <th style="width:60px;">Nilai</th>
            <th style="width:70px;">Predikat</th>
            <th>Deskripsi</th>
          </tr>
        </thead>
        <tbody>${nilaiRows || '<tr><td colspan="6" style="text-align:center;">Belum ada data nilai</td></tr>'}</tbody>
      </table>

      ${adaEkskul ? `
      <div class="rapor-section-title">B. EKSTRAKURIKULER</div>
      <table class="rapor-ekskul-table">
        <thead>
          <tr><th style="width:40px;">No</th><th>Kegiatan</th><th style="width:140px;">Predikat</th></tr>
        </thead>
        <tbody>${ekskulRows}</tbody>
      </table>` : ''}

      <div class="rapor-section-title">C. KETIDAKHADIRAN</div>
      <div class="rapor-kehadiran">
        <table>
          <thead><tr><th>Sakit</th><th>Ijin</th><th>Alpa</th></tr></thead>
          <tbody><tr>
            <td style="text-align:center;">${sakit} hari</td>
            <td style="text-align:center;">${ijin} hari</td>
            <td style="text-align:center;">${alpa} hari</td>
          </tr></tbody>
        </table>
      </div>

      ${s.pesan ? `
      <div class="rapor-section-title">D. CATATAN WALI KELAS</div>
      <div style="padding:10px;border:1px solid #ccc;border-radius:4px;font-size:0.88rem;margin-bottom:16px;">
        ${s.pesan}
      </div>` : ''}

      <div style="text-align:right;margin-bottom:20px;font-size:0.88rem;">
        ${tempatTgl}
      </div>

      <div class="rapor-ttd">
        <div class="ttd-box">
          <p>Orang Tua / Wali Murid</p>
          <div class="ttd-space"></div>
          <div class="ttd-name">( ................................ )</div>
        </div>
        <div class="ttd-box">
          <p>Wali Kelas</p>
          <div class="ttd-space"></div>
          <div class="ttd-name">( ${setting.namaWali || '................................'} )</div>
        </div>
        <div class="ttd-box">
          <p>Kepala Madrasah</p>
          <div class="ttd-space"></div>
          <div class="ttd-name">( ${setting.namaKepala || '................................'} )</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('raporPreview').innerHTML = html;
}
