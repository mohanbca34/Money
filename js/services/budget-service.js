/* =========================================================
   MoneyFlow — budget-service.js
   Category Budgets & Real-time Spending Alerts
   ========================================================= */

import { Repository } from '../storage/repository.js';
import { TransactionService } from './transaction-service.js';

const STORE_BUDGETS = 'budgets';

export const BudgetService = {
  async getAllBudgets() {
    const list = await Repository.getAll(STORE_BUDGETS);
    return list;
  },

  async addBudget(data) {
    const record = {
      category: data.category || 'Food',
      limitAmount: parseFloat(data.limitAmount) || 5000,
      period: data.period || 'monthly',
      notes: data.notes || ''
    };
    return await Repository.save(STORE_BUDGETS, record);
  },

  async updateBudget(id, data) {
    const existing = await Repository.getById(STORE_BUDGETS, id);
    if (!existing) return null;
    return await Repository.save(STORE_BUDGETS, {
      ...existing,
      ...data,
      limitAmount: parseFloat(data.limitAmount || existing.limitAmount)
    });
  },

  async deleteBudget(id) {
    return await Repository.softDelete(STORE_BUDGETS, id);
  },

  async getBudgetAnalysis() {
    const budgets = await this.getAllBudgets();
    const transactions = await TransactionService.getAllTransactions();

    const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr));

    return budgets.map(b => {
      const spent = monthExpenses
        .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      const limit = b.limitAmount;
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      let status = 'normal'; // 'normal' | 'warning' | 'exceeded'
      let colorClass = 'progress-green';
      if (percentage >= 100) {
        status = 'exceeded';
        colorClass = 'progress-red';
      } else if (percentage >= 75) {
        status = 'warning';
        colorClass = 'progress-amber';
      }

      return {
        ...b,
        spent,
        remaining,
        percentage,
        status,
        colorClass
      };
    });
  }
};
