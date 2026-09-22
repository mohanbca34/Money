/* =========================================================
   Money — js/components/auth-modal.js
   iOS HIG Firebase Authentication Screen (Email, Google, Reset Password)
   ========================================================= */

import { FirebaseAuth } from '../firebase/auth.js';
import { CloudSync } from '../firebase/sync.js';
import { Toast } from './toast.js';
import { getIcon } from './icons.js';

export const AuthModal = {
  activeTab: 'signin', // 'signin' | 'signup' | 'forgot'

  renderOverlay() {
    let container = document.getElementById('auth-overlay-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'auth-overlay-container';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div class="card" style="max-width: 420px; width: 100%; box-shadow: var(--shadow-lg); border-radius: var(--radius-xl); overflow: hidden; padding: 24px;">
          
          <!-- Brand Header -->
          <div class="text-center mb-6">
            <div class="brand-logo" style="width: 48px; height: 48px; margin: 0 auto 12px auto; font-size: 24px;">M</div>
            <h2 class="fw-bold fs-xl" style="letter-spacing: -0.03em;">Money</h2>
            <p class="text-xs text-muted mt-1">Personal Finance & Chit Management Platform</p>
          </div>

          <!-- Auth Navigation Segmented Control -->
          <div class="tabs-container mb-5" style="display: flex; gap: 4px;">
            <button class="tab-btn ${this.activeTab === 'signin' ? 'active' : ''}" id="auth-tab-signin">Sign In</button>
            <button class="tab-btn ${this.activeTab === 'signup' ? 'active' : ''}" id="auth-tab-signup">Create Account</button>
            <button class="tab-btn ${this.activeTab === 'forgot' ? 'active' : ''}" id="auth-tab-forgot">Reset</button>
          </div>

          <!-- Error Alert Banner -->
          <div id="auth-error-banner" class="mb-4" style="display: none; padding: 10px 14px; border-radius: var(--radius-md); background: rgba(255, 59, 48, 0.12); color: var(--ios-red); font-size: 13px; font-weight: 500;"></div>

          <!-- Google Sign In Button -->
          ${this.activeTab !== 'forgot' ? `
            <button class="btn btn-secondary w-100 mb-4" id="auth-google-btn" style="display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600;">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Continue with Google</span>
            </button>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="flex: 1; height: 1px; background: var(--border);"></div>
              <span class="text-xs text-muted">OR EMAIL</span>
              <div style="flex: 1; height: 1px; background: var(--border);"></div>
            </div>
          ` : ''}

          <!-- Dynamic Form Container -->
          <form id="auth-main-form" style="display: flex; flex-direction: column; gap: 12px;">
            ${this.renderFormFields()}
            <button type="submit" class="btn btn-primary w-100 mt-2" id="auth-submit-btn">
              <span id="auth-btn-label">${this.getSubmitLabel()}</span>
            </button>
          </form>

        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  getSubmitLabel() {
    if (this.activeTab === 'signin') return 'Sign In';
    if (this.activeTab === 'signup') return 'Create Account';
    return 'Send Password Reset Email';
  },

  renderFormFields() {
    if (this.activeTab === 'signin') {
      return `
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="auth-email" class="form-input" placeholder="name@example.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
        </div>
      `;
    }
    if (this.activeTab === 'signup') {
      return `
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="auth-email" class="form-input" placeholder="name@example.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">Password (Min 6 chars)</label>
          <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input type="password" id="auth-password-confirm" class="form-input" placeholder="••••••••" required autocomplete="new-password">
        </div>
      `;
    }
    return `
      <div class="form-group">
        <label class="form-label">Account Email Address</label>
        <input type="email" id="auth-email" class="form-input" placeholder="name@example.com" required autocomplete="email">
      </div>
      <p class="text-xs text-muted">We will send a password reset link to your email address.</p>
    `;
  },

  attachEvents(container) {
    // Tab Switches
    container.querySelector('#auth-tab-signin')?.addEventListener('click', () => {
      this.activeTab = 'signin';
      this.renderOverlay();
    });
    container.querySelector('#auth-tab-signup')?.addEventListener('click', () => {
      this.activeTab = 'signup';
      this.renderOverlay();
    });
    container.querySelector('#auth-tab-forgot')?.addEventListener('click', () => {
      this.activeTab = 'forgot';
      this.renderOverlay();
    });

    // Google Sign In
    container.querySelector('#auth-google-btn')?.addEventListener('click', async () => {
      this.showLoading(true);
      try {
        const user = await FirebaseAuth.loginWithGoogle();
        Toast.show(`Welcome, ${user.displayName || user.email}!`, 'success');
        await this.handlePostAuth(user);
      } catch (err) {
        this.showError(err.message);
      } finally {
        this.showLoading(false);
      }
    });

    // Main Form Submit
    container.querySelector('#auth-main-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearError();
      const email = container.querySelector('#auth-email')?.value.trim();
      const password = container.querySelector('#auth-password')?.value;

      if (!email) {
        this.showError('Please enter a valid email address.');
        return;
      }

      this.showLoading(true);
      try {
        if (this.activeTab === 'signin') {
          const user = await FirebaseAuth.loginWithEmail(email, password);
          Toast.show('Logged in successfully!', 'success');
          await this.handlePostAuth(user);
        } else if (this.activeTab === 'signup') {
          const confirmPass = container.querySelector('#auth-password-confirm')?.value;
          if (password !== confirmPass) {
            this.showError('Passwords do not match.');
            this.showLoading(false);
            return;
          }
          const user = await FirebaseAuth.registerWithEmail(email, password);
          Toast.show('Account created successfully!', 'success');
          await this.handlePostAuth(user);
        } else if (this.activeTab === 'forgot') {
          await FirebaseAuth.resetPassword(email);
          Toast.show('Password reset email sent! Check your inbox.', 'success');
          this.activeTab = 'signin';
          this.renderOverlay();
        }
      } catch (err) {
        this.showError(err.message);
      } finally {
        this.showLoading(false);
      }
    });
  },

  async handlePostAuth(user) {
    this.closeOverlay();
    // Execute cloud recovery if IndexedDB is empty
    if (user && user.uid) {
      await CloudSync.restoreUserDataFromCloud(user.uid);
    }
    window.location.reload();
  },

  showLoading(isLoading) {
    const btn = document.getElementById('auth-submit-btn');
    const label = document.getElementById('auth-btn-label');
    if (btn && label) {
      btn.disabled = isLoading;
      label.textContent = isLoading ? 'Processing...' : this.getSubmitLabel();
    }
  },

  showError(msg) {
    const banner = document.getElementById('auth-error-banner');
    if (banner) {
      banner.textContent = msg;
      banner.style.display = 'block';
    }
  },

  clearError() {
    const banner = document.getElementById('auth-error-banner');
    if (banner) {
      banner.textContent = '';
      banner.style.display = 'none';
    }
  },

  closeOverlay() {
    const container = document.getElementById('auth-overlay-container');
    if (container) container.remove();
  }
};
