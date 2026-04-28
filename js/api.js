// ===== API LAYER =====

const API = {
  getUrl() {
    return localStorage.getItem('gasUrl') || '';
  },

  // Ambil token dari currentUser (disimpan di sessionStorage sebagai 'currentUser')
  getToken() {
    try {
      const u = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      return u.token || '';
    } catch { return ''; }
  },

  async call(action, payload = {}) {
    const url = this.getUrl();
    if (!url) { showToast('URL Apps Script belum diset!', 'error'); throw new Error('No GAS URL'); }
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
    if (!url) { showToast('URL Apps Script belum diset!', 'error'); throw new Error('No GAS URL'); }
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

  // Login tidak butuh token
  async login(username, password, kelasId) {
    const url = this.getUrl();
    if (!url) { showToast('URL Apps Script belum diset!', 'error'); throw new Error('No GAS URL'); }
    showLoading(true);
    try {
      const params = new URLSearchParams({ action: 'login', username, password, kelasId });
      const res = await fetch(`${url}?${params.toString()}`);
      const data = await res.json();
      return data;
    } catch (e) {
      showToast('Gagal terhubung ke server', 'error');
      throw e;
    } finally {
      showLoading(false);
    }
  },

  // Ambil daftar kelas untuk dropdown login (public)
  async getKelasPublic() {
    const url = this.getUrl();
    if (!url) return { kelas: [] };
    try {
      const params = new URLSearchParams({ action: 'getKelasPublic' });
      const res = await fetch(`${url}?${params.toString()}`);
      return await res.json();
    } catch { return { kelas: [] }; }
  }
};
