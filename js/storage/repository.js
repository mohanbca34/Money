/* =========================================================
   MoneyFlow — repository.js
   Unified Data Repository with Standard Schema & Sync Enqueueing
   ========================================================= */

import { idbGetAll, idbGetById, idbPut, idbDelete } from './indexed-db.js';
import { SyncQueue } from './sync-queue.js';

export const Repository = {
  // Generate deterministic client UUID
  generateId(prefix = 'rec') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  },

  async getAll(storeName) {
    const records = await idbGetAll(storeName);
    // Filter out soft-deleted records for active UI operations
    return records.filter(r => !r.deletedAt);
  },

  async getById(storeName, id) {
    const record = await idbGetById(storeName, id);
    if (!record || record.deletedAt) return null;
    return record;
  },

  async save(storeName, item) {
    const now = new Date().toISOString();
    const existing = item.id ? await idbGetById(storeName, item.id) : null;

    const record = {
      ...item,
      id: item.id || this.generateId(storeName.slice(0, 3)),
      createdAt: existing ? existing.createdAt : (item.createdAt || now),
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    };

    await idbPut(storeName, record);

    // Enqueue to background sync
    const operation = existing ? 'update' : 'create';
    await SyncQueue.enqueue(storeName, record.id, operation, record);

    return record;
  },

  async softDelete(storeName, id) {
    const record = await idbGetById(storeName, id);
    if (!record) return false;

    const now = new Date().toISOString();
    record.deletedAt = now;
    record.updatedAt = now;
    record.syncStatus = 'pending';

    await idbPut(storeName, record);
    await SyncQueue.enqueue(storeName, id, 'delete', { id, deletedAt: now });

    return true;
  },

  async hardDelete(storeName, id) {
    await idbDelete(storeName, id);
  },

  // Called when cloud sync succeeds
  async markSynced(storeName, id) {
    const record = await idbGetById(storeName, id);
    if (record) {
      record.syncStatus = 'synced';
      await idbPut(storeName, record);
    }
  }
};
