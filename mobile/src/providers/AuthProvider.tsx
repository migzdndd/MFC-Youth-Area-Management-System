import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';

export type UserRole = 'area_admin' | 'chapter_servant' | 'member' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  chapter_id?: string;
  area_id?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  biometricSupported: boolean;
  signOut: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  biometricSupported: false,
  signOut: async () => {},
  authenticateWithBiometrics: async () => false,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    // Check biometrics availability
    LocalAuthentication.hasHardwareAsync().then((hasHardware) => {
      if (hasHardware) {
        LocalAuthentication.isEnrolledAsync().then((isEnrolled) => {
          setBiometricSupported(isEnrolled);
        });
      }
    });

    // Supabase auth state listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          email: currentUser.email || '',
          full_name: data.full_name || currentUser.user_metadata?.full_name || 'MFC Servant',
          role: data.role || 'member',
          chapter_id: data.chapter_id,
          area_id: data.area_id,
        });
      } else {
        // Fallback profile if profile record not found
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || 'MFC Servant',
          role: 'member',
        });
      }
    } catch {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: 'MFC Servant',
        role: 'member',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!biometricSupported) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock MFC Youth AMS',
        fallbackLabel: 'Use Password',
      });
      return result.success;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        biometricSupported,
        signOut,
        authenticateWithBiometrics,
        refreshProfile: async () => {
          if (user) await fetchUserProfile(user);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
