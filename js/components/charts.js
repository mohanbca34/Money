/* =========================================================
   MoneyFlow — charts.js
   Chart.js Controller (Lifecycle & Memory Leak Prevention)
   ========================================================= */

const chartInstances = {};

export const ChartController = {
  destroy(canvasId) {
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
      delete chartInstances[canvasId];
    }
  },

  renderCashFlowChart(canvasId, labels, incomeData, expenseData) {
    if (typeof window.Chart === 'undefined') return;
    this.destroy(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Income',
            data: incomeData || [0, 0, 0, 0, 0, 0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          },
          {
            label: 'Expenses',
            data: expenseData || [0, 0, 0, 0, 0, 0],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(226, 232, 240, 0.5)' } }
        }
      }
    });
  },

  renderCategoryDonutChart(canvasId, categoriesData) {
    if (typeof window.Chart === 'undefined') return;
    this.destroy(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = categoriesData.map(c => c.name);
    const data = categoriesData.map(c => c.amount);
    const colors = [
      '#2563eb', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
    ];

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: data.length ? colors.slice(0, labels.length) : ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        },
        cutout: '70%'
      }
    });
  }
};
