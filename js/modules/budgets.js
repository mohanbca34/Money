/* =========================================================
   MoneyFlow — budgets.js
   Budgets & Category Spending Limits Module (Vector Icons)
   ========================================================= */

import { BudgetService } from '../services/budget-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';
import { formatINR } from '../core/utils.js';

export const BudgetsModule = {
  async render(container) {
    const list = await BudgetService.getBudgetsWithProgress();

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="card mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="card-title">Monthly Category Budgets</h3>
            <p class="text-sm text-muted">Set spending targets and receive real-time warnings before overspending.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="set-budget-btn">${getIcon('plus', 14)} Set Budget Target</button>
        </div>
      </div>

      <!-- Budget Progress Cards Grid -->
      <div class="grid-3">
        ${list.map(b => {
          let fillClass = 'progress-green';
          if (b.status === 'warning') fillClass = 'progress-amber';
          if (b.status === 'exceeded') fillClass = 'progress-red';

          return `
            <div class="card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="fw-bold">${b.category}</h3>
                <span class="badge ${b.percent >= 100 ? 'badge-red' : (b.percent >= 80 ? 'badge-amber' : 'badge-green')}">
                  ${b.percent.toFixed(0)}% Used
                </span>
              </div>

              <div class="flex items-center justify-between text-sm mb-3">
                <span class="text-muted">Spent: <strong class="text-main">${formatINR(b.spent)}</strong></span>
                <span class="text-muted">Target: <strong class="text-main">${formatINR(b.limit)}</strong></span>
              </div>

              <div class="progress-bar-bg mb-3">
                <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(b.percent, 100)}%;"></div>
              </div>

              <div class="flex items-center justify-between text-xs text-muted" style="border-top: 1px solid var(--border); padding-top: 10px;">
                <span>${b.remaining >= 0 ? `${formatINR(b.remaining)} remaining` : `${formatINR(Math.abs(b.remaining))} over budget`}</span>
                <button class="btn-icon text-muted delete-budget-btn" data-id="${b.id}">${getIcon('trash', 14)}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const setBtn = container.querySelector('#set-budget-btn');
    if (setBtn) setBtn.addEventListener('click', () => this.showSetModal(container));

    container.querySelectorAll('.delete-budget-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        await BudgetService.deleteBudget(id);
        Toast.show('Budget target removed', 'info');
        this.render(container);
      });
    });
  },

  showSetModal(container) {
    Modal.open({
      title: 'Set Monthly Category Budget Target',
      bodyHTML: `
        <form id="budget-form">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" name="category">
              <option value="Food">Food & Dining</option>
              <option value="Bills">Bills & Utilities</option>
              <option value="Fuel">Fuel & Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Medical">Medical</option>
              <option value="Entertainment">Entertainment</option>
              <option value="General">General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Spending Limit (₹)</label>
            <input type="number" class="form-input" name="limit" placeholder="10000" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-budget-submit">Save Budget</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-budget-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#budget-form');
          const data = Object.fromEntries(new FormData(form).entries());

          await BudgetService.setBudget(data.category, data.limit);
          Modal.close();
          Toast.show('Budget target set successfully!', 'success');
          this.render(container);
        });
      }
    });
  }
};
