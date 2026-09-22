/* =========================================================
   Money — js/services/report-service.js
   Reports Generator, File System Access API Backup & Importer
   ========================================================= */

import { TransactionService } from './transaction-service.js';
import { ChitService } from './chit-service.js';
import { BillService } from './bill-service.js';
import { BudgetService } from './budget-service.js';
import { Repository } from '../storage/repository.js';
import { idbGetAll, idbPut, idbClear } from '../storage/indexed-db.js';

export const ReportService = {
  // Generate filename: Money_Backup_YYYY-MM-DD_HH-mm.json
  getBackupFilename() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `Money_Backup_${dateStr}_${hours}-${mins}.json`;
  },

  async generateBackupPayload() {
    const transactions = await TransactionService.getAllTransactions();
    const chits = await ChitService.getAllChits();
    const chitAuctions = await idbGetAll('chit_auctions');
    const chitPayments = await idbGetAll('chit_payments');
    const bills = await BillService.getAllBills();
    const subscriptions = await BillService.getAllSubscriptions();
    const budgets = await BudgetService.getAllBudgets();
    const categories = await idbGetAll('categories');

    return {
      app: 'Money',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      summary: {
        transactionCount: transactions.length,
        chitCount: chits.length,
        billCount: bills.length,
        subscriptionCount: subscriptions.length,
        budgetCount: budgets.length
      },
      data: {
        transactions,
        chits,
        chitAuctions,
        chitPayments,
        bills,
        subscriptions,
        budgets,
        categories
      }
    };
  },

  async exportFullJSONBackup() {
    const payload = await this.generateBackupPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const filename = this.getBackupFilename();

    // Use File System Access API if supported
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        this.recordBackupTimestamp();
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
      }
    }

    // Fallback Blob Download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.recordBackupTimestamp();
    return true;
  },

  recordBackupTimestamp() {
    localStorage.setItem('money_last_backup_timestamp', new Date().toISOString());
  },

  async checkAndPerformAutoBackup() {
    const autoEnabled = localStorage.getItem('money_auto_backup_enabled') === 'true';
    if (!autoEnabled) return false;

    const lastBackupStr = localStorage.getItem('money_last_backup_timestamp');
    if (lastBackupStr) {
      const elapsed = Date.now() - new Date(lastBackupStr).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (elapsed < twentyFourHours) return false;
    }

    // Trigger auto backup payload download/save
    await this.exportFullJSONBackup();
    return true;
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
    a.download = `Money_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  parseBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || (!parsed.app && !parsed.summary)) {
        throw new Error('Invalid Money backup format');
      }
      return parsed;
    } catch (err) {
      throw new Error('Invalid or corrupted JSON backup file.');
    }
  },

  async restoreFromJSON(backupObject) {
    const data = backupObject.data;
    if (!data) throw new Error('Missing backup data payload');

    const storesToClear = ['transactions', 'chits', 'chit_auctions', 'chit_payments', 'bills', 'subscriptions', 'budgets', 'categories'];

    for (const storeName of storesToClear) {
      await idbClear(storeName);
      if (Array.isArray(data[storeName])) {
        for (const item of data[storeName]) {
          await Repository.save(storeName, item);
        }
      }
    }

    return true;
  }
};
