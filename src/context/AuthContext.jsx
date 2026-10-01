import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredSession, saveStoredSession, clearStoredSession } from '../services/api';
import { offlineStore } from '../services/offlineStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const [mfaState, setMfaState] = useState(null); // { tempToken, factorId, email, user, remember }

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
    const cleanEmail = String(email || '').trim().toLowerCase();

    // 1. Quick demo shortcut (same as website auth.js)
    if (cleanEmail === 'admin@mfcyouth.local' && password === 'admin123') {
      const demoSession = {
        userId: 'demo-admin-id',
        memberId: 1,
        email: cleanEmail,
        name: 'Demo Servant Leader',
        role: 'area_servant',
        areaId: 'demo-area-ncr',
        areaName: 'MFC Youth NCR East',
        chapterId: null,
        needsAreaSetup: false,
        accessToken: 'demo-token-active',
        refreshToken: 'demo-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 86400 * 7,
        backendAuth: false,
        demo: true
      };
      saveStoredSession(demoSession, rememberMe);
      setSession(demoSession);
      return { ok: true, session: demoSession };
    }

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password, remember: rememberMe })
      });

      // 2. Handle MFA Challenge requirement
      if (res?.mfaRequired) {
        setMfaState({
          tempToken: res.tempSession?.accessToken || res.tempSession?.access_token || res.tempToken,
          factorId: res.factorId,
          email: cleanEmail,
          user: res.user,
          remember: rememberMe
        });
        return { ok: false, mfaRequired: true };
      }

      if (!res?.ok && !res?.session) {
        return { ok: false, error: res?.error || 'Login failed.' };
      }

      const user = res.user || {};
      const serverSession = res.session || {};
      const accessToken = serverSession.accessToken || serverSession.access_token || res.accessToken;
      const refreshToken = serverSession.refreshToken || serverSession.refresh_token || res.refreshToken;
      const role = String(user.role || res.profile?.role || 'member').toLowerCase();
      const areaId = user.areaId || user.area_id || res.profile?.area_id || null;
      const areaName = res.areaName || user.areaName || '';
      
      // Exact website logic: Leadership accounts without an assigned area require Area Setup
      const isLeadership = ['national_coordinator', 'couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(role);
      const needsAreaSetup = isLeadership && !areaId;

      const newSession = {
        userId: user.id || null,
        memberId: user.memberId || user.member_id || null,
        email: user.email || cleanEmail,
        name: user.name || user.email || 'Servant Leader',
        role,
        areaId,
        areaName,
        chapterId: user.chapterId || user.chapter_id || null,
        mustChangePassword: user.mustChangePassword === true,
        needsAreaSetup,
        accessToken,
        refreshToken,
        expiresAt: serverSession.expiresAt || serverSession.expires_at || null,
        backendAuth: true,
        demo: false
      };

      saveStoredSession(newSession, rememberMe);
      setSession(newSession);
      return { ok: true, session: newSession, needsAreaSetup };
    } catch (err) {
      // 3. Fallback to cached demo users if offline or network connection issue
      try {
        const rawUsers = localStorage.getItem('mfc_demo_users');
        if (rawUsers) {
          const offlineUsers = JSON.parse(rawUsers);
          const localUser = offlineUsers.find(
            u => String(u.email || '').trim().toLowerCase() === cleanEmail && u.password === password
          );

          if (localUser) {
            const role = String(localUser.role || 'member').toLowerCase();
            const localSession = {
              userId: localUser.id || 'offline-user',
              memberId: localUser.memberId || null,
              email: localUser.email,
              name: localUser.name || localUser.email,
              role,
              areaId: localUser.areaId || null,
              areaName: localUser.areaName || 'Offline Area',
              chapterId: localUser.chapterId || null,
              needsAreaSetup: role !== 'member' && !localUser.areaId,
              accessToken: 'offline-local-token',
              backendAuth: false,
              demo: true
            };
            saveStoredSession(localSession, rememberMe);
            setSession(localSession);
            return { ok: true, session: localSession, offline: true };
          }
        }
      } catch {
        // Continue to error return
      }

      return { ok: false, error: err.message || 'Unable to connect to login server. Please verify your credentials.' };
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

      const user = res.user || {};
      const serverSession = res.session || {};
      const accessToken = serverSession.accessToken || serverSession.access_token || res.accessToken;
      const role = String(user.role || 'member').toLowerCase();
      const areaId = user.areaId || user.area_id || null;
      const isLeadership = ['national_coordinator', 'couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(role);
      const needsAreaSetup = isLeadership && !areaId;

      const newSession = {
        userId: user.id || null,
        memberId: user.memberId || null,
        email: user.email || mfaState.email,
        name: user.name || user.email || 'Servant Leader',
        role,
        areaId,
        areaName: res.areaName || user.areaName || '',
        chapterId: user.chapterId || null,
        mustChangePassword: user.mustChangePassword === true,
        needsAreaSetup,
        accessToken,
        refreshToken: serverSession.refreshToken || serverSession.refresh_token || null,
        expiresAt: serverSession.expiresAt || null,
        backendAuth: true,
        demo: false
      };

      saveStoredSession(newSession, mfaState.remember !== false);
      setSession(newSession);
      setMfaState(null);
      return { ok: true, session: newSession };
    } catch (err) {
      return { ok: false, error: err.message || 'Verification failed.' };
    }
  };

  /**
   * Connect active leadership account to an existing Area
   */
  const selectArea = async (areaId) => {
    if (!areaId) return { ok: false, error: 'Area ID is required.' };
    try {
      const payload = await apiRequest('/api/areas/select', {
        method: 'POST',
        body: JSON.stringify({ areaId })
      });

      if (!payload?.ok) {
        return { ok: false, error: payload?.error || 'Failed to select Area.' };
      }

      const area = payload.area || {};
      const updated = {
        ...session,
        areaId: area.id || areaId,
        areaName: area.name || area.code || 'Selected Area',
        memberId: payload.profile?.member_id ?? payload.member?.id ?? session?.memberId ?? null,
        chapterId: payload.profile?.chapter_id ?? session?.chapterId ?? null,
        needsAreaSetup: false
      };

      saveStoredSession(updated, true);
      setSession(updated);
      return { ok: true, area };
    } catch (err) {
      return { ok: false, error: err.message || 'Unable to connect to the selected Area.' };
    }
  };

  /**
   * Create a new Area-based database account and link current servant leader
   */
  const createArea = async (name) => {
    const cleanName = String(name || '').trim();
    if (cleanName.length < 3) {
      return { ok: false, error: 'Please enter a valid Area name (at least 3 characters).' };
    }

    try {
      const payload = await apiRequest('/api/areas', {
        method: 'POST',
        body: JSON.stringify({ name: cleanName })
      });

      if (!payload?.ok) {
        return { ok: false, error: payload?.error || 'Failed to create Area.' };
      }

      const area = payload.area || {};
      const updated = {
        ...session,
        areaId: area.id,
        areaName: area.name || cleanName,
        memberId: payload.profile?.member_id ?? payload.member?.id ?? session?.memberId ?? null,
        chapterId: payload.profile?.chapter_id ?? session?.chapterId ?? null,
        needsAreaSetup: false
      };

      saveStoredSession(updated, true);
      setSession(updated);
      return { ok: true, area };
    } catch (err) {
      return { ok: false, error: err.message || 'Unable to create the Area.' };
    }
  };

  /**
   * Switch between areas (allowed for coordinators)
   */
  const switchArea = async (areaId, areaName) => {
    if (!session) return;
    const updated = {
      ...session,
      areaId,
      areaName: areaName || session.areaName,
      needsAreaSetup: false
    };
    saveStoredSession(updated, true);
    setSession(updated);

    try {
      await apiRequest('/api/areas/select', {
        method: 'POST',
        body: JSON.stringify({ areaId })
      });
    } catch (e) {
      console.warn('[Auth] Server area switch sync notice:', e);
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

  const logout = async () => {
    try {
      if (session?.accessToken && session?.backendAuth) {
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
        user: session?.user || { email: session?.email, name: session?.name },
        role: session?.role || 'member',
        areaId: session?.areaId,
        areaName: session?.areaName,
        needsAreaSetup: session?.needsAreaSetup === true,
        isAuthenticated: !!session?.accessToken,
        loading,
        mfaState,
        setMfaState,
        login,
        verifyMfa,
        selectArea,
        createArea,
        switchArea,
        registerAdmin,
        claimAccount,
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
