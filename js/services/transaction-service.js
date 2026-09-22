/* =========================================================
   MoneyFlow — transaction-service.js
   Core Ledger Transaction Operations
   ========================================================= */

import { Repository } from '../storage/repository.js';

const STORE_NAME = 'transactions';

export const TransactionService = {
  async getAllTransactions() {
    const list = await Repository.getAll(STORE_NAME);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async addTransaction(data) {
    const record = {
      type: data.type || 'expense', // 'income' | 'expense' | 'transfer'
      amount: parseFloat(data.amount) || 0,
      category: data.category || 'General',
      date: data.date || new Date().toISOString().slice(0, 10),
      description: data.description || '',
      notes: data.notes || '',
      paymentMethod: data.paymentMethod || 'UPI',
      sourceType: data.sourceType || 'manual', // 'manual' | 'chit' | 'subscription' | 'bill'
      sourceId: data.sourceId || null
    };

    return await Repository.save(STORE_NAME, record);
  },

  async updateTransaction(id, data) {
    const existing = await Repository.getById(STORE_NAME, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      amount: parseFloat(data.amount || existing.amount)
    };

    return await Repository.save(STORE_NAME, updated);
  },

  async deleteTransaction(id) {
    return await Repository.softDelete(STORE_NAME, id);
  },

  async getSummaryMetrics() {
    const list = await this.getAllTransactions();

    const totalIncome = list
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = list
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;
    const savings = totalIncome > 0 ? (totalIncome - totalExpenses) : 0;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    return { totalIncome, totalExpenses, totalBalance, savings, savingsRate };
  },

  async getCategoryBreakdown() {
    const list = await this.getAllTransactions();
    const expenses = list.filter(t => t.type === 'expense');

    const catMap = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    const total = Object.values(catMap).reduce((s, a) => s + a, 0);

    return Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }
};
