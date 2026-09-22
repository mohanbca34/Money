/* =========================================================
   Money — js/modules/backup.js
   Settings, Backup & Restore, Auto-Backup & Account Reset Module
   ========================================================= */

import { CloudSync } from '../firebase/sync.js';
import { ReportService } from '../services/report-service.js';
import { FirebaseAuth } from '../firebase/auth.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';

export const BackupModule = {
  async render(container) {
    const user = FirebaseAuth.getUser();
    const autoBackupEnabled = localStorage.getItem('money_auto_backup_enabled') === 'true';
    const lastBackupTime = localStorage.getItem('money_last_backup_timestamp');
    const formattedLastBackup = lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'Never';

    container.innerHTML = `
      <div class="card mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="card-title">Settings & Data Resilience</h3>
            <p class="text-sm text-muted">Manage cloud synchronization, local backups, automatic backups, and account state.</p>
          </div>
          ${user ? `
            <div class="flex items-center gap-2">
              <span class="badge badge-green">${user.email}</span>
              <button class="btn btn-secondary btn-sm" id="auth-logout-btn">${getIcon('trash', 14)} Sign Out</button>
            </div>
          ` : ''}
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
        <div class="flex items-center justify-between">
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
        <div class="flex items-center justify-between gap-4">
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

    this.attachEventListeners(container, user);
  },

  attachEventListeners(container, user) {
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
