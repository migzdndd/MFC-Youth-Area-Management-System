import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredSession, saveStoredSession, clearStoredSession } from '../services/api';
import { offlineStore } from '../services/offlineStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const [mfaState, setMfaState] = useState(null); // { tempToken, factorId, email }

  useEffect(() => {
    // When session changes, save locally in offline read_cache so offline session is guaranteed
    if (session) {
      offlineStore.setReadCache('active_session', session);
    } else {
      offlineStore.getReadCache('active_session').then((cached) => {
        if (cached && !session) {
          // If offline and no in-memory session, restore cached session
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setSession(cached);
          }
        }
      });
    }
    setLoading(false);

    const handleAuthExpired = () => {
      setSession(null);
    };

    window.addEventListener('mfc:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('mfc:auth-expired', handleAuthExpired);
  }, [session]);

  const login = async (email, password, rememberMe = true) => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        if (res.code === 'MFA_REQUIRED') {
          setMfaState({
            tempToken: res.tempToken,
            factorId: res.factorId,
            email
          });
          return { ok: false, mfaRequired: true };
        }
        return { ok: false, error: res.error || 'Login failed.' };
      }

      const newSession = {
        accessToken: res.session?.access_token || res.accessToken,
        refreshToken: res.session?.refresh_token || res.refreshToken,
        user: res.user || res.profile,
        role: res.user?.role || res.profile?.access_level || 'member',
        areaId: res.user?.area_id || res.profile?.area_id,
        areaName: res.areaName || '',
        chapterId: res.user?.chapter_id || res.profile?.chapter_id,
        backendAuth: true
      };

      saveStoredSession(newSession, rememberMe);
      setSession(newSession);
      return { ok: true, session: newSession };
    } catch (err) {
      return { ok: false, error: err.message || 'Login error.' };
    }
  };

  const verifyMfa = async (code) => {
    if (!mfaState?.tempToken) {
      return { ok: false, error: 'MFA session expired. Please sign in again.' };
    }

    try {
      const res = await apiRequest('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mfaState.tempToken}`
        },
        body: JSON.stringify({
          factorId: mfaState.factorId,
          code
        })
      });

      if (!res.ok) {
        return { ok: false, error: res.error || 'Invalid verification code.' };
      }

      const newSession = {
        accessToken: res.session?.access_token,
        refreshToken: res.session?.refresh_token,
        user: res.user,
        role: res.user?.role || 'member',
        areaId: res.user?.area_id,
        areaName: res.areaName || '',
        chapterId: res.user?.chapter_id,
        backendAuth: true
      };

      saveStoredSession(newSession, true);
      setSession(newSession);
      setMfaState(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Verification failed.' };
    }
  };

  const registerAdmin = async (data) => {
    try {
      const res = await apiRequest('/api/auth/admin-register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res;
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed.' };
    }
  };

  const claimAccount = async (data) => {
    try {
      const res = await apiRequest('/api/auth/member-claim', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res;
    } catch (err) {
      return { ok: false, error: err.message || 'Account claim failed.' };
    }
  };

  const switchArea = async (areaId, areaName) => {
    if (!session) return;
    const updated = {
      ...session,
      areaId,
      areaName: areaName || session.areaName
    };
    saveStoredSession(updated, true);
    setSession(updated);
    try {
      await apiRequest('/api/areas/select', {
        method: 'POST',
        body: JSON.stringify({ areaId })
      });
    } catch (e) {
      console.warn('[Auth] Server area switch sync warning:', e);
    }
  };

  const logout = async () => {
    try {
      if (session?.accessToken) {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      clearStoredSession();
      setSession(null);
      setMfaState(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user,
        role: session?.role || 'member',
        areaId: session?.areaId,
        areaName: session?.areaName,
        isAuthenticated: !!session?.accessToken,
        loading,
        mfaState,
        setMfaState,
        login,
        verifyMfa,
        registerAdmin,
        claimAccount,
        switchArea,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
