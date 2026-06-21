import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

interface AuthState {
  user: AuthUser | null;
  session: any;
  loading: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, user: session?.user ?? null, session }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Create user profile + seed categories & budgets
    if (data.user) {
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      await supabase.from('users').insert({ id: data.user.id, name, email });

      // Seed default budgets
      const defaultBudgets = [
        { user_id: data.user.id, category_id: 'cat_food', amount: 1800, month },
        { user_id: data.user.id, category_id: 'cat_transport', amount: 500, month },
        { user_id: data.user.id, category_id: 'cat_entertainment', amount: 600, month },
        { user_id: data.user.id, category_id: 'cat_shopping', amount: 800, month },
        { user_id: data.user.id, category_id: 'cat_learning', amount: 500, month },
        { user_id: data.user.id, category_id: 'cat_social', amount: 400, month },
        { user_id: data.user.id, category_id: 'cat_medical', amount: 300, month },
        { user_id: data.user.id, category_id: 'cat_other', amount: 300, month },
      ].map(b => ({ ...b, alert_threshold: 70 }));
      await supabase.from('budgets').insert(defaultBudgets);
    }
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    signUp,
    signIn,
    signOut,
  }), [state.user, state.loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
