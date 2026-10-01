/**
 * MFC Youth Area Management System - Smart Native API Client
 * Seamlessly manages online cloud calls, automatic caching, and offline outbox queuing.
 */

import { offlineStore } from './offlineStore';

const DEFAULT_SERVER_URL = 'http://localhost:3001';

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const custom = localStorage.getItem('mfc_custom_api_url');
  if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');

  // If in web browser on a production domain, use relative requests
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1' && !window.Capacitor?.isNativePlatform() && !window.__TAURI__) {
    return '';
  }

  return DEFAULT_SERVER_URL;
}

export function setCustomApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('mfc_custom_api_url');
  } else {
    localStorage.setItem('mfc_custom_api_url', url.trim());
  }
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('mfc_demo_session') || sessionStorage.getItem('mfc_demo_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session, rememberMe = true) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(session);
  if (rememberMe) {
    localStorage.setItem('mfc_demo_session', serialized);
    sessionStorage.removeItem('mfc_demo_session');
  } else {
    sessionStorage.setItem('mfc_demo_session', serialized);
    localStorage.removeItem('mfc_demo_session');
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mfc_demo_session');
  sessionStorage.removeItem('mfc_demo_session');
}

const activeRequests = new Map();

export async function apiRequest(endpoint, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = normalizedPath.startsWith('/api') ? normalizedPath : `/api${normalizedPath}`;
  const baseUrl = getApiBaseUrl();
  const targetUrl = baseUrl ? `${baseUrl}${fullPath}` : fullPath;

  const session = getStoredSession();
  const token = session?.accessToken || '';
  const areaId = session?.areaId || null;

  const isMutation = method !== 'GET';
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // If known offline and attempting a mutation, queue immediately
  if (!isOnline && isMutation) {
    let payload = options.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { /* leave as string */ }
    }

    const queued = await offlineStore.enqueueMutation({
      endpoint: fullPath,
      method,
      payload,
      headers: options.headers
    });

    return {
      ok: true,
      offline: true,
      queued: true,
      id: queued?.id,
      message: 'Saved offline. Changes will sync automatically when back online.'
    };
  }

  // If known offline and making a GET request, return cached data
  if (!isOnline && !isMutation) {
    const cached = await offlineStore.getReadCache(fullPath);
    if (cached) {
      return { ok: true, offline: true, ...cached };
    }
  }

  // Deduplicate concurrent GET requests
  const dedupeKey = method === 'GET' ? `${fullPath}:${token}:${areaId}` : null;
  if (dedupeKey && activeRequests.has(dedupeKey)) {
    return activeRequests.get(dedupeKey);
  }

  const execute = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(areaId ? { 'X-MFC-Area-ID': areaId } : {}),
        ...(options.headers || {})
      };

      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
        cache: 'no-store',
        headers
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = { ok: false, error: 'Invalid response from server.' };
      }

      if (!response.ok) {
        if (response.status === 401 && (data?.code === 'INVALID_SESSION' || data?.code === 'AUTH_REQUIRED')) {
          clearStoredSession();
          window.dispatchEvent(new CustomEvent('mfc:auth-expired'));
        }
        const err = new Error(data?.error || `Request failed with status ${response.status}`);
        err.status = response.status;
        err.code = data?.code;
        err.data = data;
        throw err;
      }

      // If GET was successful, update the offline read cache
      if (method === 'GET' && data) {
        offlineStore.setReadCache(fullPath, data);
      }

      return data;
    } catch (err) {
      // If network failure or abort on a mutation, queue offline
      if ((err instanceof TypeError || err?.name === 'AbortError') && isMutation) {
        let payload = options.body;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch { /* leave as string */ }
        }

        const queued = await offlineStore.enqueueMutation({
          endpoint: fullPath,
          method,
          payload,
          headers: options.headers
        });

        return {
          ok: true,
          offline: true,
          queued: true,
          id: queued?.id,
          message: 'Saved offline. Changes will sync automatically when back online.'
        };
      }

      // If network failure on a GET, try returning cached data
      if (!isMutation) {
        const cached = await offlineStore.getReadCache(fullPath);
        if (cached) {
          return { ok: true, offline: true, ...cached };
        }
      }

      throw err;
    } finally {
      clearTimeout(timeout);
    }
  };

  if (!dedupeKey) return execute();

  const promise = execute().finally(() => {
    activeRequests.delete(dedupeKey);
  });
  activeRequests.set(dedupeKey, promise);
  return promise;
}
