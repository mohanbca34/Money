/* =========================================================
   Money — js/modules/dashboard.js
   Financial Overview Dashboard Module (No Charts, Minimal Native App UX)
   ========================================================= */

import { TransactionService } from '../services/transaction-service.js';
import { ChitService } from '../services/chit-service.js';
import { BillService } from '../services/bill-service.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate } from '../core/utils.js';

export const DashboardModule = {
  async render(container) {
    const target = container || document.getElementById('view-container');
    if (!target) return;

    const metrics = await TransactionService.getSummaryMetrics();
    const recentTxns = (await TransactionService.getAllTransactions()).slice(0, 6);
    const chits = await ChitService.getAllChits();
    const bills = await BillService.getAllBills();

    const activeChits = chits.filter(c => !c.taken);
    const pendingBills = bills.filter(b => b.status !== 'paid');

    target.innerHTML = `
      <!-- Summary Metric Cards Header -->
      <div class="grid-4 mb-6">
        <div class="stat-card">
          <div class="stat-icon-wrapper stat-icon-primary">${getIcon('wallet', 22)}</div>
          <div class="stat-details">
            <span class="stat-label">Total Balance</span>
            <span class="stat-value text-primary">${formatINR(metrics.totalBalance)}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper stat-icon-success">${getIcon('income', 22)}</div>
          <div class="stat-details">
            <span class="stat-label">Income</span>
            <span class="stat-value text-success">${formatINR(metrics.totalIncome)}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper stat-icon-danger">${getIcon('expense', 22)}</div>
          <div class="stat-details">
            <span class="stat-label">Expenses</span>
            <span class="stat-value text-danger">${formatINR(metrics.totalExpenses)}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper stat-icon-info">${getIcon('shield', 22)}</div>
          <div class="stat-details">
            <span class="stat-label">Savings Rate</span>
            <span class="stat-value text-main">${metrics.savingsRate}%</span>
          </div>
        </div>
      </div>

      <!-- Dashboard Grid: Upcoming EMIs & Due Payments + Recent Transactions -->
      <div class="dashboard-grid">
        <!-- Upcoming EMI, Loan & Utility Bill Countdowns -->
        <div class="card flex flex-col gap-4">
          <div class="card-header flex items-center justify-between">
            <h3 class="card-title flex items-center gap-2">
              ${getIcon('bell', 18)} Upcoming EMIs & Due Payments
            </h3>
            <a href="#subscriptions" class="text-xs font-medium text-primary flex items-center gap-1">Manage All ${getIcon('income', 12)}</a>
          </div>

          <div class="flex flex-col gap-3">
            ${pendingBills.length ? pendingBills.map(b => {
              const countdown = BillService.getCountdown(b.dueDate);
              const duration = BillService.calculateDurationSummary(b.startDate, b.endDate);
              return `
                <div class="flex items-center justify-between p-3 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                  <div>
                    <div class="fw-bold text-sm">${b.name} <span class="text-xs text-muted">(${b.provider})</span></div>
                    ${duration ? `<div class="text-xs text-muted mt-1">🗓️ ${duration.text}</div>` : ''}
                    <div class="text-xs text-muted mt-1">Due: ${formatDate(b.dueDate)}</div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="badge ${countdown.cls} text-xs">${countdown.label}</span>
                    <span class="fw-bold text-sm text-main">${formatINR(b.amount)}</span>
                    <button class="btn btn-success btn-xs mt-1 mark-dash-bill-paid" data-id="${b.id}">Mark Paid</button>
                  </div>
                </div>
              `;
            }).join('') : ''}

            ${activeChits.map(c => `
              <div class="flex items-center justify-between p-3 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                <div>
                  <div class="fw-bold text-sm">${c.name} — Month ${c.currentMonth}</div>
                  <div class="text-xs text-muted">Chit Fund Monthly Installment</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span class="badge badge-amber text-xs">Active Chit</span>
                  <span class="fw-bold text-sm text-main">${formatINR(c.monthly)}</span>
                  <a href="#chits" class="btn btn-secondary btn-xs mt-1">View Chit</a>
                </div>
              </div>
            `).join('')}

            ${(!pendingBills.length && !activeChits.length) ? `
              <div class="empty-state py-6">
                <div class="empty-state-icon">${getIcon('check', 36)}</div>
                <p class="text-sm text-muted">All EMI loans and bills are paid up to date!</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Recent Transactions Ledger -->
        <div class="card flex flex-col gap-4">
          <div class="card-header flex items-center justify-between">
            <h3 class="card-title flex items-center gap-2">
              ${getIcon('transactions', 18)} Recent Transactions
            </h3>
            <a href="#transactions" class="text-xs font-medium text-primary flex items-center gap-1">View Ledger ${getIcon('income', 12)}</a>
          </div>

          <div class="table-responsive">
            ${recentTxns.length ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentTxns.map(t => `
                    <tr>
                      <td>
                        <div class="fw-medium text-sm">${t.description || 'Transaction'}</div>
                        <div class="text-xs text-muted">${t.paymentMethod}</div>
                      </td>
                      <td><span class="badge badge-blue text-xs">${t.category}</span></td>
                      <td class="text-xs text-muted">${formatDate(t.date)}</td>
                      <td class="fw-bold text-sm ${t.type === 'income' ? 'text-success' : 'text-danger'}" style="text-align: right;">
                        ${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state py-6">
                <div class="empty-state-icon">${getIcon('transactions', 36)}</div>
                <p class="text-sm text-muted">No transactions recorded yet.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachEvents(target);
  },

  attachEvents(container) {
    container.querySelectorAll('.mark-dash-bill-paid').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await BillService.markBillPaid(id);
        Toast.show('Bill / EMI marked as paid! Ledger updated.', 'success');
        this.render(container);
      });
    });
  }
};
