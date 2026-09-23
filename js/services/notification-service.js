/* =========================================================
   Money — js/services/notification-service.js
   PWA Push Notification & Automated EMI/Bill Reminder Engine
   ========================================================= */

import { BillService } from './bill-service.js';
import { ChitService } from './chit-service.js';
import { Toast } from '../components/toast.js';

export const NotificationService = {
  // Public VAPID Key Placeholder (Protected by server-side private key)
  VAPID_PUBLIC_KEY: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv7_L0T3quM3AUNLaPDMDF0fOSA_VAPID_PUB_KEY',

  async getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      Toast.show('Web Notifications are not supported in this browser.', 'warning');
      return false;
    }

    if (Notification.permission === 'granted') return true;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        Toast.show('Push Notifications enabled successfully!', 'success');
        this.sendNotification('Money Notifications Enabled', {
          body: 'You will now receive EMI, Bill, and ChitWise payment reminders.',
          url: './#subscriptions'
        });
        return true;
      } else {
        Toast.show('Notification permission denied.', 'info');
        return false;
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      return false;
    }
  },

  async sendNotification(title, options = {}) {
    const status = await this.getPermissionStatus();
    if (status !== 'granted') return false;

    const payload = {
      body: options.body || '',
      icon: options.icon || 'assets/icons/icon-192.svg',
      badge: options.badge || 'assets/icons/favicon.svg',
      data: { url: options.url || './#dashboard' }
    };

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, payload);
        return true;
      }
    }

    new Notification(title, payload);
    return true;
  },

  // Automated Check for Due Dates & Lead Time Reminders (EMI, Bills, Subscriptions)
  async checkAndTriggerScheduledReminders() {
    const status = await this.getPermissionStatus();
    if (status !== 'granted') return;

    // 1. Check Bills & EMI Loans
    const bills = await BillService.getAllBills();
    for (const b of bills) {
      if (b.status === 'paid') continue;
      const days = BillService.daysLeft(b.dueDate);
      const leadDays = parseInt(b.leadDays) || 3;
      const countdown = BillService.getCountdown(b.dueDate);

      if (days === leadDays || days === 1 || days === 0) {
        const title = b.type === 'emi' || b.type === 'loan' ? `EMI Reminder — ${b.name}` : `Bill Reminder — ${b.name}`;
        this.sendNotification(title, {
          body: `Payment of ₹${b.amount} (${b.provider}) is ${countdown.label}!`,
          url: './#subscriptions'
        });
      }
    }

    // 2. Check Subscription Renewals
    const subs = await BillService.getAllSubscriptions();
    for (const s of subs) {
      const days = BillService.daysLeft(s.nextBillingDate);
      const leadDays = parseInt(s.leadDays) || 3;
      const countdown = BillService.getCountdown(s.nextBillingDate);

      if (days === leadDays || days === 1 || days === 0) {
        this.sendNotification(`Subscription Reminder — ${s.name}`, {
          body: `Renewal of ₹${s.amount} is ${countdown.label}!`,
          url: './#subscriptions'
        });
      }
    }

    // 3. Check ChitWise Auction / Installment Dates
    const chits = await ChitService.getAllChits();
    for (const c of chits) {
      if (!c.taken) {
        this.sendNotification(`ChitWise Alert — ${c.name}`, {
          body: `Month ${c.currentMonth} auction & installment active for ${c.name}.`,
          url: './#chits'
        });
      }
    }
  },

  // Save Custom Reminder
  async saveCustomReminder(reminder) {
    const reminders = JSON.parse(localStorage.getItem('money_custom_reminders') || '[]');
    reminders.push({
      id: `rem_${Date.now()}`,
      title: reminder.title,
      type: reminder.type || 'EMI',
      amount: parseFloat(reminder.amount) || 0,
      dueDate: reminder.dueDate,
      leadDays: parseInt(reminder.leadDays) || 3,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('money_custom_reminders', JSON.stringify(reminders));
    Toast.show(`Reminder saved for ${reminder.title}!`, 'success');
  }
};
