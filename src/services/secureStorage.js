/**
 * MFC Youth Area Management System - Secure Storage Engine
 * Provides persistent, cross-platform storage for Supabase auth sessions,
 * biometric credentials, offline tokens, and servant preferences.
 *
 * Supported Platforms:
 * - Native Mobile (iOS/Android): @capacitor/preferences
 * - Desktop (Electron/Tauri): localStorage + memory fallback
 * - Web Browsers: localStorage + graceful in-memory fallback
 */

const memoryFallback = new Map();

async function getPreferencesPlugin() {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      return Preferences;
    } catch {
      return null;
    }
  }
  return null;
}

export const secureStorage = {
  /**
   * Retrieve a stored string value
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    try {
      const pref = await getPreferencesPlugin();
      if (pref) {
        const { value } = await pref.get({ key });
        return value ?? null;
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }

      return memoryFallback.get(key) || null;
    } catch (err) {
      console.warn(`[SecureStorage] Error getting ${key}:`, err);
      return memoryFallback.get(key) || null;
    }
  },

  /**
   * Store a string value
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    try {
      const pref = await getPreferencesPlugin();
      if (pref) {
        await pref.set({ key, value: String(value) });
        return;
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(value));
        return;
      }

      memoryFallback.set(key, String(value));
    } catch (err) {
      console.warn(`[SecureStorage] Error setting ${key}:`, err);
      memoryFallback.set(key, String(value));
    }
  },

  /**
   * Remove a stored value
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    try {
      const pref = await getPreferencesPlugin();
      if (pref) {
        await pref.remove({ key });
        return;
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }

      memoryFallback.delete(key);
    } catch (err) {
      console.warn(`[SecureStorage] Error removing ${key}:`, err);
      memoryFallback.delete(key);
    }
  },

  /**
   * Clear all stored values
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const pref = await getPreferencesPlugin();
      if (pref) {
        await pref.clear();
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }

      memoryFallback.clear();
    } catch (err) {
      console.warn('[SecureStorage] Error clearing storage:', err);
      memoryFallback.clear();
    }
  },

  /**
   * Get parsed JSON helper
   */
  async getObject(key, fallbackValue = null) {
    const raw = await this.getItem(key);
    if (!raw) return fallbackValue;
    try {
      return JSON.parse(raw);
    } catch {
      return fallbackValue;
    }
  },

  /**
   * Store JSON helper
   */
  async setObject(key, value) {
    await this.setItem(key, JSON.stringify(value));
  }
};
