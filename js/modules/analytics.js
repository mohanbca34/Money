/* =========================================================
   MoneyFlow — analytics.js
   Analytics & Visual Financial Insights Module (Vector Icons)
   ========================================================= */

import { TransactionService } from '../services/transaction-service.js';
import { ChartController } from '../components/charts.js';
import { getIcon } from '../components/icons.js';

export const AnalyticsModule = {
  async render(container) {
    const categoryData = await TransactionService.getCategoryBreakdown();

    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="card-title">Financial Analytics & Trends</h3>
        <p class="text-sm text-muted">Deep dive visual insights into spending habits and monthly cashflow trend dynamics.</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Spending by Category</h3>
          </div>
          <div class="chart-container" style="position: relative; height: 280px;">
            <canvas id="analytics-donut-canvas"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Monthly Cashflow Performance</h3>
          </div>
          <div class="chart-container" style="position: relative; height: 280px;">
            <canvas id="analytics-bar-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartController.renderCategoryDonutChart('analytics-donut-canvas', categoryData);
      ChartController.renderCashFlowChart(
        'analytics-bar-canvas',
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        [65000, 72000, 80000, 88000, 80000, 95000],
        [8000, 11000, 12000, 10500, 14000, 13500]
      );
    }, 50);
  }
};
