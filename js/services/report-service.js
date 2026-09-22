/* =========================================================
   MoneyFlow — report-service.js
   Reports Generator, CSV & JSON Exporter/Importer
   ========================================================= */

import { TransactionService } from './transaction-service.js';
import { ChitService } from './chit-service.js';
import { BillService } from './bill-service.js';
import { BudgetService } from './budget-service.js';
import { Repository } from '../storage/repository.js';
import { idbPut, idbClear } from '../storage/indexed-db.js';

export const ReportService = {
  async exportFullJSONBackup() {
    const transactions = await TransactionService.getAllTransactions();
    const chits = await ChitService.getAllChits();
    const bills = await BillService.getAllBills();
    const subscriptions = await BillService.getAllSubscriptions();
    const budgets = await BudgetService.getAllBudgets();

    const backupData = {
      app: 'MoneyFlow',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        chits,
        bills,
        subscriptions,
        budgets
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportTransactionsCSV() {
    const list = await TransactionService.getAllTransactions();
    let csv = 'ID,Date,Type,Category,Amount,Payment Method,Description,Notes\n';

    list.forEach(t => {
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      csv += `${t.id},${t.date},${t.type},${t.category},${t.amount},${t.paymentMethod},${desc},${notes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyflow-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importJSONBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.app || parsed.app !== 'MoneyFlow' || !parsed.data) {
        throw new Error('Invalid MoneyFlow backup format');
      }

      const { transactions, chits, bills, subscriptions, budgets } = parsed.data;

      if (Array.isArray(transactions)) {
        for (const t of transactions) await Repository.save('transactions', t);
      }
      if (Array.isArray(chits)) {
        for (const c of chits) await Repository.save('chits', c);
      }
      if (Array.isArray(bills)) {
        for (const b of bills) await Repository.save('bills', b);
      }
      if (Array.isArray(subscriptions)) {
        for (const s of subscriptions) await Repository.save('subscriptions', s);
      }
      if (Array.isArray(budgets)) {
        for (const bg of budgets) await Repository.save('budgets', bg);
      }

      return true;
    } catch (err) {
      console.error('Backup import error:', err);
      throw err;
    }
  }
};
