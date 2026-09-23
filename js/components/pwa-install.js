/* =========================================================
   Money — js/components/pwa-install.js
   Native PWA Installation Detection & Custom Install Experience
   ========================================================= */

import { Modal } from './modal.js';
import { Toast } from './toast.js';
import { getIcon } from './icons.js';

let deferredPrompt = null;

export const PWAInstall = {
  isInstalled: false,

  init() {
    // Check if running as installed standalone PWA
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.updateInstallButtons(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      deferredPrompt = null;
      this.updateInstallButtons(false);
      Toast.show('Money installed to Home Screen successfully!', 'success');
    });
  },

  updateInstallButtons(show) {
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => {
      btn.style.display = show && !this.isInstalled ? 'inline-flex' : 'none';
    });
  },

  async promptInstall() {
    if (this.isInstalled) {
      Toast.show('Money is already installed on your device!', 'info');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        Toast.show('Installing Money...', 'info');
      }
      deferredPrompt = null;
      this.updateInstallButtons(false);
      return;
    }

    // iOS Safari Guide fallback
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      Modal.open({
        title: 'Install Money on iOS',
        bodyHTML: `
          <div class="flex flex-col gap-3 text-center p-2">
            <div class="stat-icon-wrapper stat-icon-primary" style="margin: 0 auto; width: 56px; height: 56px; font-size: 28px;">M</div>
            <h4 class="fw-bold fs-md">Add Money to Home Screen</h4>
            <p class="text-xs text-muted">To install Money on your iPhone or iPad, follow these simple steps:</p>
            <ol class="text-xs text-secondary text-left pl-4 flex flex-col gap-2 mt-2" style="background: var(--surface-alt); padding: 14px; border-radius: var(--radius-md);">
              <li>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
          </div>
        `,
        footerHTML: `<button class="btn btn-primary w-full" id="close-ios-install">Got It</button>`,
        onRender: (modalEl) => {
          modalEl.querySelector('#close-ios-install')?.addEventListener('click', () => Modal.close());
        }
      });
      return;
    }

    Toast.show('Open browser menu and select "Install Money" or "Add to Home Screen".', 'info');
  }
};
