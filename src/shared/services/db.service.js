// src/shared/services/db.service.js
// IndexedDB wrapper – now exports DB for ES modules

const DB_NAME = 'QuickZOfflineDB';
const DB_VERSION = 3;   // bumped version to add new store

const STORES = {
  EXAMS: 'exams',
  RESULTS: 'results',
  QUESTIONS: 'questions',
  SYNC_QUEUE: 'syncQueue',
  OFFLINE_CACHE: 'offlineCache'   // NEW: for offline data caching
};

let dbPromise;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(STORES.EXAMS)) {
        db.createObjectStore(STORES.EXAMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.RESULTS)) {
        db.createObjectStore(STORES.RESULTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
        db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_status', 'status');
        store.createIndex('by_collection', 'collection');
      }
      // NEW: offline cache store
      if (!db.objectStoreNames.contains(STORES.OFFLINE_CACHE)) {
        db.createObjectStore(STORES.OFFLINE_CACHE, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
}

async function saveData(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function getData(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = key ? store.get(key) : store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteData(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function addToSyncQueue(operation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const item = {
      ...operation,
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0
    };
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingSyncItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('by_status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function markSyncItemDone(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = 'done';
        store.put(item);
      }
    };
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingByCollection(collectionName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('by_collection');
    const request = index.getAll(collectionName);
    request.onsuccess = () => {
      const pending = request.result.filter(item => item.status === 'pending');
      resolve(pending);
    };
    request.onerror = () => reject(request.error);
  });
}

const DB = {
  openDB,
  saveData,
  getData,
  deleteData,
  addToSyncQueue,
  getPendingSyncItems,
  markSyncItemDone,
  getPendingByCollection,
  STORES
};

// Attach globally for non-module scripts
window.DB = DB;

// Export for ES modules
export { DB };
