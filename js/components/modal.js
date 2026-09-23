/* =========================================================
   Money — js/components/modal.js
   iOS Bottom Sheet Modal & Dynamic Overlay Manager (Cancellable Timer Fix)
   ========================================================= */

export const Modal = {
  container: null,
  closeTimeoutHandle: null,

  init() {
    this.container = document.getElementById('modal-container');
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        if (e.target === this.container) this.close();
      });
    }
  },

  open({ title, bodyHTML, footerHTML = '', onRender = null }) {
    if (!this.container) this.init();

    // Cancel any pending close timer to prevent wiping out newly opened modals
    if (this.closeTimeoutHandle) {
      clearTimeout(this.closeTimeoutHandle);
      this.closeTimeoutHandle = null;
    }

    this.container.innerHTML = `
      <div class="modal-card">
        <div class="bottom-sheet-handle"></div>
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    `;

    this.container.classList.add('active');
    this.container.setAttribute('aria-hidden', 'false');

    const closeBtn = this.container.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    if (onRender) onRender(this.container);
  },

  close() {
    if (this.container) {
      this.container.classList.remove('active');
      this.container.setAttribute('aria-hidden', 'true');

      if (this.closeTimeoutHandle) clearTimeout(this.closeTimeoutHandle);

      this.closeTimeoutHandle = setTimeout(() => {
        if (!this.container.classList.contains('active')) {
          this.container.innerHTML = '';
        }
        this.closeTimeoutHandle = null;
      }, 250);
    }
  }
};
