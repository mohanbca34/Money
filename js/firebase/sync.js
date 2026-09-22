/* =========================================================
   MoneyFlow — firebase/sync.js
   Background Firestore Sync Engine & Cloud Recovery
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
  // Sync pending local operations to Firestore
  async syncPending() {
    if (isSyncing || !navigator.onLine || !db) return;

    const user = FirebaseAuth.getUser();
    if (!user || user.isGuest) return;

    isSyncing = true;
    try {
      const pendingItems = await SyncQueue.getPending();

      for (const item of pendingItems) {
        const docRef = doc(db, 'users', user.uid, item.entity, item.entityId);

        try {
          if (item.operation === 'delete') {
            await deleteDoc(docRef);
          } else {
            await setDoc(docRef, item.data, { merge: true });
          }

          // Mark record as synced locally
          await Repository.markSynced(item.entity, item.entityId);
          await SyncQueue.markProcessed(item.id);
        } catch (err) {
          console.warn(`Sync failed for ${item.entity}/${item.entityId}:`, err);
          await SyncQueue.markFailed(item.id, err.message);
        }
      }
    } finally {
      isSyncing = false;
    }
  },

  // Disaster Recovery: Rebuild IndexedDB from Firestore cloud data upon fresh login
  async restoreUserDataFromCloud(uid) {
    if (!db || !uid) return false;

    const collectionsToRestore = [
      'transactions', 'categories', 'budgets', 'bills',
      'subscriptions', 'chits', 'chit_payments', 'chit_auctions'
    ];

    try {
      for (const colName of collectionsToRestore) {
        const colRef = collection(db, 'users', uid, colName);
        const snapshot = await getDocs(colRef);

        await idbClear(colName);
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          await idbPut(colName, { ...data, syncStatus: 'synced' });
        }
      }
      return true;
    } catch (err) {
      console.error('Cloud data restoration failed:', err);
      return false;
    }
  }
};
