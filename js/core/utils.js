/* =========================================================
   MoneyFlow — utils.js
   Formatters & Utility Helpers
   ========================================================= */

export function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  const val = Math.round(amount);
  const formatted = Math.abs(val).toLocaleString('en-IN');
  return val < 0 ? `−₹${formatted}` : `₹${formatted}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
