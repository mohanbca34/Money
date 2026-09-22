/* =========================================================
   MoneyFlow — local-storage.js
   Lightweight settings & UI preference store
   ========================================================= */

const PREFIX = 'mf_pref_';

export const LocalStore = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(PREFIX + key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  },

  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};
