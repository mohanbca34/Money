/* =========================================================
   Money — js/firebase/sync.js
   Idempotent Firestore Background Sync, Cloud Recovery & Data Reset
   ========================================================= */

import { db } from './config.js';
import { FirebaseAuth } from './auth.js';
import { SyncQueue } from '../storage/sync-queue.js';
import { Repository } from '../storage/repository.js';
import { idbPut, idbClear } from '../storage/indexed-db.js';
import {
  doc, setDoc, deleteDoc, collection, getDocs
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

let isSyncing = false;

export const CloudSync = {
  // Synchronize pending local operations to Firestore (Idempotent per-user isolation)
  async syncPending() {
    if (isSyncing || !navigator.onLine || !db) return;

    const user = FirebaseAuth.getUser();
    if (!user) return;

    isSyncing = true;
    try {
      const pendingItems = await SyncQueue.getPending();

      for (const item of pendingItems) {
        if (!item.entity || !item.entityId) continue;
        const docRef = doc(db, 'users', user.uid, item.entity, item.entityId);

        try {
          if (item.operation === 'delete') {
            await deleteDoc(docRef);
          } else {
            // Strip client-only temporary flags if any
            const syncPayload = { ...item.data, syncStatus: 'synced' };
            await setDoc(docRef, syncPayload, { merge: true });
          }

          // Mark record as synced in local IndexedDB
          await Repository.markSynced(item.entity, item.entityId);
          await SyncQueue.markProcessed(item.id);
        } catch (err) {
          console.warn(`Firestore sync error for ${item.entity}/${item.entityId}:`, err);
          await SyncQueue.markFailed(item.id, err.message);
        }
      }
    } finally {
      isSyncing = false;
    }
  },

  // Cloud Recovery: Download user's cloud documents from Firestore on login
  async restoreUserDataFromCloud(uid) {
    if (!db || !uid) return { success: false, count: 0 };

    const collectionsToRestore = [
      'transactions', 'categories', 'budgets', 'bills',
      'subscriptions', 'chits', 'chit_payments', 'chit_auctions', 'metadata'
    ];

    let totalRestored = 0;
    try {
      for (const colName of collectionsToRestore) {
        const colRef = collection(db, 'users', uid, colName);
        const snapshot = await getDocs(colRef);

        await idbClear(colName);
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          await idbPut(colName, { ...data, id: docSnap.id, syncStatus: 'synced' });
          totalRestored++;
        }
      }
      return { success: true, count: totalRestored };
    } catch (err) {
      console.error('Cloud data recovery failed:', err);
      return { success: false, count: 0, error: err.message };
    }
  },

  // Reset Account Data: Permanently clear user's cloud Firestore data & local IndexedDB
  async resetAccountData(uid) {
    if (!uid) throw new Error('User authentication context required.');

    const collectionsToClear = [
      'transactions', 'categories', 'budgets', 'bills',
      'subscriptions', 'chits', 'chit_payments', 'chit_auctions', 'metadata'
    ];

    // 1. Delete Firestore cloud documents if online
    if (db && navigator.onLine) {
      for (const colName of collectionsToClear) {
        try {
          const colRef = collection(db, 'users', uid, colName);
          const snapshot = await getDocs(colRef);
          for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, 'users', uid, colName, docSnap.id));
          }
        } catch (err) {
          console.warn(`Firestore collection delete note [${colName}]:`, err);
        }
      }
    }

    // 2. Clear local IndexedDB stores
    for (const storeName of collectionsToClear) {
      await idbClear(storeName);
    }
    await idbClear('sync_queue');

    return true;
  }
};
