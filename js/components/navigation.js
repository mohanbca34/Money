/* =========================================================
   MoneyFlow — navigation.js
   Active View Highlighting & Header Title Updates
   ========================================================= */

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  transactions: 'Transactions Ledger',
  budgets: 'Budgets & Progress',
  subscriptions: 'Bills & Subscriptions',
  chits: 'ChitWise Manager',
  calculators: 'Chit Calculators',
  analytics: 'Analytics & Insights',
  reports: 'Reports & Export',
  backup: 'Backup & Cloud Sync'
};

export const Navigation = {
  update(activeView) {
    // Update desktop sidebar items
    const sidebarItems = document.querySelectorAll('#sidebar-nav .nav-item');
    sidebarItems.forEach(item => {
      const view = item.getAttribute('data-view');
      item.classList.toggle('active', view === activeView);
    });

    // Update mobile bottom nav items
    const mobileBtns = document.querySelectorAll('#mobile-nav .mobile-nav-btn');
    mobileBtns.forEach(btn => {
      const view = btn.getAttribute('data-view');
      btn.classList.toggle('active', view === activeView);
    });

    // Update Header Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      titleEl.textContent = VIEW_TITLES[activeView] || 'MoneyFlow';
    }
  }
};
