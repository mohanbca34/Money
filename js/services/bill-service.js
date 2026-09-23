/* =========================================================
   Money — js/services/bill-service.js
   Recurring Bills, Loan/EMI Duration Tracker & Countdown Timer Service
   ========================================================= */

import { Repository } from '../storage/repository.js';
import { TransactionService } from './transaction-service.js';

const STORE_BILLS = 'bills';
const STORE_SUBS = 'subscriptions';

export const BillService = {
  // --- BILLS, LOANS & EMIS ---
  async getAllBills() {
    const list = await Repository.getAll(STORE_BILLS);
    return list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  async addBill(data) {
    const record = {
      name: data.name || 'New Bill / EMI',
      provider: data.provider || 'Bank / Provider',
      type: data.type || 'utility', // 'emi' | 'loan' | 'utility' | 'mobile' | 'broadband'
      amount: parseFloat(data.amount) || 0,
      dueDate: data.dueDate || new Date().toISOString().slice(0, 10),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      leadDays: parseInt(data.leadDays) || 3, // 1 | 3 | 5 | 7 days before
      validityDays: parseInt(data.validityDays) || 30,
      autoRenew: !!data.autoRenew,
      notes: data.notes || '',
      status: 'pending' // 'pending' | 'paid'
    };
    return await Repository.save(STORE_BILLS, record);
  },

  async markBillPaid(id) {
    const bill = await Repository.getById(STORE_BILLS, id);
    if (!bill) return null;

    const today = new Date().toISOString().slice(0, 10);
    bill.status = 'paid';
    bill.lastPaidDate = today;
    await Repository.save(STORE_BILLS, bill);

    // Auto-create linked Expense transaction in Ledger
    await TransactionService.addTransaction({
      type: 'expense',
      amount: bill.amount,
      category: bill.type === 'emi' || bill.type === 'loan' ? 'EMI & Loan' : 'Bills & Utilities',
      date: today,
      description: `${bill.name} — Paid`,
      notes: `Bill / EMI payment marked as paid in Money`,
      paymentMethod: 'Auto-debit',
      sourceType: 'bill',
      sourceId: bill.id
    });

    return bill;
  },

  async deleteBill(id) {
    return await Repository.softDelete(STORE_BILLS, id);
  },

  // --- SUBSCRIPTIONS ---
  async getAllSubscriptions() {
    const list = await Repository.getAll(STORE_SUBS);
    return list.sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));
  },

  async addSubscription(data) {
    const record = {
      name: data.name || 'New Subscription',
      service: data.service || 'OTT',
      amount: parseFloat(data.amount) || 0,
      billingCycle: data.billingCycle || 'monthly', // 'monthly' | 'yearly'
      nextBillingDate: data.nextBillingDate || new Date().toISOString().slice(0, 10),
      leadDays: parseInt(data.leadDays) || 3,
      notes: data.notes || ''
    };
    return await Repository.save(STORE_SUBS, record);
  },

  async markSubPaid(id) {
    const sub = await Repository.getById(STORE_SUBS, id);
    if (!sub) return null;

    const today = new Date().toISOString().slice(0, 10);

    // Auto-advance next billing date by 1 month or 1 year
    const nextDate = new Date(sub.nextBillingDate || today);
    if (sub.billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    sub.nextBillingDate = nextDate.toISOString().slice(0, 10);
    await Repository.save(STORE_SUBS, sub);

    // Auto-create linked Expense transaction
    await TransactionService.addTransaction({
      type: 'expense',
      amount: sub.amount,
      category: 'Entertainment',
      date: today,
      description: `${sub.name} Subscription Renewal`,
      notes: `Subscription marked as paid in Money`,
      paymentMethod: 'Card',
      sourceType: 'subscription',
      sourceId: sub.id
    });

    return sub;
  },

  async deleteSub(id) {
    return await Repository.softDelete(STORE_SUBS, id);
  },

  // --- COUNTDOWN & DURATION CALCULATIONS (Exact h:m countdown) ---
  getCountdown(dateStr) {
    if (!dateStr) return { label: 'No due date', cls: 'badge-blue', text: 'No due date' };

    const target = new Date(`${dateStr}T23:59:59`);
    const now = new Date();
    const diffMs = target - now;

    if (diffMs <= 0) {
      return { label: 'Overdue', cls: 'badge-red', text: 'Overdue', days: -1, isOverdue: true };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = '';
    if (days > 0) {
      countdownText = `${days}d ${hours}h ${mins}m remaining`;
    } else {
      countdownText = `${hours}h ${mins}m remaining`;
    }

    let badgeCls = 'badge-green';
    if (days < 1) badgeCls = 'badge-red';
    else if (days <= 3) badgeCls = 'badge-amber';

    return {
      label: countdownText,
      cls: badgeCls,
      days,
      hours,
      mins,
      isOverdue: false
    };
  },

  // Calculate duration between startDate and endDate
  calculateDurationSummary(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return null;

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const elapsedMonths = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
    const remainingMonths = Math.max(0, totalMonths - elapsedMonths);

    return {
      totalMonths,
      elapsedMonths: Math.min(totalMonths, elapsedMonths),
      remainingMonths,
      text: `${Math.min(totalMonths, elapsedMonths)} of ${totalMonths} months (${remainingMonths} mos remaining)`
    };
  },

  daysLeft(dateStr) {
    if (!dateStr) return 999;
    const due = new Date(dateStr);
    const now = new Date();
    due.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    return Math.round((due - now) / (1000 * 60 * 60 * 24));
  },

  urgencyBadge(days) {
    if (days < 0) return { cls: 'badge-red', label: 'Overdue' };
    if (days <= 3) return { cls: 'badge-red', label: `${days}d left` };
    if (days <= 10) return { cls: 'badge-amber', label: `${days}d left` };
    return { cls: 'badge-green', label: `${days}d left` };
  }
};
