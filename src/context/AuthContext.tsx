import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api, setToken, clearToken, getToken } from '../lib/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.auth.me()
        .then(u => setUser({ id: u.id, email: u.email, name: u.name }))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { user: u, token } = await api.auth.register({ email, password, name });
      setToken(token);
      setUser(u);
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user: u, token } = await api.auth.login({ email, password });
      setToken(token);
      setUser(u);
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signUp, signIn, signOut }), [user, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
