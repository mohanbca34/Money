/* =========================================================
   MoneyFlow — dashboard.js
   Financial Overview Dashboard Module (Lucide / SF Symbols Vector Icons)
   ========================================================= */

import { TransactionService } from '../services/transaction-service.js';
import { ChitService } from '../services/chit-service.js';
import { BillService } from '../services/bill-service.js';
import { ChartController } from '../components/charts.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate } from '../core/utils.js';

export const DashboardModule = {
  async render(container) {
    const metrics = await TransactionService.getSummaryMetrics();
    const recentTxns = (await TransactionService.getAllTransactions()).slice(0, 5);
    const categoryData = await TransactionService.getCategoryBreakdown();
    const chits = await ChitService.getAllChits();
    const bills = await BillService.getAllBills();

    const activeChits = chits.filter(c => !c.taken);
    const upcomingBills = bills.filter(b => BillService.daysLeft(b.dueDate) <= 10 && b.status !== 'paid');

    container.innerHTML = `
      <!-- Metric Cards Header -->
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

      <!-- Dashboard Main Grid -->
      <div class="dashboard-grid">
        <!-- Left Side: Interactive Cashflow Chart & Recent Transactions -->
        <div class="flex flex-col gap-6">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Monthly Cash Flow</h3>
            </div>
            <div class="chart-container" style="position: relative; height: 260px;">
              <canvas id="dash-cashflow-canvas"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Transactions</h3>
              <a href="#transactions" class="text-sm font-medium text-primary flex items-center gap-1">View All ${getIcon('income', 14)}</a>
            </div>
            <div class="table-responsive">
              ${recentTxns.length ? `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentTxns.map(t => `
                      <tr>
                        <td>
                          <div class="fw-medium">${t.description || 'Transaction'}</div>
                          <div class="text-xs text-muted">${t.paymentMethod} • ${t.sourceType}</div>
                        </td>
                        <td><span class="badge badge-blue">${t.category}</span></td>
                        <td class="text-sm">${formatDate(t.date)}</td>
                        <td class="fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                          ${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="empty-state">
                  <div class="empty-state-icon">${getIcon('transactions', 36)}</div>
                  <p>No transactions yet. Click '+ Add' to record one!</p>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Right Side: Category Donut & Upcoming Items -->
        <div class="flex flex-col gap-6">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Expense Breakdown</h3>
            </div>
            <div class="chart-container" style="position: relative; height: 220px;">
              <canvas id="dash-donut-canvas"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Upcoming Due Payments</h3>
            </div>
            <div class="flex flex-col gap-3">
              ${upcomingBills.map(b => {
                const days = BillService.daysLeft(b.dueDate);
                const badge = BillService.urgencyBadge(days);
                return `
                  <div class="flex items-center justify-between p-2 surface-hover border-radius-sm" style="border-bottom: 1px solid var(--border);">
                    <div>
                      <div class="fw-medium text-sm">${b.name} (${b.provider})</div>
                      <div class="text-xs text-muted">Due ${formatDate(b.dueDate)}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="badge ${badge.cls}">${badge.label}</span>
                      <span class="fw-bold text-sm">${formatINR(b.amount)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
              ${activeChits.slice(0, 2).map(c => `
                <div class="flex items-center justify-between p-2 surface-hover border-radius-sm" style="border-bottom: 1px solid var(--border);">
                  <div>
                    <div class="fw-medium text-sm">${c.name} — Month ${c.currentMonth}</div>
                    <div class="text-xs text-muted">Chit Installment</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="badge badge-amber">Installment</span>
                    <span class="fw-bold text-sm">${formatINR(c.monthly)}</span>
                  </div>
                </div>
              `).join('')}
              ${(!upcomingBills.length && !activeChits.length) ? `
                <div class="text-sm text-muted text-center py-4">No urgent upcoming payments due!</div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartController.renderCashFlowChart(
        'dash-cashflow-canvas',
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        [metrics.totalIncome * 0.8, metrics.totalIncome * 0.9, metrics.totalIncome, metrics.totalIncome * 1.1, metrics.totalIncome],
        [metrics.totalExpenses * 0.7, metrics.totalExpenses * 0.85, metrics.totalExpenses, metrics.totalExpenses * 0.9, metrics.totalExpenses]
      );
      ChartController.renderCategoryDonutChart('dash-donut-canvas', categoryData);
    }, 50);
  }
};
