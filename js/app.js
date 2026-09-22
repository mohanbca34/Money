/* =========================================================
   MoneyFlow — app.js
   Application Main Orchestrator & Entry Point (Vector Icon Injector)
   ========================================================= */

import { state } from './core/state.js';
import { Router } from './core/router.js';
import { debounce } from './core/utils.js';
import { Navigation } from './components/navigation.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';
import { getIcon } from './components/icons.js';

import { FirebaseAuth } from './firebase/auth.js';
import { CloudSync } from './firebase/sync.js';

import { TransactionService } from './services/transaction-service.js';
import { ChitService } from './services/chit-service.js';
import { BillService } from './services/bill-service.js';
import { BudgetService } from './services/budget-service.js';

import { DashboardModule } from './modules/dashboard.js';
import { TransactionsModule } from './modules/transactions.js';
import { BudgetsModule } from './modules/budgets.js';
import { SubscriptionsModule } from './modules/subscriptions.js';
import { ChitsModule } from './modules/chits.js';
import { CalculatorsModule } from './modules/calculators.js';
import { AnalyticsModule } from './modules/analytics.js';
import { ReportsModule } from './modules/reports.js';
import { SearchModule } from './modules/search.js';
import { BackupModule } from './modules/backup.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme Setup
  const initialTheme = state.theme;
  document.documentElement.setAttribute('data-theme', initialTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  const updateThemeUI = (theme) => {
    if (themeIcon) themeIcon.innerHTML = getIcon(theme === 'dark' ? 'sun' : 'moon', 18);
    if (themeText) themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  };

  updateThemeUI(initialTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      state.setTheme(nextTheme);
      updateThemeUI(nextTheme);
    });
  }

  // Inject Vector Icons for static HTML elements with data-icon
  document.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.getAttribute('data-icon');
    if (iconName) el.innerHTML = getIcon(iconName, 18);
  });

  // 2. Initialize Seed Data if IndexedDB is fresh
  await seedInitialDataIfEmpty();

  // 3. Register Client Routes
  const viewContainer = document.getElementById('view-container');

  Router.register('dashboard', () => {
    Navigation.update('dashboard');
    DashboardModule.render(viewContainer);
  });

  Router.register('transactions', () => {
    Navigation.update('transactions');
    TransactionsModule.render(viewContainer);
  });

  Router.register('budgets', () => {
    Navigation.update('budgets');
    BudgetsModule.render(viewContainer);
  });

  Router.register('subscriptions', () => {
    Navigation.update('subscriptions');
    SubscriptionsModule.render(viewContainer);
  });

  Router.register('chits', () => {
    Navigation.update('chits');
    ChitsModule.render(viewContainer);
  });

  Router.register('calculators', () => {
    Navigation.update('calculators');
    CalculatorsModule.render(viewContainer);
  });

  Router.register('analytics', () => {
    Navigation.update('analytics');
    AnalyticsModule.render(viewContainer);
  });

  Router.register('reports', () => {
    Navigation.update('reports');
    ReportsModule.render(viewContainer);
  });

  Router.register('backup', () => {
    Navigation.update('backup');
    BackupModule.render(viewContainer);
  });

  Router.register('search', () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const query = params.get('q') || '';
    SearchModule.render(viewContainer, query);
  });

  // Start Router
  Router.init();

  // 4. Quick Add Floating Action Button (+)
  const quickAddBtn = document.getElementById('quick-add-btn');
  const mobileFabBtn = document.getElementById('mobile-fab-btn');

  const openQuickAddModal = () => {
    Modal.open({
      title: 'Quick Add Financial Record',
      bodyHTML: `
        <div class="grid-2 gap-3">
          <button class="btn btn-primary p-4 flex-col text-center" id="qa-expense">
            <span class="mb-1">${getIcon('expense', 26)}</span>
            <span>Add Expense</span>
          </button>
          <button class="btn btn-success p-4 flex-col text-center" id="qa-income">
            <span class="mb-1">${getIcon('income', 26)}</span>
            <span>Add Income</span>
          </button>
          <button class="btn btn-secondary p-4 flex-col text-center" id="qa-chit-pay">
            <span class="mb-1">${getIcon('chits', 26)}</span>
            <span>Chit Payment</span>
          </button>
          <button class="btn btn-secondary p-4 flex-col text-center" id="qa-bill">
            <span class="mb-1">${getIcon('bills', 26)}</span>
            <span>Add Bill</span>
          </button>
        </div>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#qa-expense')?.addEventListener('click', () => {
          Modal.close();
          TransactionsModule.showAddModal(viewContainer);
        });
        modalEl.querySelector('#qa-income')?.addEventListener('click', () => {
          Modal.close();
          TransactionsModule.showAddModal(viewContainer);
        });
        modalEl.querySelector('#qa-chit-pay')?.addEventListener('click', () => {
          Modal.close();
          Router.navigate('#chits');
        });
        modalEl.querySelector('#qa-bill')?.addEventListener('click', () => {
          Modal.close();
          SubscriptionsModule.showAddBillModal(viewContainer);
        });
      }
    });
  };

  if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);
  if (mobileFabBtn) mobileFabBtn.addEventListener('click', openQuickAddModal);

  // 5. Global Search Listener
  const globalSearchInput = document.getElementById('global-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', debounce((e) => {
      const q = e.target.value.trim();
      if (q.length > 0) {
        Router.navigate(`#search?q=${encodeURIComponent(q)}`);
      } else if (window.location.hash.startsWith('#search')) {
        Router.navigate('#dashboard');
      }
    }, 350));
  }

  // 6. Navigation Link Click Listeners
  document.querySelectorAll('#sidebar-nav .nav-item, #mobile-nav .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      if (view) Router.navigate(`#${view}`);
    });
  });

  // 7. Firebase Auth & Sync Observer
  FirebaseAuth.init((user) => {
    state.setUser(user);
    if (user && !user.isGuest) {
      CloudSync.syncPending();
    }
  });

  window.addEventListener('online', () => {
    updateSyncBadge('online');
    CloudSync.syncPending();
  });

  window.addEventListener('offline', () => {
    updateSyncBadge('offline');
  });

  // 8. Register Service Worker for PWA
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Note:', err));
  }
});

function updateSyncBadge(status) {
  const badgeDot = document.getElementById('sync-status-dot');
  const badgeText = document.getElementById('sync-status-text');

  if (badgeDot && badgeText) {
    if (status === 'online') {
      badgeDot.className = 'sync-status-dot';
      badgeText.textContent = 'Synced';
    } else {
      badgeDot.className = 'sync-status-dot offline';
      badgeText.textContent = 'Offline';
    }
  }
}

// Seed initial demo data from Money Tracker & ChitWise reference repos if fresh
async function seedInitialDataIfEmpty() {
  const txns = await TransactionService.getAllTransactions();
  if (txns.length === 0) {
    const seedTxns = [
      { type: 'income', amount: 65000, category: 'Salary', description: 'TCS Monthly Salary', date: '2026-06-01', paymentMethod: 'Bank Transfer' },
      { type: 'income', amount: 15000, category: 'Freelancing', description: 'Web Design Project', date: '2026-06-05', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3450, category: 'Food', description: 'DMart Supermarket', date: '2026-06-08', paymentMethod: 'UPI' },
      { type: 'expense', amount: 1800, category: 'Fuel', description: 'HP Fuel Station', date: '2026-06-10', paymentMethod: 'Cash' },
      { type: 'expense', amount: 1450, category: 'Bills', description: 'Electricity Bill', date: '2026-06-12', paymentMethod: 'Auto-debit' },
      { type: 'expense', amount: 649, category: 'Entertainment', description: 'Netflix Subscription', date: '2026-06-01', paymentMethod: 'Card' }
    ];
    for (const t of seedTxns) await TransactionService.addTransaction(t);
  }

  const chits = await ChitService.getAllChits();
  if (chits.length === 0) {
    const c1 = await ChitService.addChit({
      name: 'Family Chit', value: 200000, members: 20, monthly: 10000,
      duration: 20, commType: 'percent', commVal: 5, startDate: '2026-01-01', currentMonth: 5
    });
    if (c1) {
      await ChitService.logAuction(c1.id, { month: 1, winner: 'Rajan', bid: 18000, comm: 5000, date: '2026-01-05' });
      await ChitService.logAuction(c1.id, { month: 2, winner: 'Meena', bid: 16000, comm: 5000, date: '2026-02-05' });
      await ChitService.logAuction(c1.id, { month: 3, winner: 'Suresh', bid: 17000, comm: 5000, date: '2026-03-05' });
    }

    await ChitService.addChit({
      name: 'Office Chit', value: 300000, members: 25, monthly: 12000,
      duration: 25, commType: 'percent', commVal: 5, startDate: '2026-01-01', currentMonth: 3
    });
  }

  const bills = await BillService.getAllBills();
  if (bills.length === 0) {
    await BillService.addBill({ name: 'Airtel Mobile Recharge', provider: 'Airtel', amount: 349, dueDate: '2026-09-28' });
    await BillService.addBill({ name: 'BSNL Broadband Fiber', provider: 'BSNL', amount: 999, dueDate: '2026-09-30' });
  }

  const subs = await BillService.getAllSubscriptions();
  if (subs.length === 0) {
    await BillService.addSubscription({ name: 'Netflix Premium', service: 'OTT', amount: 649, billingCycle: 'monthly', nextBillingDate: '2026-10-01' });
    await BillService.addSubscription({ name: 'ChatGPT Plus', service: 'AI', amount: 1650, billingCycle: 'monthly', nextBillingDate: '2026-10-10' });
  }

  const budgets = await BudgetService.getAllBudgets();
  if (budgets.length === 0) {
    await BudgetService.addBudget({ category: 'Food', limitAmount: 8000 });
    await BudgetService.addBudget({ category: 'Bills', limitAmount: 5000 });
    await BudgetService.addBudget({ category: 'Fuel', limitAmount: 4000 });
  }
}
