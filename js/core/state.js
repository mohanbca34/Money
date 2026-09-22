/* =========================================================
   MoneyFlow — state.js
   Central Application State Store
   ========================================================= */

import { LocalStore } from '../storage/local-storage.js';

class AppState {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = LocalStore.get('theme', 'light');
    this.user = null;
    this.lastDeletedRecord = null; // For Undo functionality
    this.listeners = [];
  }

  setTheme(theme) {
    this.theme = theme;
    LocalStore.set('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify('theme', theme);
  }

  setView(view) {
    this.currentView = view;
    this.notify('view', view);
  }

  setUser(user) {
    this.user = user;
    this.notify('user', user);
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify(event, data) {
    this.listeners.forEach(fn => fn(event, data));
  }
}

export const state = new AppState();
