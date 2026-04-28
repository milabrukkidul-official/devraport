// ===== API LAYER =====
// Semua komunikasi dengan Google Apps Script

const API = {
  getUrl() {
    return localStorage.getItem('gasUrl') || '';
  },

  async call(action, payload = {}) {
    const url = this.getUrl();
    if (!url) {
      showToast('URL Apps Script belum diset!', 'error');
      throw new Error('No GAS URL');
    }
    showLoading(true);
    try {
      const params = new URLSearchParams({ action, ...payload });
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
    if (!url) {
      showToast('URL Apps Script belum diset!', 'error');
      throw new Error('No GAS URL');
    }
    showLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action, ...body })
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
  }
};
