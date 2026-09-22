/* =========================================================
   Money — js/app.js
   Application Main Orchestrator & Security Gatekeeper
   ========================================================= */

import { state } from './core/state.js';
import { Router } from './core/router.js';
import { debounce } from './core/utils.js';
import { Navigation } from './components/navigation.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';
import { AuthModal } from './components/auth-modal.js';
import { getIcon } from './components/icons.js';

import { FirebaseAuth } from './firebase/auth.js';
import { CloudSync } from './firebase/sync.js';
import { ReportService } from './services/report-service.js';

import { TransactionsModule } from './modules/transactions.js';
import { SubscriptionsModule } from './modules/subscriptions.js';

import { DashboardModule } from './modules/dashboard.js';
import { BudgetsModule } from './modules/budgets.js';
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

  // 2. Register Client Routes
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

  // 3. Quick Add Floating Action Button (+)
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

  // 4. Global Search Listener
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

  // 5. Navigation Link Click Listeners
  document.querySelectorAll('#sidebar-nav .nav-item, #mobile-nav .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      if (view) Router.navigate(`#${view}`);
    });
  });

  // 6. Firebase Authentication & Security Gatekeeper
  FirebaseAuth.init(async (user) => {
    state.setUser(user);
    if (!user) {
      AuthModal.renderOverlay();
    } else {
      AuthModal.closeOverlay();
      updateSyncBadge(navigator.onLine ? 'online' : 'offline');

      // Check auto backup schedule (24h)
      await ReportService.checkAndPerformAutoBackup();

      // Trigger background sync
      CloudSync.syncPending();

      // Refresh current view
      Router.handleRoute();
    }
  });

  window.addEventListener('online', () => {
    updateSyncBadge('online');
    CloudSync.syncPending();
  });

  window.addEventListener('offline', () => {
    updateSyncBadge('offline');
  });

  // 7. Register Service Worker for PWA
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
