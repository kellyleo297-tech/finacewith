import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Expense, Income, Budget, SavingGoal, Alert, Category, Conversation } from '../types';
import { supabase, type DbExpense, type DbIncome, type DbBudget, type DbSavingGoal } from '../lib/supabase';
import { useAuth } from './AuthContext';

const currentMonth = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

// ── Default categories seeded on user creation ─────────
const CATEGORY_SEED = [
  { cat_key: 'cat_food', name: '饮食', type: 'expense', icon: '🍽️', is_default: true },
  { cat_key: 'cat_transport', name: '交通', type: 'expense', icon: '🚗', is_default: true },
  { cat_key: 'cat_entertainment', name: '娱乐', type: 'expense', icon: '🎮', is_default: true },
  { cat_key: 'cat_shopping', name: '购物', type: 'expense', icon: '🛍️', is_default: true },
  { cat_key: 'cat_learning', name: '学习', type: 'expense', icon: '📚', is_default: true },
  { cat_key: 'cat_rent', name: '房租', type: 'expense', icon: '🏠', is_default: true },
  { cat_key: 'cat_medical', name: '医疗', type: 'expense', icon: '💊', is_default: true },
  { cat_key: 'cat_social', name: '人情社交', type: 'expense', icon: '🎁', is_default: true },
  { cat_key: 'cat_investment', name: '投资理财', type: 'expense', icon: '📈', is_default: true },
  { cat_key: 'cat_other', name: '其他', type: 'expense', icon: '📦', is_default: true },
];

// ── State ──────────────────────────────────────────────
interface AppState {
  user: User;
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  alerts: Alert[];
  categories: Category[];
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

const emptyUser: User = {
  id: '', name: '', role: 'worker', currency: 'CNY', riskLevel: '',
  monthlyIncome: 0, incomeSource: '', budgetMode: 'balanced', savingGoal: 0,
  fixedExpenses: [], createdAt: '', isOnboarded: false,
};

const initialState: AppState = {
  user: emptyUser,
  expenses: [], incomes: [], budgets: [], savingGoals: [],
  alerts: [], categories: CATEGORY_SEED.map(c => ({ id: c.cat_key, name: c.name, type: 'expense' as const, icon: c.icon, isDefault: c.is_default })), conversations: [],
  loading: true, error: null,
};

// ── Helpers: map DB rows to app types ──────────────────
function toExpense(db: DbExpense): Expense {
  return { id: db.id, userId: db.user_id, amount: db.amount, categoryId: db.category_id, note: db.note, paymentMethod: db.payment_method as Expense['paymentMethod'], expenseDate: db.expense_date, createdAt: db.created_at };
}
function toIncome(db: DbIncome): Income {
  return { id: db.id, userId: db.user_id, amount: db.amount, source: db.source, incomeDate: db.income_date, month: db.month, isRecurring: db.is_recurring, note: db.note };
}
function toBudget(db: DbBudget): Budget {
  return { id: db.id, userId: db.user_id, categoryId: db.category_id, amount: db.amount, month: db.month, alertThreshold: db.alert_threshold };
}
function toSavingGoal(db: DbSavingGoal): SavingGoal {
  return { id: db.id, userId: db.user_id, name: db.name, targetAmount: db.target_amount, currentAmount: db.current_amount, deadline: db.deadline, status: db.status as SavingGoal['status'], createdAt: db.created_at };
}

// ── Context ────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingBudget: number;
  todaySuggested: number;
  savingProgress: number;
  categoryBudgetUsage: { categoryId: string; name: string; spent: number; budget: number; usage: number }[];
  totalBudget: number;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  addMultipleExpenses: (expenses: Omit<Expense, 'id' | 'userId' | 'createdAt'>[]) => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'userId'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateBudget: (categoryId: string, amount: number, alertThreshold?: number) => Promise<void>;
  addConversation: (question: string, answer: string, intent: Conversation['intent'], agentUsed: string) => Promise<void>;
  markAlertRead: (id: string) => void;
  updateUser: (user: Partial<User>) => void;
  createUser: (name: string, role: string) => Promise<void>;
  updateUserProfile: (data: { name?: string; role?: User['role']; monthlyIncome?: number; incomeSource?: string; budgetMode?: User['budgetMode']; savingGoal?: number; isOnboarded?: boolean }) => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const month = currentMonth();
  const { user: authUser } = useAuth();

  // ── Load data when auth user changes ─────────────────
  useEffect(() => {
    if (authUser?.id) {
      loadUserData(authUser.id);
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [authUser?.id]);

  const loadUserData = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // Fetch user
      const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!userData) { setState(prev => ({ ...prev, loading: false })); return; }

      const user: User = {
        id: userData.id, name: userData.name, role: userData.role,
        currency: userData.currency, riskLevel: userData.risk_level || '',
        monthlyIncome: userData.monthly_income, incomeSource: userData.income_source || '',
        budgetMode: userData.budget_mode || 'balanced', savingGoal: userData.saving_goal || 0,
        fixedExpenses: [], createdAt: userData.created_at, isOnboarded: true,
      };

      // Fetch expenses this month
      const { data: expData } = await supabase.from('expenses').select('*').eq('user_id', userId).gte('expense_date', `${month}-01`).order('created_at', { ascending: false });
      const expenses = (expData || []).map(toExpense);

      // Fetch incomes this month
      const { data: incData } = await supabase.from('incomes').select('*').eq('user_id', userId).eq('month', month);
      const incomes = (incData || []).map(toIncome);

      // Fetch budgets this month
      const { data: budData } = await supabase.from('budgets').select('*').eq('user_id', userId).eq('month', month);
      const budgets = (budData || []).map(toBudget);

      // Fetch saving goals
      const { data: goalData } = await supabase.from('saving_goals').select('*').eq('user_id', userId);
      const savingGoals = (goalData || []).map(toSavingGoal);

      // Build categories list from seed
      const categories: Category[] = CATEGORY_SEED.map(c => ({ id: c.cat_key, name: c.name, type: c.type as 'expense', icon: c.icon, isDefault: c.is_default }));

      setState(prev => ({ ...prev, user, expenses, incomes, budgets, savingGoals, categories, loading: false }));
    } catch (e) {
      console.error('loadUserData error', e);
      setState(prev => ({ ...prev, loading: false, error: '加载数据失败' }));
    }
  }, [month]);

  const createUser = useCallback(async (name: string, role: string) => {
    const { data } = await supabase.from('users').insert({ name, role }).select().single();
    if (data) {
      localStorage.setItem('moneymate_user_id', data.id);
      // Seed default categories & budgets
      const catInserts = CATEGORY_SEED.map(c => ({ user_id: data.id, ...c }));
      await supabase.from('categories').insert(catInserts);
      // Seed default budgets
      const defaultBudgets = [
        { user_id: data.id, category_id: 'cat_food', amount: 1800, month, alert_threshold: 70 },
        { user_id: data.id, category_id: 'cat_transport', amount: 500, month, alert_threshold: 80 },
        { user_id: data.id, category_id: 'cat_entertainment', amount: 600, month, alert_threshold: 70 },
        { user_id: data.id, category_id: 'cat_shopping', amount: 800, month, alert_threshold: 70 },
        { user_id: data.id, category_id: 'cat_learning', amount: 500, month, alert_threshold: 80 },
        { user_id: data.id, category_id: 'cat_social', amount: 400, month, alert_threshold: 70 },
        { user_id: data.id, category_id: 'cat_medical', amount: 300, month, alert_threshold: 80 },
        { user_id: data.id, category_id: 'cat_other', amount: 300, month, alert_threshold: 80 },
      ];
      await supabase.from('budgets').insert(defaultBudgets);
      await loadUserData(data.id);
    }
  }, [month, loadUserData]);

  const updateUserProfile = useCallback(async (data: { name?: string; role?: User['role']; monthlyIncome?: number; incomeSource?: string; budgetMode?: User['budgetMode']; savingGoal?: number; isOnboarded?: boolean }) => {
    if (!authUser?.id) return;
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.role) updates.role = data.role;
    if (data.monthlyIncome !== undefined) updates.monthly_income = data.monthlyIncome;
    if (data.incomeSource) updates.income_source = data.incomeSource;
    if (data.budgetMode) updates.budget_mode = data.budgetMode;
    if (data.savingGoal !== undefined) updates.saving_goal = data.savingGoal;
    await supabase.from('users').update(updates).eq('id', authUser.id);
    setState(prev => ({ ...prev, user: { ...prev.user, ...data as Partial<User>, isOnboarded: data.isOnboarded ?? prev.user.isOnboarded } }));
  }, [authUser?.id]);

  // ── Computed values ──────────────────────────────────
  const monthlyIncome = useMemo(() => state.incomes.reduce((s, i) => s + i.amount, 0) || state.user.monthlyIncome, [state.incomes, state.user.monthlyIncome]);
  const monthlyExpenses = useMemo(() => state.expenses.filter(e => e.expenseDate.startsWith(month)).reduce((s, e) => s + e.amount, 0), [state.expenses, month]);
  const totalBudget = useMemo(() => state.budgets.reduce((s, b) => s + b.amount, 0), [state.budgets]);
  const remainingBudget = totalBudget - monthlyExpenses;
  const todaySuggested = useMemo(() => Math.max(0, Math.round(remainingBudget / Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()))), [remainingBudget]);
  const savingProgress = useMemo(() => {
    const goal = state.savingGoals.find(g => g.status === 'active');
    return goal ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
  }, [state.savingGoals]);

  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses.filter(e => e.expenseDate.startsWith(month)).forEach(e => map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount));
    return map;
  }, [state.expenses, month]);

  const categoryBudgetUsage = useMemo(() =>
    state.budgets.map(b => {
      const spent = categorySpending.get(b.categoryId) || 0;
      const cat = state.categories.find(c => c.id === b.categoryId);
      return { categoryId: b.categoryId, name: cat?.name || b.categoryId, spent, budget: b.amount, usage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0 };
    }).sort((a, b) => b.usage - a.usage),
    [state.budgets, categorySpending, state.categories]
  );

  // ── Actions ──────────────────────────────────────────
  const addExpense = useCallback(async (exp: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    const { data } = await supabase.from('expenses').insert({
      user_id: state.user.id, amount: exp.amount, category_id: exp.categoryId,
      note: exp.note, payment_method: exp.paymentMethod, expense_date: exp.expenseDate,
    }).select().single();
    if (data) setState(prev => ({ ...prev, expenses: [toExpense(data), ...prev.expenses] }));
  }, [state.user.id]);

  const addMultipleExpenses = useCallback(async (expenses: Omit<Expense, 'id' | 'userId' | 'createdAt'>[]) => {
    const rows = expenses.map(e => ({
      user_id: state.user.id, amount: e.amount, category_id: e.categoryId,
      note: e.note, payment_method: e.paymentMethod, expense_date: e.expenseDate,
    }));
    const { data } = await supabase.from('expenses').insert(rows).select();
    if (data) setState(prev => ({ ...prev, expenses: [...data.map(toExpense), ...prev.expenses] }));
  }, [state.user.id]);

  const addIncome = useCallback(async (inc: Omit<Income, 'id' | 'userId'>) => {
    const { data } = await supabase.from('incomes').insert({
      user_id: state.user.id, amount: inc.amount, source: inc.source,
      income_date: inc.incomeDate, month: inc.month, is_recurring: inc.isRecurring, note: inc.note,
    }).select().single();
    if (data) {
      setState(prev => ({ ...prev, incomes: [...prev.incomes, toIncome(data)] }));
      // Also update user's monthly_income field
      await supabase.from('users').update({ monthly_income: Number(data.amount) }).eq('id', state.user.id);
    }
  }, [state.user.id]);

  const deleteExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  const updateBudget = useCallback(async (categoryId: string, amount: number, alertThreshold?: number) => {
    const existing = state.budgets.find(b => b.categoryId === categoryId && b.month === month);
    if (existing) {
      await supabase.from('budgets').update({ amount, alert_threshold: alertThreshold ?? existing.alertThreshold }).eq('id', existing.id);
    } else {
      await supabase.from('budgets').insert({ user_id: state.user.id, category_id: categoryId, amount, month, alert_threshold: alertThreshold ?? 70 });
    }
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => b.categoryId === categoryId ? { ...b, amount, alertThreshold: alertThreshold ?? b.alertThreshold } : b),
    }));
  }, [state.user.id, state.budgets, month]);

  const addConversation = useCallback(async (question: string, answer: string, intent: Conversation['intent'], agentUsed: string) => {
    const { data } = await supabase.from('conversations').insert({
      user_id: state.user.id, question, answer, intent, agent_used: agentUsed,
    }).select().single();
    if (data) {
      setState(prev => ({ ...prev, conversations: [...prev.conversations, { id: data.id, userId: data.user_id, question: data.question, answer: data.answer, intent: data.intent, agentUsed: data.agent_used, createdAt: data.created_at }] }));
    }
  }, [state.user.id]);

  const markAlertRead = useCallback((id: string) => {
    setState(prev => ({ ...prev, alerts: prev.alerts.map(a => a.id === id ? { ...a, read: true } : a) }));
  }, []);

  const updateUser = useCallback((_user: Partial<User>) => {
    setState(prev => ({ ...prev, user: { ...prev.user, ..._user } }));
  }, []);

  const value = useMemo(() => ({
    state, monthlyIncome, monthlyExpenses, remainingBudget, todaySuggested,
    savingProgress, categoryBudgetUsage, totalBudget,
    addExpense, addMultipleExpenses, addIncome, deleteExpense, updateBudget,
    addConversation, markAlertRead, updateUser, createUser, updateUserProfile, loadUserData,
  }), [state, monthlyIncome, monthlyExpenses, remainingBudget, todaySuggested, savingProgress, categoryBudgetUsage, totalBudget, addExpense, addMultipleExpenses, addIncome, deleteExpense, updateBudget, addConversation, markAlertRead, updateUser, createUser, updateUserProfile, loadUserData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
