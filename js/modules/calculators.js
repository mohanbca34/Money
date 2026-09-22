/* =========================================================
   MoneyFlow — calculators.js
   Chit Fund Financial Calculators (Vector Icons)
   ========================================================= */

import { ChitService } from '../services/chit-service.js';
import { getIcon } from '../components/icons.js';
import { formatINR } from '../core/utils.js';

let activeTab = 'bid-simulator';

export const CalculatorsModule = {
  async render(container) {
    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="card-title mb-1">Chit Fund Financial Calculators</h3>
        <p class="text-sm text-muted mb-4">Accurate mathematical models for bidding strategy and dividend forecasting.</p>

        <!-- Segmented Control Tabs -->
        <div class="tabs-container" style="max-width: 500px;">
          <button class="tab-btn ${activeTab === 'bid-simulator' ? 'active' : ''}" data-tab="bid-simulator">Bid Simulator</button>
          <button class="tab-btn ${activeTab === 'best-month' ? 'active' : ''}" data-tab="best-month">Best Month Calculator</button>
          <button class="tab-btn ${activeTab === 'pl-calculator' ? 'active' : ''}" data-tab="pl-calculator">Profit / Loss Calculator</button>
        </div>

        <div id="calculator-tab-content"></div>
      </div>
    `;

    const contentArea = container.querySelector('#calculator-tab-content');

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.getAttribute('data-tab');
        this.render(container);
      });
    });

    if (activeTab === 'bid-simulator') this.renderBidSimulator(contentArea);
    if (activeTab === 'best-month') this.renderBestMonth(contentArea);
    if (activeTab === 'pl-calculator') this.renderPLCalculator(contentArea);
  },

  renderBidSimulator(container) {
    container.innerHTML = `
      <div class="grid-2">
        <div class="flex flex-col gap-4">
          <h4 class="fw-bold">Bid Simulation Parameters</h4>
          <div class="form-group">
            <label class="form-label">Total Chit Value (₹)</label>
            <input type="number" class="form-input" id="sim-value" value="200000">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Members</label>
              <input type="number" class="form-input" id="sim-members" value="20">
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Months)</label>
              <input type="number" class="form-input" id="sim-duration" value="20">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Month Taken</label>
              <input type="number" class="form-input" id="sim-month" value="5">
            </div>
            <div class="form-group">
              <label class="form-label">Bid Discount (₹)</label>
              <input type="number" class="form-input" id="sim-bid" value="18000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Foreman Commission (%)</label>
            <input type="number" class="form-input" id="sim-comm" value="5">
          </div>
        </div>

        <div class="calculator-result-box" id="sim-result-box">
          <!-- Dynamic Calculations -->
        </div>
      </div>
    `;

    const calculate = () => {
      const value = parseFloat(container.querySelector('#sim-value').value) || 0;
      const members = parseInt(container.querySelector('#sim-members').value) || 1;
      const duration = parseInt(container.querySelector('#sim-duration').value) || 1;
      const monthTaken = parseInt(container.querySelector('#sim-month').value) || 1;
      const bidDiscount = parseFloat(container.querySelector('#sim-bid').value) || 0;
      const commPercent = parseFloat(container.querySelector('#sim-comm').value) || 0;

      const commAmt = (value * commPercent) / 100;
      const totalDividendPool = Math.max(0, bidDiscount - commAmt);
      const dividendPerMember = totalDividendPool / members;
      const netPayoutReceived = value - bidDiscount;

      const estTotalContributions = (value / duration) * duration - (dividendPerMember * (duration - 1));
      const netPL = netPayoutReceived - estTotalContributions;
      const returnPercent = ((netPL / estTotalContributions) * 100).toFixed(1);

      container.querySelector('#sim-result-box').innerHTML = `
        <h4 class="fw-bold mb-2">Simulation Results</h4>
        <div class="grid-2 gap-4">
          <div>
            <div class="text-xs text-muted">Foreman Commission</div>
            <div class="fw-bold text-lg">${formatINR(commAmt)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Dividend / Member</div>
            <div class="fw-bold text-lg text-success">${formatINR(dividendPerMember)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Net Payout Received</div>
            <div class="fw-bold text-lg text-primary">${formatINR(netPayoutReceived)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Total Contribution</div>
            <div class="fw-bold text-lg">${formatINR(estTotalContributions)}</div>
          </div>
        </div>

        <div class="p-3 border-radius-md" style="background-color: var(--surface-solid); border: 1px solid var(--border); margin-top: 10px;">
          <div class="text-xs text-muted">Net Financial Result</div>
          <div class="fw-bold text-xl ${netPL >= 0 ? 'text-success' : 'text-danger'}">
            ${netPL >= 0 ? '+' : ''}${formatINR(netPL)} (${returnPercent}%)
          </div>
        </div>
      `;
    };

    container.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calculate));
    calculate();
  },

  renderBestMonth(container) {
    container.innerHTML = `
      <div class="card p-4">
        <h4 class="fw-bold mb-3">Best Month Strategy Advisory</h4>
        <p class="text-sm text-muted mb-4">
          In Chit funds, bidding too early yields high liquidity but heavy discounts (interest cost). Bidding late maximizes dividends but delays capital utility.
        </p>
        <div class="grid-3">
          <div class="p-4 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border);">
            <div class="fw-bold text-primary mb-1">Months 1 – 4</div>
            <div class="text-xs text-muted">High Borrowing Need</div>
            <p class="text-sm mt-2">Best for emergency business capital. High bid discount acts as immediate loan fee.</p>
          </div>
          <div class="p-4 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border);">
            <div class="fw-bold text-success mb-1">Months 5 – 12</div>
            <div class="text-xs text-muted">Optimal Sweet Spot</div>
            <p class="text-sm mt-2">Optimal balance between reasonable dividend earnings and liquidity access.</p>
          </div>
          <div class="p-4 border-radius-md" style="background: var(--surface-alt); border: 1px solid var(--border);">
            <div class="fw-bold text-warning mb-1">Months 13+</div>
            <div class="text-xs text-muted">Maximum Savings Return</div>
            <p class="text-sm mt-2">Maximum dividend returns. Equivalent to high-yield recurring deposit returns.</p>
          </div>
        </div>
      </div>
    `;
  },

  renderPLCalculator(container) {
    container.innerHTML = `
      <div class="card p-4">
        <h4 class="fw-bold mb-3">Chit Profit / Loss Calculator</h4>
        <p class="text-sm text-muted">Enter completed chit details to compute exact net profit / loss ROI percentage.</p>
      </div>
    `;
  }
};
