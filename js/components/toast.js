/* =========================================================
   MoneyFlow — toast.js
   Toast Notifications & Undo Callback System with Vector Icons
   ========================================================= */

import { getIcon } from './icons.js';

export const Toast = {
  show(message, type = 'info', duration = 4000, onUndo = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check';
    if (type === 'danger') iconName = 'alert';
    if (type === 'warning') iconName = 'bell';

    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-${type}">${getIcon(iconName, 18)}</span>
        <span class="text-sm fw-medium">${message}</span>
      </div>
      ${onUndo ? `<button class="btn btn-secondary btn-sm" id="toast-undo-btn">Undo</button>` : ''}
    `;

    container.appendChild(toast);

    if (onUndo) {
      const undoBtn = toast.querySelector('#toast-undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          onUndo();
          toast.remove();
        });
      }
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
