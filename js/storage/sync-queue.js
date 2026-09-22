/* =========================================================
   MoneyFlow — sync-queue.js
   Background Sync Queue Manager
   ========================================================= */

import { idbGetAll, idbPut, idbDelete } from './indexed-db.js';

export const SyncQueue = {
  async enqueue(entity, entityId, operation, data = null) {
    const queueId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const syncItem = {
      id: queueId,
      entity,
      entityId,
      operation, // 'create' | 'update' | 'delete'
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending' // 'pending' | 'processing' | 'failed'
    };
    await idbPut('sync_queue', syncItem);
    return syncItem;
  },

  async getPending() {
    const items = await idbGetAll('sync_queue');
    return items
      .filter(item => item.status === 'pending')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async markProcessed(queueId) {
    await idbDelete('sync_queue', queueId);
  },

  async markFailed(queueId, errorMsg) {
    const items = await idbGetAll('sync_queue');
    const item = items.find(i => i.id === queueId);
    if (item) {
      item.retryCount += 1;
      item.status = item.retryCount >= 3 ? 'failed' : 'pending';
      item.lastError = errorMsg;
      await idbPut('sync_queue', item);
    }
  }
};
