import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { offlineStore } from '../services/offlineStore';

/**
 * Hook to retrieve Daily Liturgical Scripture Readings synced to Philippine Standard Time (Asia/Manila).
 * Caches results locally in IndexedDB keyed by date (readings_YYYY-MM-DD).
 *
 * @param {string} [initialDate] Optional date in YYYY-MM-DD format. Defaults to current Philippine date.
 */
export function useReadings(initialDate = '') {
  const getPstDateString = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date());

      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      return `${y}-${m}-${d}`;
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [date, setDate] = useState(initialDate || getPstDateString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async (targetDate) => {
    const queryDate = targetDate || date || getPstDateString();
    const cacheKey = `readings_${queryDate}`;
    setLoading(true);
    setError(null);

    // 1. Check local IndexedDB read_cache
    try {
      const cached = await offlineStore.getReadCache(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        // Continue in background to refresh if online
      }
    } catch {
      // Ignore cache lookup error
    }

    // 2. Fetch from backend GET /api/daily-readings?date=...
    try {
      const res = await apiRequest(`/api/daily-readings?date=${encodeURIComponent(queryDate)}`);
      if (res?.ok) {
        setData(res);
        await offlineStore.setReadCache(cacheKey, res);
      } else if (!data) {
        setError(res?.error || 'Unable to load daily readings.');
      }
    } catch (err) {
      if (!data) {
        setError(err.message || 'Daily liturgical readings feed is currently unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }, [date, data]);

  useEffect(() => {
    fetchReadings(date);
  }, [date]);

  return {
    date,
    setDate,
    data,
    readings: data?.readings || [],
    celebration: data?.celebration || '',
    day: data?.day || '',
    translation: data?.translation || 'RSV-CE',
    loading,
    error,
    refresh: () => fetchReadings(date)
  };
}
