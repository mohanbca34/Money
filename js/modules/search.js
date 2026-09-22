/* =========================================================
   MoneyFlow — search.js
   Global Search & Filter Module (Vector Icons)
   ========================================================= */

import { TransactionService } from '../services/transaction-service.js';
import { ChitService } from '../services/chit-service.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate } from '../core/utils.js';

export const SearchModule = {
  async render(container, query = '') {
    const allTxns = await TransactionService.getAllTransactions();
    const allChits = await ChitService.getAllChits();

    const q = query.toLowerCase().trim();

    const matchingTxns = q ? allTxns.filter(t =>
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.paymentMethod || '').toLowerCase().includes(q)
    ) : [];

    const matchingChits = q ? allChits.filter(c =>
      (c.name || '').toLowerCase().includes(q)
    ) : [];

    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="card-title">Global Search Results</h3>
        <p class="text-sm text-muted">Showing matches for query: <strong class="text-primary">"${query}"</strong></p>
      </div>

      <div class="card">
        <h4 class="fw-bold mb-3">Matching Transactions (${matchingTxns.length})</h4>
        <div class="table-responsive mb-6">
          ${matchingTxns.length ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${matchingTxns.map(t => `
                  <tr>
                    <td class="text-sm">${formatDate(t.date)}</td>
                    <td class="fw-medium">${t.description}</td>
                    <td><span class="badge badge-blue">${t.category}</span></td>
                    <td class="fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                      ${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state p-4">
              <div class="empty-state-icon">${getIcon('search', 32)}</div>
              <p>No matching transactions found.</p>
            </div>
          `}
        </div>

        <h4 class="fw-bold mb-3">Matching Chit Funds (${matchingChits.length})</h4>
        <div class="grid-2">
          ${matchingChits.map(c => `
            <div class="p-4 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border);">
              <div class="fw-bold text-lg">${c.name}</div>
              <div class="text-sm text-muted">Total Value: ${formatINR(c.value)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
