/* =========================================================
   Money — js/modules/backup.js
   Settings, PWA Install, Notifications & Data Resilience Module
   ========================================================= */

import { CloudSync } from '../firebase/sync.js';
import { ReportService } from '../services/report-service.js';
import { FirebaseAuth } from '../firebase/auth.js';
import { NotificationService } from '../services/notification-service.js';
import { PWAInstall } from '../components/pwa-install.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';

export const BackupModule = {
  async render(container) {
    const target = container || document.getElementById('view-container');
    if (!target) return;

    const user = FirebaseAuth.getUser();
    const autoBackupEnabled = localStorage.getItem('money_auto_backup_enabled') === 'true';
    const lastBackupTime = localStorage.getItem('money_last_backup_timestamp');
    const formattedLastBackup = lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'Never';
    const notifStatus = await NotificationService.getPermissionStatus();

    target.innerHTML = `
      <div class="card mb-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="card-title">Settings & App Resilience</h3>
            <p class="text-sm text-muted">PWA Installation, Push Notifications, Cloud Synchronization & Data Resilience.</p>
          </div>
          ${user ? `
            <div class="flex items-center gap-2">
              <span class="badge badge-green">${user.email}</span>
              <button class="btn btn-secondary btn-sm" id="auth-logout-btn">${getIcon('trash', 14)} Sign Out</button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- PWA Installation & Push Notification Settings Grid -->
      <div class="grid-2 mb-6">
        <!-- PWA Installation Card -->
        <div class="card flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="stat-icon-wrapper stat-icon-primary">${getIcon('wallet', 24)}</div>
            <div>
              <h4 class="fw-bold">PWA App Installation</h4>
              <p class="text-xs text-muted">Install Money as a native app on Android, iOS or Desktop.</p>
            </div>
          </div>
          <div class="text-xs flex items-center justify-between p-3 rounded-md border" style="background: var(--surface-alt); border-radius: var(--radius-md);">
            <span>Status:</span>
            <span class="badge ${PWAInstall.isInstalled ? 'badge-green' : 'badge-amber'}">
              ${PWAInstall.isInstalled ? 'Installed App' : 'Browser Mode'}
            </span>
          </div>
          <button class="btn btn-primary btn-sm mt-1" id="trigger-pwa-install-btn">
            ${getIcon('download', 14)} Install Money App
          </button>
        </div>

        <!-- Push Notifications & Reminders Card -->
        <div class="card flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="stat-icon-wrapper stat-icon-info">${getIcon('bell', 24)}</div>
            <div>
              <h4 class="fw-bold">Push Notifications & Reminders</h4>
              <p class="text-xs text-muted">Receive EMI, Bill & Chit payment alerts on your device.</p>
            </div>
          </div>
          <div class="text-xs flex items-center justify-between p-3 rounded-md border" style="background: var(--surface-alt); border-radius: var(--radius-md);">
            <span>Permission:</span>
            <span class="badge ${notifStatus === 'granted' ? 'badge-green' : 'badge-amber'}">
              ${notifStatus === 'granted' ? 'Notifications Active' : 'Not Enabled'}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <button class="btn btn-primary btn-sm flex-1" id="trigger-enable-notif-btn">
              ${getIcon('bell', 14)} Enable Alerts
            </button>
            <button class="btn btn-secondary btn-sm" id="trigger-add-reminder-btn">
              ${getIcon('plus', 14)} Custom EMI Alert
            </button>
          </div>
        </div>
      </div>

      <div class="grid-2 mb-6">
        <!-- Manual & Automatic Backup Card -->
        <div class="card flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="stat-icon-wrapper stat-icon-primary">${getIcon('backup', 24)}</div>
            <div>
              <h4 class="fw-bold">JSON File Backup</h4>
              <p class="text-xs text-muted">Create timestamped offline backup files (Money_Backup_*.json)</p>
            </div>
          </div>

          <div class="text-xs flex flex-col gap-1 background-alt p-3 rounded-md border" style="background: var(--surface-alt); padding: 12px; border-radius: var(--radius-md);">
            <div><strong>Last Local Backup:</strong> <span id="last-backup-txt">${formattedLastBackup}</span></div>
            <div><strong>Automatic Backup (24h):</strong> <span class="badge ${autoBackupEnabled ? 'badge-green' : 'badge-amber'}">${autoBackupEnabled ? 'Enabled' : 'Disabled'}</span></div>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn btn-primary btn-sm flex-1" id="trigger-manual-backup-btn">
              ${getIcon('download', 14)} Backup Now
            </button>
            <button class="btn btn-secondary btn-sm" id="toggle-auto-backup-btn">
              ${autoBackupEnabled ? 'Disable Auto-Backup' : 'Enable Auto-Backup'}
            </button>
          </div>
        </div>

        <!-- Restore Data Card -->
        <div class="card flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="stat-icon-wrapper stat-icon-success">${getIcon('upload', 24)}</div>
            <div>
              <h4 class="fw-bold">Restore Backup File</h4>
              <p class="text-xs text-muted">Rebuild local database from a valid Money JSON backup file.</p>
            </div>
          </div>

          <p class="text-xs text-muted">Select a JSON backup file to preview record counts before confirming database restoration.</p>

          <input type="file" id="restore-file-input" accept=".json" style="display: none;">
          <button class="btn btn-secondary btn-sm" id="trigger-restore-file-btn">
            ${getIcon('upload', 14)} Select Backup File
          </button>
        </div>
      </div>

      <!-- Firebase Cloud Sync Card -->
      <div class="card mb-6 flex flex-col gap-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="stat-icon-wrapper stat-icon-info">${getIcon('shield', 24)}</div>
            <div>
              <h4 class="fw-bold">Firebase Cloud Storage & Recovery</h4>
              <p class="text-xs text-muted">Per-user isolated cloud synchronization</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="trigger-sync-now-btn">
            ${getIcon('history', 14)} Sync Cloud Data Now
          </button>
        </div>
      </div>

      <!-- Danger Zone: Reset Account Data -->
      <div class="card p-5" style="border: 1px solid rgba(255, 59, 48, 0.3); background: rgba(255, 59, 48, 0.03);">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 class="fw-bold text-danger flex items-center gap-2" style="color: var(--ios-red);">
              ${getIcon('alert', 18)} Reset Account Data
            </h4>
            <p class="text-xs text-muted mt-1">Permanently delete all financial transactions, chits, budgets, and bills from your Firebase cloud account and local database. Your Firebase login account and offline backup files will be preserved.</p>
          </div>
          <button class="btn btn-danger btn-sm" id="trigger-reset-account-btn" style="white-space: nowrap;">
            Reset Account Data
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners(target, user);
  },

  attachEventListeners(container, user) {
    // PWA Install
    container.querySelector('#trigger-pwa-install-btn')?.addEventListener('click', () => {
      PWAInstall.promptInstall();
    });

    // Enable Notifications
    container.querySelector('#trigger-enable-notif-btn')?.addEventListener('click', async () => {
      await NotificationService.requestPermission();
      this.render(container);
    });

    // Add Custom EMI / Bill Reminder Modal
    container.querySelector('#trigger-add-reminder-btn')?.addEventListener('click', () => {
      Modal.open({
        title: 'Schedule EMI / Bill Reminder Alert',
        bodyHTML: `
          <form id="reminder-form">
            <div class="form-group">
              <label class="form-label">Reminder Title</label>
              <input type="text" class="form-input" name="title" placeholder="e.g. Home Loan EMI / Car Loan EMI" required autofocus>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="EMI">EMI Payment</option>
                <option value="Bill">Utility Bill</option>
                <option value="Subscription">Subscription Renewal</option>
                <option value="Chit">ChitWise Auction</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" class="form-input" name="amount" placeholder="15000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" class="form-input" name="dueDate" required>
            </div>
            <div class="form-group">
              <label class="form-label">Remind Me</label>
              <select class="form-select" name="leadDays">
                <option value="1">1 Day Before</option>
                <option value="3">3 Days Before</option>
                <option value="7">7 Days Before</option>
                <option value="0">On Due Date</option>
              </select>
            </div>
          </form>
        `,
        footerHTML: `
          <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
          <button class="btn btn-primary" id="save-reminder-submit">Schedule Alert</button>
        `,
        onRender: (modalEl) => {
          modalEl.querySelector('#save-reminder-submit')?.addEventListener('click', async () => {
            const form = modalEl.querySelector('#reminder-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const data = Object.fromEntries(new FormData(form).entries());
            await NotificationService.saveCustomReminder(data);
            Modal.close();
          });
        }
      });
    });

    // Logout
    container.querySelector('#auth-logout-btn')?.addEventListener('click', async () => {
      await FirebaseAuth.logoutUser();
      Toast.show('Signed out successfully.', 'info');
      window.location.reload();
    });

    // Manual Backup
    container.querySelector('#trigger-manual-backup-btn')?.addEventListener('click', async () => {
      try {
        const done = await ReportService.exportFullJSONBackup();
        if (done) {
          Toast.show('Backup JSON saved successfully!', 'success');
          const lastStr = localStorage.getItem('money_last_backup_timestamp');
          if (lastStr) {
            container.querySelector('#last-backup-txt').textContent = new Date(lastStr).toLocaleString();
          }
        }
      } catch (err) {
        Toast.show('Failed to generate backup file.', 'danger');
      }
    });

    // Toggle Auto Backup
    container.querySelector('#toggle-auto-backup-btn')?.addEventListener('click', () => {
      const current = localStorage.getItem('money_auto_backup_enabled') === 'true';
      const nextState = !current;
      localStorage.setItem('money_auto_backup_enabled', String(nextState));
      Toast.show(`Automatic 24h Backup ${nextState ? 'enabled' : 'disabled'}.`, nextState ? 'success' : 'info');
      this.render(container);
    });

    // Trigger Cloud Sync
    container.querySelector('#trigger-sync-now-btn')?.addEventListener('click', async () => {
      try {
        await CloudSync.syncPending();
        Toast.show('Cloud synchronization complete!', 'success');
      } catch (err) {
        Toast.show('Cloud sync failed. Operating offline.', 'danger');
      }
    });

    // Restore File Selection
    const restoreBtn = container.querySelector('#trigger-restore-file-btn');
    const fileInput = container.querySelector('#restore-file-input');

    if (restoreBtn && fileInput) {
      restoreBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const parsedObj = ReportService.parseBackupJSON(evt.target.result);
            const summary = parsedObj.summary || {};

            Modal.open({
              title: 'Confirm Restore Backup Data',
              bodyHTML: `
                <div class="flex flex-col gap-3">
                  <div class="badge badge-amber p-2 text-wrap mb-2">
                    ⚠️ Warning: Restoring will overwrite your current local financial records with the backup file data.
                  </div>
                  <div class="text-sm">
                    <div><strong>Backup Export Date:</strong> ${new Date(parsedObj.exportedAt || Date.now()).toLocaleString()}</div>
                    <div class="mt-2"><strong>Payload Summary:</strong></div>
                    <ul class="text-xs text-muted pl-4 mt-1">
                      <li>Transactions: ${summary.transactionCount ?? parsedObj.data?.transactions?.length ?? 0}</li>
                      <li>Chit Funds: ${summary.chitCount ?? parsedObj.data?.chits?.length ?? 0}</li>
                      <li>Bills & Subscriptions: ${(summary.billCount ?? 0) + (summary.subscriptionCount ?? 0)}</li>
                      <li>Budgets: ${summary.budgetCount ?? parsedObj.data?.budgets?.length ?? 0}</li>
                    </ul>
                  </div>
                </div>
              `,
              footerHTML: `
                <button class="btn btn-secondary btn-sm" id="cancel-restore-btn">Cancel</button>
                <button class="btn btn-danger btn-sm" id="confirm-restore-btn">Confirm & Restore</button>
              `,
              onRender: (modalEl) => {
                modalEl.querySelector('#cancel-restore-btn')?.addEventListener('click', () => Modal.close());
                modalEl.querySelector('#confirm-restore-btn')?.addEventListener('click', async () => {
                  Modal.close();
                  try {
                    await ReportService.restoreFromJSON(parsedObj);
                    if (user && user.uid) await CloudSync.syncPending();
                    Toast.show('Data restored successfully from backup!', 'success');
                    setTimeout(() => window.location.reload(), 600);
                  } catch (err) {
                    Toast.show('Failed to restore database from backup.', 'danger');
                  }
                });
              }
            });
          } catch (err) {
            Toast.show(err.message, 'danger');
          }
        };
        reader.readAsText(file);
      });
    }

    // Danger Zone: Reset Account Data
    container.querySelector('#trigger-reset-account-btn')?.addEventListener('click', () => {
      Modal.open({
        title: 'Reset Account Data',
        bodyHTML: `
          <div class="flex flex-col gap-3">
            <div class="badge badge-red p-2 text-wrap mb-2">
              🚨 Permanent Action: This will permanently delete all cloud financial records under your user account and clear local storage.
            </div>
            <p class="text-sm text-secondary">
              Are you sure you want to reset all account financial data?
            </p>
            <ul class="text-xs text-muted pl-4">
              <li>Transactions, Chits, Bills, and Budgets will be deleted.</li>
              <li>Your Firebase login account (${user ? user.email : 'Current User'}) will remain active.</li>
              <li>Existing JSON backup files saved on your computer will NOT be deleted.</li>
              <li>Your account will return to a clean ₹0 state.</li>
            </ul>
          </div>
        `,
        footerHTML: `
          <button class="btn btn-secondary btn-sm" id="cancel-reset-btn">Cancel</button>
          <button class="btn btn-danger btn-sm" id="confirm-reset-btn">Yes, Reset Account Data</button>
        `,
        onRender: (modalEl) => {
          modalEl.querySelector('#cancel-reset-btn')?.addEventListener('click', () => Modal.close());
          modalEl.querySelector('#confirm-reset-btn')?.addEventListener('click', async () => {
            Modal.close();
            try {
              if (user && user.uid) {
                await CloudSync.resetAccountData(user.uid);
              }
              Toast.show('Account data permanently reset. System returned to ₹0 clean state.', 'info');
              setTimeout(() => window.location.reload(), 600);
            } catch (err) {
              Toast.show('Failed to reset account data: ' + err.message, 'danger');
            }
          });
        }
      });
    });
  }
};
