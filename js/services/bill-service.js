/* =========================================================
   MoneyFlow — bill-service.js
   Recurring Bills, Subscriptions & Auto Expense Trigger
   ========================================================= */

import { Repository } from '../storage/repository.js';
import { TransactionService } from './transaction-service.js';

const STORE_BILLS = 'bills';
const STORE_SUBS = 'subscriptions';

export const BillService = {
  // --- BILLS & RECHARGES ---
  async getAllBills() {
    const list = await Repository.getAll(STORE_BILLS);
    return list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  async addBill(data) {
    const record = {
      name: data.name || 'New Bill',
      provider: data.provider || 'Provider',
      type: data.type || 'utility', // 'mobile' | 'broadband' | 'ott' | 'utility'
      amount: parseFloat(data.amount) || 0,
      dueDate: data.dueDate || new Date().toISOString().slice(0, 10),
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

    // Auto-create linked Expense transaction
    await TransactionService.addTransaction({
      type: 'expense',
      amount: bill.amount,
      category: 'Bills & Utilities',
      date: today,
      description: `${bill.name} — ${bill.provider} Bill Paid`,
      notes: `Bill payment marked as paid in MoneyFlow`,
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
      notes: `Subscription marked as paid in MoneyFlow`,
      paymentMethod: 'Card',
      sourceType: 'subscription',
      sourceId: sub.id
    });

    return sub;
  },

  async deleteSub(id) {
    return await Repository.softDelete(STORE_SUBS, id);
  },

  // Helper: Urgency status
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
