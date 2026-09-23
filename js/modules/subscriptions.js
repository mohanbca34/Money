/* =========================================================
   Money — js/modules/subscriptions.js
   Bills, EMI Loans, Duration & Countdown Tracker Module
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
            <h3 class="card-title">Bills, EMI Loans & Subscriptions</h3>
            <p class="text-sm text-muted">Track loan durations, due date countdowns (h:m) & automated ledger entry.</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-sm" id="add-bill-btn">${getIcon('plus', 14)} Add Bill / EMI</button>
            <button class="btn btn-secondary btn-sm" id="add-sub-btn">${getIcon('plus', 14)} Add Subscription</button>
          </div>
        </div>
      </div>

      <!-- Grid of Bills & Subscriptions -->
      <div class="grid-2">
        <!-- Recurring Bills & EMI Loans -->
        <div class="card">
          <div class="card-header mb-4">
            <h3 class="card-title">EMIs, Loans & Utility Bills</h3>
          </div>
          <div class="flex flex-col gap-3">
            ${bills.length ? bills.map(b => {
              const countdown = BillService.getCountdown(b.dueDate);
              const duration = BillService.calculateDurationSummary(b.startDate, b.endDate);
              return `
                <div class="flex items-center justify-between p-3 border-radius-md" style="background-color: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                  <div>
                    <div class="fw-bold text-sm">${b.name} <span class="text-xs text-muted">(${b.provider})</span></div>
                    ${duration ? `<div class="text-xs text-muted mt-1">🗓️ ${duration.text}</div>` : ''}
                    <div class="text-xs text-muted mt-1">Due: ${formatDate(b.dueDate)}</div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="badge ${countdown.cls} text-xs">${countdown.label}</span>
                    <span class="fw-bold text-sm text-main">${formatINR(b.amount)}</span>
                    <div class="flex items-center gap-1 mt-1">
                      ${b.status !== 'paid' ? `
                        <button class="btn btn-success btn-xs mark-bill-paid-btn" data-id="${b.id}">Mark Paid</button>
                      ` : `<span class="badge badge-green text-xs">Paid</span>`}
                      <button class="btn-icon text-muted delete-bill-btn" data-id="${b.id}">${getIcon('trash', 16)}</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-state py-6">
                <div class="empty-state-icon">${getIcon('bills', 36)}</div>
                <p class="text-sm text-muted">No active EMI loans or bills. Click '+ Add Bill / EMI' to start tracking.</p>
              </div>
            `}
          </div>
        </div>

        <!-- OTT & Digital Subscriptions -->
        <div class="card">
          <div class="card-header mb-4">
            <h3 class="card-title">OTT & Digital Subscriptions</h3>
          </div>
          <div class="flex flex-col gap-3">
            ${subs.length ? subs.map(s => {
              const countdown = BillService.getCountdown(s.nextBillingDate);
              return `
                <div class="flex items-center justify-between p-3 border-radius-md" style="background-color: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md);">
                  <div>
                    <div class="fw-bold text-sm">${s.name} <span class="text-xs text-muted">(${s.billingCycle})</span></div>
                    <div class="text-xs text-muted mt-1">Next Billing: ${formatDate(s.nextBillingDate)}</div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="badge ${countdown.cls} text-xs">${countdown.label}</span>
                    <span class="fw-bold text-sm text-main">${formatINR(s.amount)}</span>
                    <div class="flex items-center gap-1 mt-1">
                      <button class="btn btn-success btn-xs mark-sub-paid-btn" data-id="${s.id}">Renew</button>
                      <button class="btn-icon text-muted delete-sub-btn" data-id="${s.id}">${getIcon('trash', 16)}</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-state py-6">
                <div class="empty-state-icon">${getIcon('bills', 36)}</div>
                <p class="text-sm text-muted">No OTT or digital subscriptions added yet.</p>
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
        Toast.show('Bill / EMI marked as paid! Ledger updated automatically.', 'success');
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
        Toast.show('Item removed', 'info');
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
      title: 'Add EMI Loan / Utility Bill',
      bodyHTML: `
        <form id="bill-form">
          <div class="form-group">
            <label class="form-label">Name / Title</label>
            <input type="text" class="form-input" name="name" placeholder="e.g. Home Loan EMI / Car Loan / EB Bill" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Provider / Bank</label>
            <input type="text" class="form-input" name="provider" placeholder="e.g. HDFC Bank / SBI / TNEB" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category Type</label>
            <select class="form-select" name="type">
              <option value="emi">EMI Payment</option>
              <option value="loan">Personal / Home Loan</option>
              <option value="utility">Utility (Electricity/Water)</option>
              <option value="broadband">Broadband / Wifi</option>
              <option value="mobile">Mobile Recharge</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" class="form-input" name="amount" placeholder="15000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Next Due Date</label>
            <input type="date" class="form-input" name="dueDate" value="${todayISO()}" required>
          </div>
          <div class="grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">Loan Start Date (Optional)</label>
              <input type="date" class="form-input" name="startDate">
            </div>
            <div class="form-group">
              <label class="form-label">Loan End Date (Optional)</label>
              <input type="date" class="form-input" name="endDate">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reminder Threshold</label>
            <select class="form-select" name="leadDays">
              <option value="1">1 Day Before</option>
              <option value="3" selected>3 Days Before</option>
              <option value="5">5 Days Before</option>
              <option value="7">7 Days Before</option>
              <option value="0">On Due Date</option>
            </select>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-bill-submit">Save Bill / EMI</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-bill-submit')?.addEventListener('click', async () => {
          const form = modalEl.querySelector('#bill-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const data = Object.fromEntries(new FormData(form).entries());
          await BillService.addBill(data);
          Modal.close();
          Toast.show('Bill / EMI saved successfully!', 'success');

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
          <div class="form-group">
            <label class="form-label">Reminder Threshold</label>
            <select class="form-select" name="leadDays">
              <option value="1">1 Day Before</option>
              <option value="3" selected>3 Days Before</option>
              <option value="5">5 Days Before</option>
              <option value="7">7 Days Before</option>
              <option value="0">On Due Date</option>
            </select>
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
