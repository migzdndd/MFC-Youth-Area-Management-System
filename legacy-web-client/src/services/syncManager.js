/**
 * MFC Youth AMS System - Outbox Sync Manager
 * Automatically syncs queued offline changes once internet connectivity is restored.
 * Connects to central batch offline sync gateway (POST /api/sync) and snapshot pull (GET /api/sync).
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

  /**
   * Pull complete Area database bundle from GET /api/sync
   * Stores chapters, services, memberServices, events, participants, reports, gig, and dashboard in read_cache.
   */
  async pullFullSync() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      return { ok: false, error: 'Cannot pull sync while offline.' };
    }

    const baseUrl = getApiBaseUrl();
    const session = getStoredSession();
    const token = session?.accessToken || '';
    const areaId = session?.areaId || null;

    try {
      const targetUrl = baseUrl ? `${baseUrl}/api/sync` : '/api/sync';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(areaId ? { 'X-MFC-Area-ID': areaId } : {})
      };

      const res = await fetch(targetUrl, { method: 'GET', headers });
      if (!res.ok) {
        throw new Error(`Full sync failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data?.ok) {
        // Cache datasets into offlineStore read_cache
        if (data.chapters) await offlineStore.setReadCache('chapters', data.chapters);
        if (data.services) await offlineStore.setReadCache('services', data.services);
        if (data.memberServices) await offlineStore.setReadCache('memberServices', data.memberServices);
        if (data.events) await offlineStore.setReadCache('events', data.events);
        if (data.participants) await offlineStore.setReadCache('participants', data.participants);
        if (data.reports) await offlineStore.setReadCache('reports', data.reports);
        if (data.gig) await offlineStore.setReadCache('gig', data.gig);
        if (data.dashboard) await offlineStore.setReadCache('dashboard', data.dashboard);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mfc:full-sync-completed', { detail: data }));
        }
      }
      return data;
    } catch (err) {
      console.warn('[SyncManager] Error pulling full sync:', err);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Batch push queued mutations to POST /api/sync
   * Slices up to 200 items per request, purges successful mutations, retains failures.
   */
  async syncNow() {
    if (this.isSyncing) return { success: false, reason: 'already_syncing' };

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      return { success: false, reason: 'offline' };
    }

    const pending = await offlineStore.getPendingMutations();
    if (!pending || pending.length === 0) {
      return { success: true, count: 0, syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let totalSynced = 0;
    let totalFailed = 0;

    const baseUrl = getApiBaseUrl();
    const session = getStoredSession();
    const token = session?.accessToken || '';
    const areaId = session?.areaId || null;

    // Process in batches of 200 items max
    const batchSize = 200;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);

      for (const m of batch) {
        await offlineStore.markMutationStatus(m.id, 'syncing');
      }

      const payload = {
        mutations: batch.map(m => {
          // Normalize endpoint string (e.g. '/api/participants' -> 'participants')
          const cleanEndpoint = String(m.endpoint || '').replace(/^\/api\//, '').replace(/^\//, '');
          return {
            id: m.id,
            endpoint: cleanEndpoint,
            method: m.method || 'POST',
            payload: m.payload || {}
          };
        })
      };

      try {
        const targetUrl = baseUrl ? `${baseUrl}/api/sync` : '/api/sync';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(areaId ? { 'X-MFC-Area-ID': areaId } : {})
        };

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          const failures = Array.isArray(result?.failures) ? result.failures : [];
          const failedMap = new Map(failures.map(f => [f.id, f.error]));

          for (const m of batch) {
            if (failedMap.has(m.id)) {
              const errMsg = failedMap.get(m.id) || 'Mutation rejected by server';
              await offlineStore.markMutationStatus(m.id, 'failed', errMsg);
              totalFailed++;
            } else {
              await offlineStore.removeMutation(m.id);
              totalSynced++;
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('mfc:mutation-synced', { detail: m }));
              }
            }
          }
        } else {
          // Entire batch failed or server error; fall back to individual sequential retry
          let batchErr = `Batch sync HTTP error ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.error) batchErr = errJson.error;
          } catch { /* ignored */ }

          for (const m of batch) {
            await offlineStore.markMutationStatus(m.id, 'failed', batchErr);
            totalFailed++;
          }
        }
      } catch (err) {
        console.warn('[SyncManager] Network error during batch sync:', err);
        for (const m of batch) {
          await offlineStore.markMutationStatus(m.id, 'failed', err.message);
          totalFailed++;
        }
        break; // Break loop if network dropped
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    return {
      success: totalFailed === 0,
      syncedCount: totalSynced,
      failedCount: totalFailed
    };
  }
}

export const syncManager = new SyncManager();
