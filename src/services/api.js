import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { offlineStore } from './offlineStore';

const DEFAULT_SERVER_URL = 'https://mfc-youth-area-management-web.vercel.app';

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const custom = localStorage.getItem('mfc_custom_api_url');
  if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');

  // Native Mobile (Capacitor) communicates directly with cloud backend via native HTTP
  if (Capacitor.isNativePlatform()) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');
    return DEFAULT_SERVER_URL;
  }

  // When running in desktop or web, if relative requests are used (e.g. Vite proxy), return empty string
  const isBrowser = typeof window !== 'undefined' && !window.__TAURI__ && !window.MFCDesktop;
  if (isBrowser) {
    return '';
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');

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

  // Offline mutation queueing only applies to operational records (participants and reports)
  const isOfflineMutationTarget =
    method !== 'GET' &&
    ['/api/participants', '/api/reports'].some(prefix => fullPath.startsWith(prefix));

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // If known offline and attempting a supported mutation, queue immediately
  if (!isOnline && isOfflineMutationTarget) {
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
  if (!isOnline && method === 'GET') {
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

      // If running on native Android / iOS, use native CapacitorHttp
      if (Capacitor.isNativePlatform()) {
        let capData = options.body;
        if (typeof capData === 'string') {
          try { capData = JSON.parse(capData); } catch { /* leave as string */ }
        }

        const capRes = await CapacitorHttp.request({
          url: targetUrl,
          method,
          headers,
          data: capData,
          connectTimeout: options.timeoutMs || 10000,
          readTimeout: options.timeoutMs || 10000
        });

        let data = capRes.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch { /* keep as string */ }
        }

        const isOk = capRes.status >= 200 && capRes.status < 300;
        if (!isOk) {
          if (capRes.status === 401 && (data?.code === 'INVALID_SESSION' || data?.code === 'AUTH_REQUIRED')) {
            clearStoredSession();
            window.dispatchEvent(new CustomEvent('mfc:auth-expired'));
          }
          const err = new Error(data?.error || `Request failed with status ${capRes.status}`);
          err.status = capRes.status;
          err.code = data?.code;
          err.data = data;
          throw err;
        }

        if (method === 'GET' && data) {
          offlineStore.setReadCache(fullPath, data);
        }

        return data;
      }

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
      // If network failure or abort on a supported mutation, queue offline
      if ((err instanceof TypeError || err?.name === 'AbortError') && isOfflineMutationTarget) {
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
      if (method === 'GET') {
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
