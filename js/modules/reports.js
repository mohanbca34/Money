/* =========================================================
   MoneyFlow — reports.js
   Reports & CSV/JSON Export Service Module (Vector Icons)
   ========================================================= */

import { ReportService } from '../services/report-service.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';

export const ReportsModule = {
  async render(container) {
    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="card-title">Financial Reports & Data Exports</h3>
        <p class="text-sm text-muted">Generate comprehensive transaction ledgers and chit summary reports.</p>
      </div>

      <div class="grid-3">
        <div class="card flex flex-col gap-3">
          <div class="stat-icon-wrapper stat-icon-primary">${getIcon('download', 24)}</div>
          <h4 class="fw-bold">Export Transactions CSV</h4>
          <p class="text-sm text-muted">Download all ledger entries formatted for Microsoft Excel & Google Sheets.</p>
          <button class="btn btn-primary btn-sm mt-2" id="export-csv-btn">${getIcon('download', 14)} Download CSV</button>
        </div>

        <div class="card flex flex-col gap-3">
          <div class="stat-icon-wrapper stat-icon-success">${getIcon('backup', 24)}</div>
          <h4 class="fw-bold">Export Database Backup</h4>
          <p class="text-sm text-muted">Backup full offline database including transactions, chits, and budgets to JSON.</p>
          <button class="btn btn-success btn-sm mt-2" id="export-json-btn">${getIcon('download', 14)} Backup JSON</button>
        </div>

        <div class="card flex flex-col gap-3">
          <div class="stat-icon-wrapper stat-icon-info">${getIcon('printer', 24)}</div>
          <h4 class="fw-bold">Print Financial Summary</h4>
          <p class="text-sm text-muted">Format & print monthly financial summary for tax filing or physical records.</p>
          <button class="btn btn-secondary btn-sm mt-2" id="print-summary-btn">${getIcon('printer', 14)} Print Report</button>
        </div>
      </div>
    `;

    const csvBtn = container.querySelector('#export-csv-btn');
    if (csvBtn) {
      csvBtn.addEventListener('click', async () => {
        await ReportService.exportTransactionsCSV();
        Toast.show('Transactions CSV downloaded!', 'success');
      });
    }

    const jsonBtn = container.querySelector('#export-json-btn');
    if (jsonBtn) {
      jsonBtn.addEventListener('click', async () => {
        await ReportService.exportFullBackupJSON();
        Toast.show('Full database backup exported to JSON!', 'success');
      });
    }

    const printBtn = container.querySelector('#print-summary-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }
};
