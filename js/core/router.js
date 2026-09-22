/* =========================================================
   MoneyFlow — router.js
   Hash-based Client-Side Router
   ========================================================= */

import { state } from './state.js';

export const Router = {
  routes: {},

  register(path, handler) {
    this.routes[path] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  navigate(path) {
    window.location.hash = path;
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const viewName = hash.split('?')[0];

    state.setView(viewName);

    const handler = this.routes[viewName] || this.routes['dashboard'];
    if (handler) {
      handler();
    }
  }
};
