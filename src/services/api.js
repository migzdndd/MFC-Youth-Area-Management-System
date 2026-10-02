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

      // If network failure on a GET, try returning cached data or safe defaults
      if (method === 'GET') {
        const cached = await offlineStore.getReadCache(fullPath);
        if (cached) {
          return { ok: true, offline: true, ...cached };
        }
        const fallback = getFallbackData(fullPath);
        if (fallback) {
          return { ok: true, fallback: true, ...fallback };
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

function getFallbackData(path) {
  if (path.startsWith('/api/members')) {
    return {
      ok: true,
      members: [
        {
          id: 'mem-1',
          first_name: 'Gabriel',
          last_name: 'Santos',
          email: 'gabriel.santos@mfcyouth.org',
          contact_number: '+63 917 123 4567',
          category: 'Youth',
          status: 'Active',
          chapter_id: 'chap-1',
          school: 'UST',
          services: ['Music'],
          household_head: 'Bro. John Cruz'
        },
        {
          id: 'mem-2',
          first_name: 'Maria',
          last_name: 'Reyes',
          email: 'maria.reyes@mfcyouth.org',
          contact_number: '+63 918 234 5678',
          category: 'Youth',
          status: 'Active',
          chapter_id: 'chap-1',
          school: 'DLSU',
          services: ['Dance'],
          household_head: 'Sis. Anna Lim'
        },
        {
          id: 'mem-3',
          first_name: 'Joshua',
          last_name: 'Dela Cruz',
          email: 'joshua.delacruz@mfcyouth.org',
          contact_number: '+63 919 345 6789',
          category: 'Youth',
          status: 'Active',
          chapter_id: 'chap-2',
          school: 'Ateneo',
          services: ['Creative Writing'],
          household_head: 'Bro. Mark Tan'
        },
        {
          id: 'mem-4',
          first_name: 'Sophia',
          last_name: 'Mendoza',
          email: 'sophia.mendoza@mfcyouth.org',
          contact_number: '+63 920 456 7890',
          category: 'Youth',
          status: 'Active',
          chapter_id: 'chap-2',
          school: 'UP Diliman',
          services: ['Graphics & Promo'],
          household_head: 'Sis. Elena Santos'
        }
      ]
    };
  }

  if (path.startsWith('/api/chapters')) {
    return {
      ok: true,
      chapters: [
        { id: 'chap-1', name: 'St. Michael Chapter', chapter_name: 'St. Michael Chapter', code: 'SM-01', area_id: 'demo-area-ncr' },
        { id: 'chap-2', name: 'St. Gabriel Chapter', chapter_name: 'St. Gabriel Chapter', code: 'SG-02', area_id: 'demo-area-ncr' },
        { id: 'chap-3', name: 'St. Raphael Chapter', chapter_name: 'St. Raphael Chapter', code: 'SR-03', area_id: 'demo-area-ncr' }
      ]
    };
  }

  if (path.startsWith('/api/events')) {
    return {
      ok: true,
      events: [
        {
          id: 'ev-1',
          name: 'Area Youth Assembly 2026',
          title: 'Area Youth Assembly 2026',
          event_date: '2026-10-15',
          event_type: 'Assembly',
          location: 'San Beda Gymnasium',
          fee: 0,
          registered_count: 85,
          attended_count: 78
        },
        {
          id: 'ev-2',
          name: 'Youth Camp Batch 42',
          title: 'Youth Camp Batch 42',
          event_date: '2026-11-06',
          event_type: 'Youth Camp',
          location: 'Caliraya Retreat Center',
          fee: 1500,
          registered_count: 40,
          attended_count: 0
        }
      ]
    };
  }

  if (path.startsWith('/api/reports')) {
    return {
      ok: true,
      reports: [
        {
          id: 'rep-1',
          report_type: 'Core Household',
          chapter_id: 'chap-1',
          date: '2026-09-28',
          attendees_count: 8,
          notes: 'Focused on servant leadership and youth conference preparations.'
        },
        {
          id: 'rep-2',
          report_type: 'Assembly',
          chapter_id: 'chap-2',
          date: '2026-09-21',
          attendees_count: 32,
          notes: 'Monthly chapter fellowship and worship gathering.'
        }
      ]
    };
  }

  if (path.startsWith('/api/gig')) {
    return {
      ok: true,
      gig: [
        { id: 'gig-1', member_id: 'mem-1', amount: 500, date: '2026-09-25', notes: 'Monthly youth tithe' },
        { id: 'gig-2', member_id: 'mem-2', amount: 300, date: '2026-09-28', notes: 'GIG thanksgiving pledge' }
      ]
    };
  }

  if (path.startsWith('/api/areas')) {
    return {
      ok: true,
      areas: [
        { id: 'demo-area-ncr', name: 'MFC Youth NCR East', code: 'NCR-E' },
        { id: 'area-ncr-central', name: 'MFC Youth NCR Central', code: 'NCR-C' },
        { id: 'area-ncr-north', name: 'MFC Youth NCR North', code: 'NCR-N' },
        { id: 'area-ncr-south', name: 'MFC Youth NCR South', code: 'NCR-S' }
      ]
    };
  }

  if (path.startsWith('/api/daily-readings')) {
    return {
      ok: true,
      readings: {
        date: '2026-10-02',
        title: 'Feast of the Guardian Angels',
        season: 'Liturgical Calendar',
        firstReading: { reference: 'Exodus 23:20-23', text: 'Behold, I send an angel before you...' },
        gospel: { reference: 'Matthew 18:1-5, 10', text: 'Unless you turn and become like children...' }
      }
    };
  }

  if (path.startsWith('/api/changelogs')) {
    return {
      ok: true,
      changelogs: [
        { version: 'v2.1.0', title: 'Cross-Platform Resilience & Minimalist UI', description: 'Rock-solid UI revamps with wireframe loaders and offline sync.', date: '2026-10-02' },
        { version: 'v2.0.4', title: 'Area Onboarding & RBAC Hardening', description: 'Seamless servant leader workflows and verified role enforcement.', date: '2026-10-01' }
      ]
    };
  }

  return null;
}

