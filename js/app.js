/* =========================================================
   Money — js/app.js
   Application Main Orchestrator, Mobile Navigation & Security Gatekeeper
   ========================================================= */

import { state } from './core/state.js';
import { Router } from './core/router.js';
import { debounce } from './core/utils.js';
import { Navigation } from './components/navigation.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';
import { AuthModal } from './components/auth-modal.js';
import { PullToRefresh } from './components/pull-to-refresh.js';
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

  // 2. Initialize Native Mobile Pull-to-Refresh
  PullToRefresh.init();

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
          <button class="btn btn-primary p-4 flex-col text-center" id="qa-expense" style="height: 90px; justify-content: center;">
            <span class="mb-1">${getIcon('expense', 26)}</span>
            <span class="fw-bold">Add Expense</span>
          </button>
          <button class="btn btn-success p-4 flex-col text-center" id="qa-income" style="height: 90px; justify-content: center;">
            <span class="mb-1">${getIcon('income', 26)}</span>
            <span class="fw-bold">Add Income</span>
          </button>
          <button class="btn btn-secondary p-4 flex-col text-center" id="qa-bill" style="height: 90px; justify-content: center;">
            <span class="mb-1">${getIcon('bills', 26)}</span>
            <span class="fw-bold">Add Utility Bill</span>
          </button>
          <button class="btn btn-secondary p-4 flex-col text-center" id="qa-sub" style="height: 90px; justify-content: center;">
            <span class="mb-1">${getIcon('bills', 26)}</span>
            <span class="fw-bold">Add Subscription</span>
          </button>
          <button class="btn btn-secondary p-4 flex-col text-center" id="qa-chit-pay" style="height: 90px; justify-content: center; grid-column: span 2;">
            <span class="mb-1">${getIcon('chits', 26)}</span>
            <span class="fw-bold">Chit Wise Group & Payments</span>
          </button>
        </div>
      `,
      onRender: (modalEl) => {
        modalEl.querySelector('#qa-expense')?.addEventListener('click', () => {
          Modal.close();
          TransactionsModule.showAddModal(viewContainer, 'expense');
        });
        modalEl.querySelector('#qa-income')?.addEventListener('click', () => {
          Modal.close();
          TransactionsModule.showAddModal(viewContainer, 'income');
        });
        modalEl.querySelector('#qa-bill')?.addEventListener('click', () => {
          Modal.close();
          SubscriptionsModule.showAddBillModal(viewContainer);
        });
        modalEl.querySelector('#qa-sub')?.addEventListener('click', () => {
          Modal.close();
          SubscriptionsModule.showAddSubModal(viewContainer);
        });
        modalEl.querySelector('#qa-chit-pay')?.addEventListener('click', () => {
          Modal.close();
          Router.navigate('#chits');
        });
      }
    });
  };

  // 5. Mobile "More Menu" Drawer Sheet
  const openMoreMenuModal = () => {
    Modal.open({
      title: 'Money — Platform Applications & Features',
      bodyHTML: `
        <div class="flex flex-col gap-3">
          <p class="text-xs text-muted mb-1">Select any module below to open it instantly on your mobile screen:</p>
          <div class="grid-2 gap-3">
            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-bills" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-primary">${getIcon('bills', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Bills & Subscriptions</div>
                <div class="text-xs text-muted">Recharges, OTT renewals</div>
              </div>
            </button>

            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-budgets" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-warning">${getIcon('budgets', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Budgets & Goals</div>
                <div class="text-xs text-muted">Category expense limits</div>
              </div>
            </button>

            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-calculators" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-success">${getIcon('calculators', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Chit Calculators</div>
                <div class="text-xs text-muted">Auction bidding simulator</div>
              </div>
            </button>

            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-analytics" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-info">${getIcon('analytics', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Analytics & Trends</div>
                <div class="text-xs text-muted">Income vs Expense charts</div>
              </div>
            </button>

            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-reports" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-primary">${getIcon('reports', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Reports & Export</div>
                <div class="text-xs text-muted">Print, PDF & CSV export</div>
              </div>
            </button>

            <button class="btn btn-secondary p-3 flex items-center gap-3 text-left w-full" id="more-nav-backup" style="justify-content: flex-start;">
              <span class="stat-icon-wrapper stat-icon-success">${getIcon('backup', 20)}</span>
              <div>
                <div class="fw-bold text-sm">Backup & Cloud Sync</div>
                <div class="text-xs text-muted">Firebase Cloud & JSON backup</div>
              </div>
            </button>
          </div>
        </div>
      `,
      onRender: (modalEl) => {
        const bindNav = (btnId, route) => {
          modalEl.querySelector(btnId)?.addEventListener('click', () => {
            Modal.close();
            Router.navigate(route);
          });
        };
        bindNav('#more-nav-bills', '#subscriptions');
        bindNav('#more-nav-budgets', '#budgets');
        bindNav('#more-nav-calculators', '#calculators');
        bindNav('#more-nav-analytics', '#analytics');
        bindNav('#more-nav-reports', '#reports');
        bindNav('#more-nav-backup', '#backup');
      }
    });
  };

  if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);
  if (mobileFabBtn) mobileFabBtn.addEventListener('click', openQuickAddModal);

  // 6. Global Search Listener
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

  // 7. Navigation Link Click Listeners
  document.querySelectorAll('#sidebar-nav .nav-item, #mobile-nav .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      if (view === 'more') {
        openMoreMenuModal();
      } else if (view) {
        Router.navigate(`#${view}`);
      }
    });
  });

  // 8. Firebase Authentication & Security Gatekeeper
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

  // 9. Register Service Worker for PWA
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
