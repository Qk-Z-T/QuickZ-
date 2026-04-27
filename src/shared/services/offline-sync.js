// src/shared/services/offline-sync.js
// Shared offline sync manager for both Student and Teacher portals

import { DB } from './db.service.js';

export const OfflineSync = {
  isOnline: navigator.onLine,
  _toastTimer: null,

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    if (!this.isOnline) this.showToast('You are offline. Changes will be synced later.', 'warning');
  },

  handleOnline() {
    this.isOnline = true;
    this.showToast('Back online! Syncing pending data…', 'success', 2000);
    this.syncPendingItems();
  },

  handleOffline() {
    this.isOnline = false;
    this.showToast('No internet connection', 'warning');
  },

  showToast(msg, type = 'info', duration = 3500) {
    const existing = document.querySelector('.offline-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `offline-toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2"></i>${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  /**
   * Queue any data operation for later sync.
   * @param {Object} item - { collection, operation, payload, docId }
   */
  async queueForSync(item) {
    if (!DB) {
      console.warn('DB service not loaded');
      return;
    }
    await DB.addToSyncQueue({
      ...item,
      status: 'pending',
      timestamp: Date.now()
    });
  },

  /**
   * Sync all pending items from IndexedDB to Firestore (or remote endpoint).
   * This is a base implementation; each portal can extend or override.
   */
  async syncPendingItems() {
    if (!this.isOnline || !DB) return;

    const pending = await DB.getPendingSyncItems();
    if (!pending || pending.length === 0) return;

    console.log(`🔄 Syncing ${pending.length} offline items…`);

    for (const item of pending) {
      try {
        // The actual sync logic depends on the collection and operation.
        // Portal‑specific logic can override this method or provide a handler.
        await this._executeSyncItem(item);
        await DB.markSyncItemDone(item.id);
      } catch (e) {
        console.error(`Failed to sync item ${item.id}:`, e);
      }
    }

    const remaining = await DB.getPendingSyncItems();
    if (remaining.length === 0) {
      this.showToast('All data synced successfully', 'success', 2000);
    }
  },

  /**
   * Placeholder – override in portal‑specific code.
   * @param {Object} item - the queued item
   */
  async _executeSyncItem(item) {
    // Example: if item.collection === 'attempts', call Firebase addDoc/updateDoc.
    // The actual implementation should be provided by the importing module.
    console.warn('_executeSyncItem not implemented for', item.collection);
  }
};

// Initialise and expose globally if needed
window.OfflineSync = OfflineSync;
