/* =========================================================
   Money — js/components/pull-to-refresh.js
   Native Circular Pull-To-Refresh Component (60fps Spring Physics)
   ========================================================= */

import { CloudSync } from '../firebase/sync.js';
import { Router } from '../core/router.js';

export const PullToRefresh = {
  ptrContainer: null,
  spinnerBox: null,
  ringSvg: null,
  ringStroke: null,
  activeSpinner: null,
  scrollContainer: null,

  startY: 0,
  currentY: 0,
  pullDistance: 0,
  isPulling: false,
  isRefreshing: false,

  THRESHOLD: 65,
  MAX_PULL: 85,
  CIRCUMFERENCE: 69.115,

  init() {
    this.scrollContainer = document.getElementById('view-container');
    this.ptrContainer = document.getElementById('ptr-container');
    this.spinnerBox = document.getElementById('ptr-spinner-box');
    this.ringSvg = document.getElementById('ptr-ring-svg');
    this.ringStroke = document.getElementById('ptr-ring-stroke');
    this.activeSpinner = document.getElementById('ptr-active-spinner');

    if (!this.scrollContainer || !this.ptrContainer) return;

    this.attachEvents();
  },

  attachEvents() {
    const el = this.scrollContainer;

    el.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    el.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    el.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    el.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: true });
  },

  handleTouchStart(e) {
    if (window.innerWidth > 900 || this.isRefreshing) return;

    // Pull-to-refresh activates ONLY when content scroll is at the very top
    if (this.scrollContainer.scrollTop <= 0) {
      this.startY = e.touches[0].clientY;
      this.isPulling = false;
      this.pullDistance = 0;
    } else {
      this.startY = 0;
    }
  },

  handleTouchMove(e) {
    if (window.innerWidth > 900 || this.isRefreshing || !this.startY) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - this.startY;

    // Check if downward pull from top scroll position
    if (deltaY > 0 && this.scrollContainer.scrollTop <= 0) {
      this.isPulling = true;
      
      // Apply logarithmic dampening / rubber-band resistance formula
      this.pullDistance = Math.min(this.MAX_PULL, Math.pow(deltaY, 0.85) * 1.8);

      if (this.pullDistance > 5) {
        // Prevent default browser overscroll / refresh behavior
        if (e.cancelable) e.preventDefault();

        this.updateUI(this.pullDistance);
      }
    } else {
      if (this.isPulling) {
        this.resetUI();
        this.isPulling = false;
      }
    }
  },

  updateUI(distance) {
    if (!this.ptrContainer || !this.spinnerBox) return;

    this.ptrContainer.style.transition = 'none';
    this.ptrContainer.style.height = `${distance}px`;

    const ratio = Math.min(1, distance / this.THRESHOLD);
    const opacity = Math.min(1, ratio * 1.2);
    const scale = 0.6 + (ratio * 0.45);

    this.spinnerBox.style.opacity = opacity;
    this.spinnerBox.style.transform = `scale(${scale})`;

    if (ratio >= 1) {
      if (this.ringSvg) this.ringSvg.style.display = 'none';
      if (this.activeSpinner) this.activeSpinner.style.display = 'block';

      if (navigator.vibrate && !this.hasVibrated) {
        try { navigator.vibrate(10); } catch (_) {}
        this.hasVibrated = true;
      }
    } else {
      this.hasVibrated = false;
      if (this.ringSvg) this.ringSvg.style.display = 'block';
      if (this.activeSpinner) this.activeSpinner.style.display = 'none';

      if (this.ringStroke) {
        const offset = this.CIRCUMFERENCE * (1 - ratio);
        this.ringStroke.style.strokeDashoffset = offset;
      }
    }
  },

  async handleTouchEnd() {
    if (!this.isPulling || this.isRefreshing) return;

    this.isPulling = false;

    if (this.pullDistance >= this.THRESHOLD) {
      await this.triggerRefresh();
    } else {
      this.resetUI();
    }
  },

  async triggerRefresh() {
    this.isRefreshing = true;

    // Lock indicator container at 52px during refresh action
    this.ptrContainer.style.transition = 'height 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
    this.ptrContainer.style.height = '52px';
    this.spinnerBox.style.opacity = '1';
    this.spinnerBox.style.transform = 'scale(1)';

    if (this.ringSvg) this.ringSvg.style.display = 'none';
    if (this.activeSpinner) this.activeSpinner.style.display = 'block';

    const startTime = Date.now();

    try {
      // Execute Cloud Sync & view re-render
      await CloudSync.syncPending();
      await Router.handleRoute();
    } catch (err) {
      console.warn('PTR sync notice:', err);
    }

    // Ensure minimum 550ms spin for natural 60fps tactile feel
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, 550 - elapsed);

    setTimeout(() => {
      this.resetUI();
      this.isRefreshing = false;
    }, remainingTime);
  },

  resetUI() {
    if (!this.ptrContainer || !this.spinnerBox) return;

    this.ptrContainer.style.transition = 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    this.ptrContainer.style.height = '0px';

    this.spinnerBox.style.opacity = '0';
    this.spinnerBox.style.transform = 'scale(0.6)';

    setTimeout(() => {
      if (this.ringSvg) this.ringSvg.style.display = 'block';
      if (this.activeSpinner) this.activeSpinner.style.display = 'none';
      if (this.ringStroke) this.ringStroke.style.strokeDashoffset = this.CIRCUMFERENCE;
      this.hasVibrated = false;
    }, 300);
  }
};
