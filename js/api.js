// ===== API LAYER =====
// ⚠️  GANTI URL INI dengan URL Google Apps Script Web App Anda.
//     Setelah diisi, tidak perlu diubah lagi.
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyHgdNtLBeznoZIgfA3ijnut-12z0XeqKpKE1PGrxW1ONM5pvYmyiKBMlrh5-mYx9oNfQ/exec';

const API = {
  getUrl() {
    // Prioritas: URL yang disimpan admin di localStorage (bisa di-override via panel admin)
    return localStorage.getItem('gasUrl') || GAS_URL;
  },

  getToken() {
    try {
      const u = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      return u.token || '';
    } catch { return ''; }
  },

  async call(action, payload = {}) {
    const url = this.getUrl();
    if (!url || url.includes('GANTI_DENGAN')) {
      showToast('URL Apps Script belum diset!', 'error');
      throw new Error('No GAS URL');
    }
    showLoading(true);
    try {
      const params = new URLSearchParams({ action, token: this.getToken(), ...payload });
      const res = await fetch(`${url}?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
      throw e;
    } finally {
      showLoading(false);
    }
  },

  async post(action, body = {}) {
    const url = this.getUrl();
    if (!url || url.includes('GANTI_DENGAN')) {
      showToast('URL Apps Script belum diset!', 'error');
      throw new Error('No GAS URL');
    }
    showLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action, token: this.getToken(), ...body })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
      throw e;
    } finally {
      showLoading(false);
    }
  },

  async login(username, password, kelasId) {
    const url = this.getUrl();
    if (!url || url.includes('GANTI_DENGAN')) {
      showToast('URL Apps Script belum diset!', 'error');
      throw new Error('No GAS URL');
    }
    showLoading(true);
    try {
      const params = new URLSearchParams({ action: 'login', username, password, kelasId });
      const res = await fetch(`${url}?${params.toString()}`);
      return await res.json();
    } catch (e) {
      showToast('Gagal terhubung ke server', 'error');
      throw e;
    } finally {
      showLoading(false);
    }
  },

  async getKelasPublic() {
    const url = this.getUrl();
    if (!url || url.includes('GANTI_DENGAN')) return { kelas: [] };
    try {
      const params = new URLSearchParams({ action: 'getKelasPublic' });
      const res = await fetch(`${url}?${params.toString()}`);
      return await res.json();
    } catch { return { kelas: [] }; }
  }
};
