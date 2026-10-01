import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredSession, saveStoredSession, clearStoredSession } from '../services/api';
import { offlineStore } from '../services/offlineStore';

const AuthContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://desmhxtmnmfybrsdwhwz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rUW_5JS39kngwMT6bY5b4w_Se_Lo3eT';

const LEADERSHIP_ROLES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant'
]);

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

    // 2. Try primary serverless/proxy endpoint first
    let primarySucceeded = false;
    let primaryError = null;

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password, remember: rememberMe })
      });

      // Handle MFA Challenge requirement
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

      if (res?.ok && (res?.session || res?.accessToken || res?.user)) {
        const user = res.user || {};
        const serverSession = res.session || {};
        const accessToken = serverSession.accessToken || serverSession.access_token || res.accessToken || 'session-bearer-token';
        const refreshToken = serverSession.refreshToken || serverSession.refresh_token || res.refreshToken || '';
        const role = String(user.role || res.profile?.role || 'member').toLowerCase();
        const areaId = user.areaId || user.area_id || res.profile?.area_id || null;
        const areaName = res.areaName || user.areaName || '';

        // Leadership accounts without an assigned area require Area Setup
        const isLeadership = LEADERSHIP_ROLES.has(role);
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
        primarySucceeded = true;
        return { ok: true, session: newSession, needsAreaSetup };
      }

      if (res?.error) {
        primaryError = res.error;
      }
    } catch (apiErr) {
      primaryError = apiErr.message;
      console.warn('[AuthContext] API login attempt notice:', apiErr);
    }

    if (primarySucceeded) return;

    // 3. Direct Supabase Auth Fallback (bypasses serverless proxy issues & CORS)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email: cleanEmail, password })
        });

        if (authRes.ok) {
          const authData = await authRes.json();
          const token = authData.access_token;
          const authUser = authData.user || {};

          // Fetch profiles row with this user's token
          let profile = null;
          try {
            const profRes = await fetch(
              `${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.id}&select=id,member_id,role,area_id,chapter_id,must_change_password,is_active`,
              {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            if (profRes.ok) {
              const profList = await profRes.json();
              if (Array.isArray(profList) && profList.length > 0) {
                profile = profList[0];
              }
            }
          } catch (profErr) {
            console.warn('[AuthContext] Direct profile fetch notice:', profErr);
          }

          let areaName = '';
          if (profile?.area_id) {
            try {
              const areaRes = await fetch(
                `${SUPABASE_URL}/rest/v1/areas?id=eq.${profile.area_id}&select=id,name,code`,
                {
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              if (areaRes.ok) {
                const areaList = await areaRes.json();
                if (Array.isArray(areaList) && areaList.length > 0) {
                  areaName = areaList[0].name || areaList[0].code || '';
                }
              }
            } catch (areaErr) {
              console.warn('[AuthContext] Direct area fetch notice:', areaErr);
            }
          }

          const role = String(profile?.role || authUser.user_metadata?.role || 'member').toLowerCase();
          const areaId = profile?.area_id || null;
          const isLeadership = LEADERSHIP_ROLES.has(role);
          const needsAreaSetup = isLeadership && !areaId;

          const newSession = {
            userId: authUser.id,
            memberId: profile?.member_id || null,
            email: authUser.email || cleanEmail,
            name: authUser.user_metadata?.display_name || authUser.user_metadata?.name || authUser.email || 'Servant Leader',
            role,
            areaId,
            areaName,
            chapterId: profile?.chapter_id || null,
            mustChangePassword: profile?.must_change_password === true,
            needsAreaSetup,
            accessToken: token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
            backendAuth: true,
            demo: false
          };

          saveStoredSession(newSession, rememberMe);
          setSession(newSession);
          return { ok: true, session: newSession, needsAreaSetup };
        } else {
          const errData = await authRes.json().catch(() => ({}));
          if (errData?.msg === 'Invalid login credentials' || errData?.error_code === 'invalid_credentials') {
            return { ok: false, error: 'Invalid email or password.' };
          }
          if (errData?.msg?.includes('Email not confirmed')) {
            return { ok: false, error: 'Please verify your email address before signing in.' };
          }
        }
      } catch (supabaseErr) {
        console.warn('[AuthContext] Direct Supabase auth attempt notice:', supabaseErr);
      }
    }

    // 4. Fallback to cached demo users if offline
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

    return {
      ok: false,
      error: primaryError || 'Unable to connect to login server. Please verify your credentials.'
    };
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
      const isLeadership = LEADERSHIP_ROLES.has(role);
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
      let area = null;
      let memberId = session?.memberId ?? null;
      let chapterId = session?.chapterId ?? null;

      try {
        const payload = await apiRequest('/api/areas/select', {
          method: 'POST',
          body: JSON.stringify({ areaId })
        });

        if (payload?.ok) {
          area = payload.area;
          memberId = payload.profile?.member_id ?? payload.member?.id ?? memberId;
          chapterId = payload.profile?.chapter_id ?? chapterId;
        }
      } catch (backendErr) {
        console.warn('[AuthContext] Backend area select notice:', backendErr);
      }

      // If backend call did not yield area, try direct Supabase REST
      if (!area && session?.accessToken && session?.userId && SUPABASE_URL) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({ area_id: areaId })
          });

          const aRes = await fetch(`${SUPABASE_URL}/rest/v1/areas?id=eq.${areaId}&select=id,name,code`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.accessToken}`
            }
          });
          if (aRes.ok) {
            const aList = await aRes.json();
            if (Array.isArray(aList) && aList.length > 0) {
              area = aList[0];
            }
          }
        } catch (supErr) {
          console.warn('[AuthContext] Direct Supabase area update notice:', supErr);
        }
      }

      const updated = {
        ...session,
        areaId: area?.id || areaId,
        areaName: area?.name || area?.code || session?.areaName || 'Selected Area',
        memberId,
        chapterId,
        needsAreaSetup: false
      };

      saveStoredSession(updated, true);
      setSession(updated);
      return { ok: true, area: updated };
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
      let area = null;
      let memberId = session?.memberId ?? null;
      let chapterId = session?.chapterId ?? null;

      try {
        const payload = await apiRequest('/api/areas', {
          method: 'POST',
          body: JSON.stringify({ name: cleanName })
        });

        if (payload?.ok) {
          area = payload.area;
          memberId = payload.profile?.member_id ?? payload.member?.id ?? memberId;
          chapterId = payload.profile?.chapter_id ?? chapterId;
        }
      } catch (backendErr) {
        console.warn('[AuthContext] Backend area creation notice:', backendErr);
      }

      // Direct Supabase fallback
      if (!area && session?.accessToken && session?.userId && SUPABASE_URL) {
        try {
          const areaCode = cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20);
          const cRes = await fetch(`${SUPABASE_URL}/rest/v1/areas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.accessToken}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ name: cleanName, code: areaCode })
          });
          if (cRes.ok) {
            const createdList = await cRes.json();
            if (Array.isArray(createdList) && createdList.length > 0) {
              area = createdList[0];
            }
          }

          if (area?.id) {
            await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.userId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.accessToken}`
              },
              body: JSON.stringify({ area_id: area.id })
            });
          }
        } catch (supErr) {
          console.warn('[AuthContext] Direct Supabase area creation notice:', supErr);
        }
      }

      const updated = {
        ...session,
        areaId: area?.id || 'new-area-id',
        areaName: area?.name || cleanName,
        memberId,
        chapterId,
        needsAreaSetup: false
      };

      saveStoredSession(updated, true);
      setSession(updated);
      return { ok: true, area: updated };
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

  const isAuthenticated = Boolean(session && (session.accessToken || session.userId || session.email));

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || { email: session?.email, name: session?.name },
        role: session?.role || 'member',
        areaId: session?.areaId,
        areaName: session?.areaName,
        needsAreaSetup: session?.needsAreaSetup === true,
        isAuthenticated,
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
