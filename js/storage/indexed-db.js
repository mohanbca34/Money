/* =========================================================
   Money — js/storage/indexed-db.js
   IndexedDB Engine (MoneyFlowDB v2 - High Performance Local Database)
   ========================================================= */

const DB_NAME = 'MoneyFlowDB';
const DB_VERSION = 2;

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Transactions
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('sourceType', 'sourceType', { unique: false });
      }

      // 2. Categories
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 3. Budgets
      if (!db.objectStoreNames.contains('budgets')) {
        const store = db.createObjectStore('budgets', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }

      // 4. Bills
      if (!db.objectStoreNames.contains('bills')) {
        const store = db.createObjectStore('bills', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // 5. Subscriptions
      if (!db.objectStoreNames.contains('subscriptions')) {
        const store = db.createObjectStore('subscriptions', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 6. Chits
      if (!db.objectStoreNames.contains('chits')) {
        const store = db.createObjectStore('chits', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 7. Chit Payments
      if (!db.objectStoreNames.contains('chit_payments')) {
        const store = db.createObjectStore('chit_payments', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('chitId', 'chitId', { unique: false });
      }

      // 8. Chit Auctions
      if (!db.objectStoreNames.contains('chit_auctions')) {
        const store = db.createObjectStore('chit_auctions', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('chitId', 'chitId', { unique: false });
      }

      // 9. Sync Queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 10. Metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

export async function idbGetAll(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetById(storeName, id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(storeName, record) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record);
    req.onsuccess = () => resolve(record.id);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(storeName, id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function idbClear(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
