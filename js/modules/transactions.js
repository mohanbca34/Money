/* =========================================================
   MoneyFlow — transactions.js
   Transactions Ledger Module (Vector Icons)
   ========================================================= */

import { TransactionService } from '../services/transaction-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate, todayISO } from '../core/utils.js';

let currentFilterType = 'all';
let currentSearchQuery = '';

export const TransactionsModule = {
  async render(container) {
    const allTxns = await TransactionService.getAllTransactions();

    const filtered = allTxns.filter(t => {
      if (currentFilterType !== 'all' && t.type !== currentFilterType) return false;
      if (currentSearchQuery) {
        const q = currentSearchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        return desc.includes(q) || cat.includes(q) || notes.includes(q);
      }
      return true;
    });

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="card mb-6">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <button class="btn btn-sm ${currentFilterType === 'all' ? 'btn-primary' : 'btn-secondary'}" data-type="all">All</button>
            <button class="btn btn-sm ${currentFilterType === 'expense' ? 'btn-primary' : 'btn-secondary'}" data-type="expense">Expenses</button>
            <button class="btn btn-sm ${currentFilterType === 'income' ? 'btn-primary' : 'btn-secondary'}" data-type="income">Income</button>
            <button class="btn btn-sm ${currentFilterType === 'transfer' ? 'btn-primary' : 'btn-secondary'}" data-type="transfer">Transfers</button>
          </div>
          <div class="flex items-center gap-3">
            <input type="text" class="form-input text-sm" id="txn-search-input" placeholder="Filter ledger..." value="${currentSearchQuery}">
            <button class="btn btn-primary btn-sm" id="add-txn-btn">${getIcon('plus', 14)} Add Record</button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="card">
        <div class="table-responsive">
          ${filtered.length ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(t => `
                  <tr>
                    <td class="text-sm fw-medium">${formatDate(t.date)}</td>
                    <td>
                      <div class="fw-medium">${t.description || 'Transaction'}</div>
                      ${t.notes ? `<div class="text-xs text-muted">${t.notes}</div>` : ''}
                    </td>
                    <td><span class="badge badge-blue">${t.category}</span></td>
                    <td class="text-sm text-muted">${t.paymentMethod}</td>
                    <td class="fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                      ${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-icon text-muted edit-txn-btn" data-id="${t.id}" title="Edit">${getIcon('edit', 16)}</button>
                      <button class="btn-icon text-muted delete-txn-btn" data-id="${t.id}" title="Delete">${getIcon('trash', 16)}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">${getIcon('transactions', 36)}</div>
              <p>No transactions match your query.</p>
            </div>
          `}
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    container.querySelectorAll('[data-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentFilterType = e.target.getAttribute('data-type');
        this.render(container);
      });
    });

    const searchInput = container.querySelector('#txn-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        this.render(container);
      });
    }

    const addBtn = container.querySelector('#add-txn-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddModal(container));
    }

    container.querySelectorAll('.edit-txn-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        this.showEditModal(container, id);
      });
    });

    container.querySelectorAll('.delete-txn-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        const list = await TransactionService.getAllTransactions();
        const itemToDelete = list.find(t => t.id === id);

        if (itemToDelete) {
          await TransactionService.deleteTransaction(id);
          this.render(container);

          Toast.show(`Deleted "${itemToDelete.description || 'Transaction'}"`, 'warning', 5000, async () => {
            delete itemToDelete.deletedAt;
            delete itemToDelete.syncStatus;
            await TransactionService.addTransaction(itemToDelete);
            this.render(container);
            Toast.show('Transaction restored!', 'success');
          });
        }
      });
    });
  },

  showAddModal(container) {
    Modal.open({
      title: 'Add New Transaction',
      bodyHTML: `
        <form id="txn-form">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" name="type">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" class="form-input" name="amount" placeholder="0.00" step="any" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" name="category">
              <option value="Food">Food & Dining</option>
              <option value="Bills">Bills & Utilities</option>
              <option value="Fuel">Fuel & Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Medical">Medical</option>
              <option value="Salary">Salary</option>
              <option value="Freelancing">Freelancing</option>
              <option value="Chit Fund">Chit Fund</option>
              <option value="General">General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" name="date" value="${todayISO()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" name="description" placeholder="e.g. Grocery purchase" required>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select class="form-select" name="paymentMethod">
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Auto-debit">Auto-debit</option>
            </select>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-txn-submit">Save Transaction</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-txn-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#txn-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());

          await TransactionService.addTransaction(data);
          Modal.close();
          Toast.show('Transaction saved successfully!', 'success');
          this.render(container);
        });
      }
    });
  },

  async showEditModal(container, id) {
    const list = await TransactionService.getAllTransactions();
    const item = list.find(t => t.id === id);
    if (!item) return;

    Modal.open({
      title: 'Edit Transaction',
      bodyHTML: `
        <form id="txn-edit-form">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" name="type">
              <option value="expense" ${item.type === 'expense' ? 'selected' : ''}>Expense</option>
              <option value="income" ${item.type === 'income' ? 'selected' : ''}>Income</option>
              <option value="transfer" ${item.type === 'transfer' ? 'selected' : ''}>Transfer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" class="form-input" name="amount" value="${item.amount}" step="any" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" class="form-input" name="category" value="${item.category}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" name="date" value="${item.date}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" name="description" value="${item.description || ''}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="update-txn-submit">Update Record</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#update-txn-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#txn-edit-form');
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());

          await TransactionService.updateTransaction(id, data);
          Modal.close();
          Toast.show('Transaction updated!', 'success');
          this.render(container);
        });
      }
    });
  }
};
