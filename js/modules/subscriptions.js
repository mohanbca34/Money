/* =========================================================
   Money — js/modules/subscriptions.js
   Bills, Recharges & Subscriptions Module (Vector Icons)
   ========================================================= */

import { BillService } from '../services/bill-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate, todayISO } from '../core/utils.js';

export const SubscriptionsModule = {
  async render(container) {
    const target = container || document.getElementById('view-container');
    if (!target) return;

    const bills = await BillService.getAllBills();
    const subs = await BillService.getAllSubscriptions();

    target.innerHTML = `
      <!-- Toolbar -->
      <div class="card mb-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="card-title">Bills, Recharges & Subscriptions</h3>
            <p class="text-sm text-muted">Never miss a renewal date. Click 'Mark Paid' to auto-record in ledger.</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-sm" id="add-bill-btn">${getIcon('plus', 14)} Add Bill</button>
            <button class="btn btn-secondary btn-sm" id="add-sub-btn">${getIcon('plus', 14)} Add Subscription</button>
          </div>
        </div>
      </div>

      <!-- Grid of Bills & Subscriptions -->
      <div class="grid-2">
        <!-- Recurring Bills -->
        <div class="card">
          <div class="card-header mb-4">
            <h3 class="card-title">Utility & Mobile Bills</h3>
          </div>
          <div class="flex flex-col gap-3">
            ${bills.length ? bills.map(b => {
              const days = BillService.daysLeft(b.dueDate);
              const badge = BillService.urgencyBadge(days);
              return `
                <div class="flex items-center justify-between p-3 border-radius-md" style="background-color: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                  <div>
                    <div class="fw-bold">${b.name} <span class="text-xs text-muted">(${b.provider})</span></div>
                    <div class="text-xs text-muted">Due: ${formatDate(b.dueDate)}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="badge ${badge.cls}">${badge.label}</span>
                    <span class="fw-bold">${formatINR(b.amount)}</span>
                    ${b.status !== 'paid' ? `
                      <button class="btn btn-success btn-sm mark-bill-paid-btn" data-id="${b.id}">Mark Paid</button>
                    ` : `<span class="badge badge-green">Paid</span>`}
                    <button class="btn-icon text-muted delete-bill-btn" data-id="${b.id}">${getIcon('trash', 16)}</button>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-state">
                <div class="empty-state-icon">${getIcon('bills', 36)}</div>
                <p>No active bills. Click '+ Add Bill' to track one.</p>
              </div>
            `}
          </div>
        </div>

        <!-- OTT & Subscriptions -->
        <div class="card">
          <div class="card-header mb-4">
            <h3 class="card-title">OTT & Digital Subscriptions</h3>
          </div>
          <div class="flex flex-col gap-3">
            ${subs.length ? subs.map(s => {
              const days = BillService.daysLeft(s.nextBillingDate);
              const badge = BillService.urgencyBadge(days);
              return `
                <div class="flex items-center justify-between p-3 border-radius-md" style="background-color: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                  <div>
                    <div class="fw-bold">${s.name} <span class="text-xs text-muted">(${s.billingCycle})</span></div>
                    <div class="text-xs text-muted">Next Date: ${formatDate(s.nextBillingDate)}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="badge ${badge.cls}">${badge.label}</span>
                    <span class="fw-bold">${formatINR(s.amount)}</span>
                    <button class="btn btn-success btn-sm mark-sub-paid-btn" data-id="${s.id}">Renew</button>
                    <button class="btn-icon text-muted delete-sub-btn" data-id="${s.id}">${getIcon('trash', 16)}</button>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-state">
                <div class="empty-state-icon">${getIcon('bills', 36)}</div>
                <p>No subscriptions added yet.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachEvents(target);
  },

  attachEvents(container) {
    const addBillBtn = container.querySelector('#add-bill-btn');
    if (addBillBtn) addBillBtn.addEventListener('click', () => this.showAddBillModal(container));

    const addSubBtn = container.querySelector('#add-sub-btn');
    if (addSubBtn) addSubBtn.addEventListener('click', () => this.showAddSubModal(container));

    container.querySelectorAll('.mark-bill-paid-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await BillService.markBillPaid(id);
        Toast.show('Bill marked as paid! Ledger updated automatically.', 'success');
        this.render(container);
      });
    });

    container.querySelectorAll('.mark-sub-paid-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await BillService.markSubPaid(id);
        Toast.show('Subscription renewed! Ledger updated automatically.', 'success');
        this.render(container);
      });
    });

    container.querySelectorAll('.delete-bill-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        await BillService.deleteBill(id);
        Toast.show('Bill removed', 'info');
        this.render(container);
      });
    });

    container.querySelectorAll('.delete-sub-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        await BillService.deleteSub(id);
        Toast.show('Subscription removed', 'info');
        this.render(container);
      });
    });
  },

  showAddBillModal(container) {
    const target = container || document.getElementById('view-container');

    Modal.open({
      title: 'Add Utility / Mobile Bill',
      bodyHTML: `
        <form id="bill-form">
          <div class="form-group">
            <label class="form-label">Bill Name</label>
            <input type="text" class="form-input" name="name" placeholder="e.g. Home Broadband / EB Bill" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Provider</label>
            <input type="text" class="form-input" name="provider" placeholder="e.g. BSNL / Airtel / TNEB" required>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" class="form-input" name="amount" placeholder="299" required>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input" name="dueDate" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-bill-submit">Save Bill</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-bill-submit')?.addEventListener('click', async () => {
          const form = modalEl.querySelector('#bill-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const data = Object.fromEntries(new FormData(form).entries());
          await BillService.addBill(data);
          Modal.close();
          Toast.show('Bill saved successfully!', 'success');

          const currentHash = window.location.hash.replace('#', '') || 'dashboard';
          if (currentHash === 'subscriptions') {
            this.render(target);
          } else if (currentHash === 'dashboard') {
            import('./dashboard.js').then(m => m.DashboardModule.render(target));
          }
        });
      }
    });
  },

  showAddSubModal(container) {
    const target = container || document.getElementById('view-container');

    Modal.open({
      title: 'Add OTT / Digital Subscription',
      bodyHTML: `
        <form id="sub-form">
          <div class="form-group">
            <label class="form-label">Service Name</label>
            <input type="text" class="form-input" name="name" placeholder="e.g. Netflix / Prime Video / Spotify" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" class="form-input" name="amount" placeholder="649" required>
          </div>
          <div class="form-group">
            <label class="form-label">Billing Cycle</label>
            <select class="form-select" name="billingCycle">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Next Billing Date</label>
            <input type="date" class="form-input" name="nextBillingDate" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-sub-submit">Save Subscription</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-sub-submit')?.addEventListener('click', async () => {
          const form = modalEl.querySelector('#sub-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const data = Object.fromEntries(new FormData(form).entries());
          await BillService.addSubscription(data);
          Modal.close();
          Toast.show('Subscription saved successfully!', 'success');

          const currentHash = window.location.hash.replace('#', '') || 'dashboard';
          if (currentHash === 'subscriptions') {
            this.render(target);
          } else if (currentHash === 'dashboard') {
            import('./dashboard.js').then(m => m.DashboardModule.render(target));
          }
        });
      }
    });
  }
};
