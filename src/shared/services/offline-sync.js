// src/shared/services/offline-sync.js
// Shared offline sync manager

export const OfflineSync = {
  isOnline: navigator.onLine,

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

  async queueForSync(item) {
    if (!window.DB) { console.warn('DB service not loaded'); return; }
    await window.DB.addToSyncQueue({
      ...item,
      status: 'pending',
      timestamp: Date.now()
    });
  },

  async syncPendingItems() {
    if (!this.isOnline || !window.DB) return;
    const pending = await window.DB.getPendingSyncItems();
    if (!pending || pending.length === 0) return;
    console.log(`🔄 Syncing ${pending.length} offline items…`);
    for (const item of pending) {
      try {
        await this._executeSyncItem(item);
        await window.DB.markSyncItemDone(item.id);
      } catch (e) { console.error(`Failed to sync item ${item.id}:`, e); }
    }
    const remaining = await window.DB.getPendingSyncItems();
    if (remaining.length === 0) this.showToast('All data synced successfully', 'success', 2000);
  },

  async _executeSyncItem(item) {
    // placeholder – portal-specific implementation
    console.warn('_executeSyncItem not implemented for', item.collection);
  }
};

window.OfflineSync = OfflineSync;
