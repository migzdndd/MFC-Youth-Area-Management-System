/**
 * MFC Youth Area Management System - Outbox Sync Manager
 * Automatically syncs queued offline changes once internet connectivity is restored.
 */

import { offlineStore } from './offlineStore';
import { getStoredSession, getApiBaseUrl } from './api';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
    this.timer = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.scheduleSync(800));
      window.addEventListener('mfc:mutation-queued', () => this.notifyListeners());
    }
  }

  subscribe(listener) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  notifyListeners() {
    this.syncListeners.forEach((listener) => {
      try {
        listener({ isSyncing: this.isSyncing });
      } catch (e) {
        console.warn('[SyncManager] Listener error:', e);
      }
    });
  }

  scheduleSync(delayMs = 1000) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.syncNow();
    }, delayMs);
  }

  async syncNow() {
    if (this.isSyncing) return { success: false, reason: 'already_syncing' };

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      return { success: false, reason: 'offline' };
    }

    const pending = await offlineStore.getPendingMutations();
    if (!pending || pending.length === 0) {
      return { success: true, count: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let syncedCount = 0;
    let failedCount = 0;

    const baseUrl = getApiBaseUrl();
    const session = getStoredSession();
    const token = session?.accessToken || '';
    const areaId = session?.areaId || null;

    for (const item of pending) {
      try {
        await offlineStore.markMutationStatus(item.id, 'syncing');

        const targetUrl = baseUrl ? `${baseUrl}${item.endpoint}` : item.endpoint;
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(areaId ? { 'X-MFC-Area-ID': areaId } : {}),
          ...(item.headers || {})
        };

        const res = await fetch(targetUrl, {
          method: item.method,
          headers,
          body: item.payload ? JSON.stringify(item.payload) : undefined
        });

        if (res.ok) {
          await offlineStore.removeMutation(item.id);
          syncedCount++;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mfc:mutation-synced', { detail: item }));
          }
        } else {
          let errText = `Server responded with ${res.status}`;
          try {
            const errData = await res.json();
            if (errData?.error) errText = errData.error;
          } catch { /* ignored */ }

          await offlineStore.markMutationStatus(item.id, 'failed', errText);
          failedCount++;
        }
      } catch (err) {
        console.warn(`[SyncManager] Network error syncing mutation ${item.id}:`, err);
        await offlineStore.markMutationStatus(item.id, 'failed', err.message);
        failedCount++;
        // If connection dropped during loop, break early
        break;
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    return { success: failedCount === 0, syncedCount, failedCount };
  }
}

export const syncManager = new SyncManager();
