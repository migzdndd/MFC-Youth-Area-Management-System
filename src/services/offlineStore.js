/**
 * MFC Youth Area Management System - Production Offline IndexedDB Engine
 * Zero-dependency persistent outbox and cache for native mobile and desktop.
 */

const DB_NAME = 'mfc_youth_offline_v2';
const DB_VERSION = 1;
const STORE_READ = 'read_cache';
const STORE_MUTATIONS = 'mutation_queue';

let dbInstance = null;
const memoryStore = {
  read: new Map(),
  mutations: new Map()
};

function generateId(prefix = 'mut') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  if (typeof indexedDB === 'undefined') {
    console.warn('[OfflineStore] IndexedDB not available, using in-memory store.');
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_READ)) {
        db.createObjectStore(STORE_READ, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        const store = db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('[OfflineStore] Error opening IndexedDB:', request.error);
      resolve(null);
    };
  });
}

export const offlineStore = {
  async getReadCache(key) {
    try {
      const db = await openDB();
      if (!db) return memoryStore.read.get(key) || null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_READ, 'readonly');
        const store = tx.objectStore(STORE_READ);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn(`[OfflineStore] Failed reading cache for ${key}:`, e);
      return null;
    }
  },

  async setReadCache(key, data) {
    try {
      const db = await openDB();
      const record = { key, data, updated_at: Date.now() };

      if (!db) {
        memoryStore.read.set(key, data);
        return;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_READ, 'readwrite');
        const store = tx.objectStore(STORE_READ);
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn(`[OfflineStore] Failed saving cache for ${key}:`, e);
    }
  },

  async enqueueMutation({ endpoint, method = 'POST', payload = {}, headers = {} }) {
    const mutation = {
      id: generateId(),
      endpoint,
      method: method.toUpperCase(),
      payload,
      headers,
      status: 'pending',
      retryCount: 0,
      timestamp: Date.now(),
      error: null
    };

    try {
      const db = await openDB();
      if (!db) {
        memoryStore.mutations.set(mutation.id, mutation);
      } else {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
          tx.objectStore(STORE_MUTATIONS).put(mutation);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mfc:mutation-queued', { detail: mutation }));
      }
      return mutation;
    } catch (e) {
      console.error('[OfflineStore] Failed to enqueue mutation:', e);
      return null;
    }
  },

  async getPendingMutations() {
    try {
      const db = await openDB();
      if (!db) {
        return Array.from(memoryStore.mutations.values())
          .filter(m => m.status === 'pending' || m.status === 'failed')
          .sort((a, b) => a.timestamp - b.timestamp);
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readonly');
        const store = tx.objectStore(STORE_MUTATIONS);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || [])
            .filter(m => m.status === 'pending' || m.status === 'failed')
            .sort((a, b) => a.timestamp - b.timestamp);
          resolve(items);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn('[OfflineStore] Failed getting pending mutations:', e);
      return [];
    }
  },

  async markMutationStatus(id, status, error = null) {
    try {
      const db = await openDB();
      if (!db) {
        const mut = memoryStore.mutations.get(id);
        if (mut) {
          mut.status = status;
          if (error) mut.error = error;
          if (status === 'failed') mut.retryCount = (mut.retryCount || 0) + 1;
        }
        return;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
        const store = tx.objectStore(STORE_MUTATIONS);
        const req = store.get(id);
        req.onsuccess = () => {
          const item = req.result;
          if (item) {
            item.status = status;
            if (error) item.error = error;
            if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
            store.put(item);
          }
          resolve();
        };
        req.onerror = () => resolve();
      });
    } catch (e) {
      console.warn(`[OfflineStore] Failed updating mutation ${id}:`, e);
    }
  },

  async removeMutation(id) {
    try {
      const db = await openDB();
      if (!db) {
        memoryStore.mutations.delete(id);
        return;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
        tx.objectStore(STORE_MUTATIONS).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn(`[OfflineStore] Failed removing mutation ${id}:`, e);
    }
  },

  async getQueueCount() {
    const list = await this.getPendingMutations();
    return list.length;
  }
};
