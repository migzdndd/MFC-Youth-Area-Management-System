/**
 * MFC Youth Area Management System - Supabase Client Singleton
 * Direct live connection to Supabase PostgreSQL backend with Row-Level Security (RLS)
 * and secure cross-platform session storage.
 */

import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

// Resolve environment variables across Vite, Web, and Native environments
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  '';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY)) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_PROJECT_REF') && 
  !supabaseAnonKey.includes('YOUR_KEY')
);

/**
 * Storage adapter conforming to Supabase GoTrue Auth storage interface
 */
const authStorageAdapter = {
  getItem: (key) => secureStorage.getItem(key),
  setItem: (key, value) => secureStorage.setItem(key, value),
  removeItem: (key) => secureStorage.removeItem(key)
};

/**
 * Supabase client instance
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: typeof window !== 'undefined'
      },
      global: {
        headers: {
          'X-Client-Info': 'mfc-youth-ams-app'
        }
      }
    })
  : null;

/**
 * Check connectivity to Supabase
 * @returns {Promise<{ ok: boolean, latencyMs?: number, message: string }>}
 */
export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'Supabase credentials are not configured in environment variables.'
    };
  }

  const startTime = Date.now();
  try {
    const { error } = await supabase.from('chapters').select('id').limit(1);
    const latencyMs = Date.now() - startTime;
    if (error && error.code !== 'PGRST116') {
      return { ok: false, message: error.message, code: error.code };
    }
    return { ok: true, latencyMs, message: 'Connected to live Supabase backend' };
  } catch (err) {
    return { ok: false, message: err.message || 'Network error reaching Supabase' };
  }
}

/**
 * Type-safe table helpers for MFC Youth AMS schema
 */
export const db = {
  members: () => supabase?.from('members'),
  chapters: () => supabase?.from('chapters'),
  events: () => supabase?.from('events'),
  attendance: () => supabase?.from('attendance'),
  litMinistries: () => supabase?.from('lit_ministries'),
  serviceLogs: () => supabase?.from('service_logs'),
  gigContributions: () => supabase?.from('gig_contributions')
};
