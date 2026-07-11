import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Expense, Income, Budget, SavingGoal, Alert, Category, Conversation } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const currentMonth = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

const CATEGORY_SEED = [
  { cat_key: 'cat_food', name: '饮食', type: 'expense' as const, icon: '🍽️', is_default: true },
  { cat_key: 'cat_transport', name: '交通', type: 'expense' as const, icon: '🚗', is_default: true },
  { cat_key: 'cat_entertainment', name: '娱乐', type: 'expense' as const, icon: '🎮', is_default: true },
  { cat_key: 'cat_shopping', name: '购物', type: 'expense' as const, icon: '🛍️', is_default: true },
  { cat_key: 'cat_learning', name: '学习', type: 'expense' as const, icon: '📚', is_default: true },
  { cat_key: 'cat_rent', name: '房租', type: 'expense' as const, icon: '🏠', is_default: true },
  { cat_key: 'cat_medical', name: '医疗', type: 'expense' as const, icon: '💊', is_default: true },
  { cat_key: 'cat_social', name: '人情社交', type: 'expense' as const, icon: '🎁', is_default: true },
  { cat_key: 'cat_investment', name: '投资理财', type: 'expense' as const, icon: '📈', is_default: true },
  { cat_key: 'cat_other', name: '其他', type: 'expense' as const, icon: '📦', is_default: true },
];

// ── Helpers ────────────────────────────────────────────
function toExpense(db: any): Expense {
  return { id: db.id, userId: db.user_id, amount: db.amount, categoryId: db.category_id, note: db.note || '', paymentMethod: db.payment_method || 'wechat', expenseDate: db.expense_date, createdAt: db.created_at };
}
function toIncome(db: any): Income {
  return { id: db.id, userId: db.user_id, amount: db.amount, source: db.source || '', incomeDate: db.income_date, month: db.month, isRecurring: db.is_recurring, note: db.note || '' };
}
function toBudget(db: any): Budget {
  return { id: db.id, userId: db.user_id, categoryId: db.category_id, amount: db.amount, month: db.month, alertThreshold: db.alert_threshold };
}
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
}

const emptyUser: User = {
  id: '', name: '', role: 'worker', currency: 'CNY', riskLevel: '',
  monthlyIncome: 0, incomeSource: '', budgetMode: 'balanced', savingGoal: 0,
  fixedExpenses: [], createdAt: '', isOnboarded: false,
};

const initialState: AppState = {
  user: emptyUser, expenses: [], incomes: [], budgets: [], savingGoals: [],
  alerts: [], categories: CATEGORY_SEED.map(c => ({ id: c.cat_key, name: c.name, type: c.type, icon: c.icon, isDefault: c.is_default })), conversations: [],
  loading: true,
};

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
  updateUserProfile: (data: any) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const month = currentMonth();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser?.id) {
      loadData();
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [authUser?.id]);

  async function loadData() {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [profile, expenses, incomes, budgets] = await Promise.all([
        api.user.profile().catch(() => null),
        api.expenses.list().catch(() => []),
        api.incomes.list().catch(() => []),
        api.budgets.list().catch(() => []),
      ]);

      const user: User = profile ? {
        id: profile.id, name: profile.name || '', role: profile.role || 'worker',
        currency: 'CNY', riskLevel: '', monthlyIncome: profile.monthly_income || 0,
        incomeSource: profile.income_source || '', budgetMode: profile.budget_mode || 'balanced',
        savingGoal: profile.saving_goal || 0, fixedExpenses: [], createdAt: profile.created_at || '',
        isOnboarded: true,
      } : emptyUser;

      setState(prev => ({
        ...prev, user,
        expenses: (expenses || []).map(toExpense),
        incomes: (incomes || []).map(toIncome),
        budgets: (budgets || []).map(toBudget),
        savingGoals: [], loading: false,
      }));
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }

  // ── Computed ─────────────────────────────────────────
  const monthlyIncome = useMemo(() => state.incomes.reduce((s, i) => s + i.amount, 0) || state.user.monthlyIncome, [state.incomes, state.user.monthlyIncome]);
  const monthlyExpenses = useMemo(() => state.expenses.filter(e => e.expenseDate?.startsWith(month)).reduce((s, e) => s + e.amount, 0), [state.expenses, month]);
  const totalBudget = useMemo(() => state.budgets.reduce((s, b) => s + b.amount, 0), [state.budgets]);
  const remainingBudget = totalBudget - monthlyExpenses;
  const todaySuggested = useMemo(() => Math.max(0, Math.round(remainingBudget / Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()))), [remainingBudget]);
  const savingProgress = useMemo(() => {
    const goal = state.savingGoals.find(g => g.status === 'active');
    return goal ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
  }, [state.savingGoals]);

  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses.filter(e => e.expenseDate?.startsWith(month)).forEach(e => map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount));
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
    const data = await api.expenses.create({ amount: exp.amount, category_id: exp.categoryId, note: exp.note, payment_method: exp.paymentMethod, expense_date: exp.expenseDate });
    setState(prev => ({ ...prev, expenses: [toExpense(data), ...prev.expenses] }));
  }, []);

  const addMultipleExpenses = useCallback(async (expenses: Omit<Expense, 'id' | 'userId' | 'createdAt'>[]) => {
    const data = await api.expenses.batchCreate(expenses.map(e => ({ amount: e.amount, category_id: e.categoryId, note: e.note, payment_method: e.paymentMethod, expense_date: e.expenseDate })));
    setState(prev => ({ ...prev, expenses: [...data.map(toExpense), ...prev.expenses] }));
  }, []);

  const addIncome = useCallback(async (inc: Omit<Income, 'id' | 'userId'>) => {
    const data = await api.incomes.create({ amount: inc.amount, source: inc.source, income_date: inc.incomeDate, is_recurring: inc.isRecurring, note: inc.note });
    setState(prev => ({ ...prev, incomes: [...prev.incomes, toIncome(data)] }));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await api.expenses.delete(id);
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  const updateBudget = useCallback(async (categoryId: string, amount: number, alertThreshold?: number) => {
    await api.budgets.update(categoryId, { amount, alert_threshold: alertThreshold ?? 70 });
    setState(prev => ({ ...prev, budgets: prev.budgets.map(b => b.categoryId === categoryId ? { ...b, amount, alertThreshold: alertThreshold ?? b.alertThreshold } : b) }));
  }, []);

  const addConversation = useCallback(async (question: string, answer: string, intent: Conversation['intent'], agentUsed: string) => {
    setState(prev => ({ ...prev, conversations: [...prev.conversations, { id: String(Date.now()), userId: authUser?.id || '', question, answer, intent, agentUsed, createdAt: new Date().toISOString() }] }));
  }, [authUser?.id]);

  const markAlertRead = useCallback((id: string) => {
    setState(prev => ({ ...prev, alerts: prev.alerts.map(a => a.id === id ? { ...a, read: true } : a) }));
  }, []);

  const updateUser = useCallback((_user: Partial<User>) => {
    setState(prev => ({ ...prev, user: { ...prev.user, ..._user } }));
  }, []);

  const updateUserProfile = useCallback(async (data: any) => {
    await api.user.update(data);
    setState(prev => ({ ...prev, user: { ...prev.user, ...data } }));
  }, []);

  const value = useMemo(() => ({
    state, monthlyIncome, monthlyExpenses, remainingBudget, todaySuggested,
    savingProgress, categoryBudgetUsage, totalBudget,
    addExpense, addMultipleExpenses, addIncome, deleteExpense, updateBudget,
    addConversation, markAlertRead, updateUser, updateUserProfile,
  }), [state, monthlyIncome, monthlyExpenses, remainingBudget, todaySuggested, savingProgress, categoryBudgetUsage, totalBudget, addExpense, addMultipleExpenses, addIncome, deleteExpense, updateBudget, addConversation, updateUserProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
