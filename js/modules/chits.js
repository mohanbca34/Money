/* =========================================================
   MoneyFlow — chits.js
   ChitWise Module with Vector Icons
   ========================================================= */

import { ChitService } from '../services/chit-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { getIcon } from '../components/icons.js';
import { formatINR, formatDate, todayISO } from '../core/utils.js';

export const ChitsModule = {
  async render(container) {
    const chits = await ChitService.getAllChits();

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="card mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="card-title">ChitWise — Chit Fund Manager</h3>
            <p class="text-sm text-muted">Track monthly auctions, foreman commission, dividends, and profit/loss.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="create-chit-btn">${getIcon('plus', 14)} Create New Chit</button>
        </div>
      </div>

      <!-- Active Chits List -->
      <div class="grid-2">
        ${chits.length ? chits.map(c => {
          const comm = ChitService.monthlyComm(c);
          const estPL = ChitService.expectedFinalPL(c);
          return `
            <div class="chit-card ${c.taken ? 'completed' : ''}">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="fw-bold text-lg">${c.name}</h3>
                  <span class="text-xs text-muted">Start Date: ${formatDate(c.startDate)} • ${c.members} Members</span>
                </div>
                <span class="badge ${c.taken ? 'badge-green' : 'badge-blue'}">
                  ${c.taken ? `Taken Month ${c.takenMonth}` : `Month ${c.currentMonth}/${c.duration}`}
                </span>
              </div>

              <div class="grid-3 text-sm p-3 border-radius-md" style="background-color: var(--surface-alt);">
                <div>
                  <div class="text-xs text-muted">Total Value</div>
                  <div class="fw-bold">${formatINR(c.value)}</div>
                </div>
                <div>
                  <div class="text-xs text-muted">Monthly Installment</div>
                  <div class="fw-bold">${formatINR(c.monthly)}</div>
                </div>
                <div>
                  <div class="text-xs text-muted">Est. Profit/Loss</div>
                  <div class="fw-bold ${estPL >= 0 ? 'text-success' : 'text-danger'}">${formatINR(estPL)}</div>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2" style="border-top: 1px solid var(--border);">
                <button class="btn btn-secondary btn-sm log-auction-btn" data-id="${c.id}">${getIcon('plus', 12)} Log Auction</button>
                <button class="btn btn-primary btn-sm pay-chit-btn" data-id="${c.id}">Pay Installment</button>
                ${!c.taken ? `
                  <button class="btn btn-success btn-sm payout-chit-btn" data-id="${c.id}">Receive Payout</button>
                ` : ''}
                <button class="btn-icon text-muted view-auctions-btn" data-id="${c.id}" title="View Auctions">${getIcon('history', 16)}</button>
                <button class="btn-icon text-muted delete-chit-btn" data-id="${c.id}" title="Delete">${getIcon('trash', 16)}</button>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="card" style="grid-column: 1 / -1;">
            <div class="empty-state">
              <div class="empty-state-icon">${getIcon('chits', 36)}</div>
              <p>No active chits found. Click '+ Create New Chit' to get started!</p>
            </div>
          </div>
        `}
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    const createBtn = container.querySelector('#create-chit-btn');
    if (createBtn) createBtn.addEventListener('click', () => this.showCreateModal(container));

    container.querySelectorAll('.log-auction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        this.showLogAuctionModal(container, id);
      });
    });

    container.querySelectorAll('.pay-chit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        this.showPayInstallmentModal(container, id);
      });
    });

    container.querySelectorAll('.payout-chit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        this.showPayoutModal(container, id);
      });
    });

    container.querySelectorAll('.view-auctions-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        this.showAuctionHistoryModal(id);
      });
    });

    container.querySelectorAll('.delete-chit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').getAttribute('data-id');
        await ChitService.deleteChit(id);
        Toast.show('Chit deleted', 'info');
        this.render(container);
      });
    });
  },

  showCreateModal(container) {
    Modal.open({
      title: 'Create New Chit Fund',
      bodyHTML: `
        <form id="chit-form">
          <div class="form-group">
            <label class="form-label">Chit Name</label>
            <input type="text" class="form-input" name="name" placeholder="e.g. Family Chit / Office Chit" required>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Total Chit Value (₹)</label>
              <input type="number" class="form-input" name="value" placeholder="200000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Total Members</label>
              <input type="number" class="form-input" name="members" placeholder="20" required>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Monthly Installment (₹)</label>
              <input type="number" class="form-input" name="monthly" placeholder="10000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Months)</label>
              <input type="number" class="form-input" name="duration" placeholder="20" required>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Foreman Commission Type</label>
              <select class="form-select" name="commType">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Commission Value</label>
              <input type="number" class="form-input" name="commVal" placeholder="5" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-input" name="startDate" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-chit-submit">Create Chit</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-chit-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#chit-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const data = Object.fromEntries(new FormData(form).entries());
          await ChitService.addChit(data);
          Modal.close();
          Toast.show('Chit Fund created successfully!', 'success');
          this.render(container);
        });
      }
    });
  },

  async showLogAuctionModal(container, chitId) {
    const chit = await ChitService.getChitById(chitId);
    if (!chit) return;

    Modal.open({
      title: `Log Monthly Auction — ${chit.name}`,
      bodyHTML: `
        <form id="auction-form">
          <div class="form-group">
            <label class="form-label">Auction Month</label>
            <input type="number" class="form-input" name="month" value="${chit.currentMonth}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Winning Member Name</label>
            <input type="text" class="form-input" name="winner" placeholder="e.g. Ramesh" required>
          </div>
          <div class="form-group">
            <label class="form-label">Winning Bid Amount (Discount) (₹)</label>
            <input type="number" class="form-input" name="bid" placeholder="e.g. 18000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Foreman Commission (₹)</label>
            <input type="number" class="form-input" name="comm" value="${ChitService.monthlyComm(chit)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Auction Date</label>
            <input type="date" class="form-input" name="date" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-auction-submit">Log Auction</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-auction-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#auction-form');
          if (!form.checkValidity()) { form.reportValidity(); return; }

          const data = Object.fromEntries(new FormData(form).entries());
          await ChitService.logAuction(chitId, data);
          Modal.close();
          Toast.show('Auction logged! Dividends updated.', 'success');
          this.render(container);
        });
      }
    });
  },

  async showPayInstallmentModal(container, chitId) {
    const chit = await ChitService.getChitById(chitId);
    if (!chit) return;

    Modal.open({
      title: `Record Chit Installment — ${chit.name}`,
      bodyHTML: `
        <form id="chit-pay-form">
          <div class="form-group">
            <label class="form-label">Month Number</label>
            <input type="number" class="form-input" name="month" value="${chit.currentMonth}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Amount Paid (₹)</label>
            <input type="number" class="form-input" name="amount" value="${chit.monthly}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" class="form-input" name="date" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-primary" id="save-chit-pay-submit">Record & Sync Ledger</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-chit-pay-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#chit-pay-form');
          const data = Object.fromEntries(new FormData(form).entries());

          await ChitService.recordChitPayment(chitId, data.month, data.amount, data.date);
          Modal.close();
          Toast.show('Chit payment recorded & added to Ledger!', 'success');
          this.render(container);
        });
      }
    });
  },

  async showPayoutModal(container, chitId) {
    const chit = await ChitService.getChitById(chitId);
    if (!chit) return;

    Modal.open({
      title: `Record Chit Payout Received — ${chit.name}`,
      bodyHTML: `
        <form id="payout-form">
          <div class="form-group">
            <label class="form-label">Month Taken</label>
            <input type="number" class="form-input" name="month" value="${chit.currentMonth}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Net Amount Received (₹)</label>
            <input type="number" class="form-input" name="amountReceived" placeholder="e.g. 182000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Payout Date</label>
            <input type="date" class="form-input" name="date" value="${todayISO()}" required>
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancel</button>
        <button class="btn btn-success" id="save-payout-submit">Record Income & Sync Ledger</button>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#save-payout-submit').addEventListener('click', async () => {
          const form = modalEl.querySelector('#payout-form');
          const data = Object.fromEntries(new FormData(form).entries());

          await ChitService.recordChitPayout(chitId, data.month, data.amountReceived, data.date);
          Modal.close();
          Toast.show('Chit Payout recorded as Income in Ledger!', 'success');
          this.render(container);
        });
      }
    });
  },

  async showAuctionHistoryModal(chitId) {
    const chit = await ChitService.getChitById(chitId);
    const auctions = await ChitService.getAuctionsForChit(chitId);

    Modal.open({
      title: `Auction History — ${chit.name}`,
      bodyHTML: `
        <div class="table-responsive">
          ${auctions.length ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Winner</th>
                  <th>Bid (Discount)</th>
                  <th>Div / Member</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${auctions.map(a => {
                  const div = ChitService.auctionDividend(chit, a);
                  return `
                    <tr>
                      <td class="fw-bold">Month ${a.month}</td>
                      <td>${a.winner}</td>
                      <td>${formatINR(a.bid)}</td>
                      <td class="text-success fw-bold">+${formatINR(div)}</td>
                      <td class="text-sm text-muted">${formatDate(a.date)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">${getIcon('history', 36)}</div>
              <p>No monthly auction records logged yet.</p>
            </div>
          `}
        </div>
      `,
      footerHTML: `<button class="btn btn-primary" onclick="document.getElementById('modal-close-btn').click()">Close</button>`
    });
  }
};
