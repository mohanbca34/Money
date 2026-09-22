/* =========================================================
   MoneyFlow — backup.js
   Backup, Recovery & Sync Management Module (Vector Icons)
   ========================================================= */

import { CloudSync } from '../firebase/sync.js';
import { ReportService } from '../services/report-service.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';

export const BackupModule = {
  async render(container) {
    const queue = await CloudSync.getPendingQueueCount();

    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="card-title">Cloud Sync & Data Resilience</h3>
        <p class="text-sm text-muted">Manage your three-tier storage layer (localStorage, IndexedDB, Firebase Firestore).</p>
      </div>

      <div class="grid-2">
        <div class="card flex flex-col gap-3">
          <div class="stat-icon-wrapper stat-icon-primary">${getIcon('backup', 24)}</div>
          <h4 class="fw-bold">Firebase Cloud Sync</h4>
          <p class="text-sm text-muted">Sync pending offline mutations to your encrypted Firebase Firestore cloud account.</p>
          <div class="text-sm fw-medium">Pending Queue Items: <span class="badge badge-blue" id="queue-count">${queue}</span></div>
          <button class="btn btn-primary btn-sm mt-2" id="trigger-sync-btn">${getIcon('backup', 14)} Sync Now</button>
        </div>

        <div class="card flex flex-col gap-3">
          <div class="stat-icon-wrapper stat-icon-success">${getIcon('download', 24)}</div>
          <h4 class="fw-bold">Restore Data from JSON</h4>
          <p class="text-sm text-muted">Upload a MoneyFlow backup JSON file to restore transactions, chits, and budgets.</p>
          <input type="file" id="restore-file-input" accept=".json" style="display: none;">
          <button class="btn btn-secondary btn-sm mt-2" id="trigger-restore-btn">${getIcon('upload', 14)} Choose Backup File</button>
        </div>
      </div>
    `;

    const syncBtn = container.querySelector('#trigger-sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        await CloudSync.syncPendingQueue();
        const updated = await CloudSync.getPendingQueueCount();
        container.querySelector('#queue-count').textContent = updated;
        Toast.show('Cloud sync executed successfully!', 'success');
      });
    }

    const restoreBtn = container.querySelector('#trigger-restore-btn');
    const fileInput = container.querySelector('#restore-file-input');

    if (restoreBtn && fileInput) {
      restoreBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            await ReportService.restoreFromJSON(event.target.result);
            Toast.show('Data successfully restored from backup!', 'success');
            window.location.reload();
          } catch (err) {
            Toast.show('Failed to restore data. Invalid JSON file format.', 'danger');
          }
        };
        reader.readAsText(file);
      });
    }
  }
};
