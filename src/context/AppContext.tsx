import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { User, Expense, Income, Budget, SavingGoal, Alert, Category, Conversation } from '../types';
import {
  DEFAULT_USER, DEFAULT_CATEGORIES, MOCK_EXPENSES, MOCK_INCOMES,
  MOCK_BUDGETS, MOCK_SAVING_GOALS, MOCK_ALERTS, MOCK_EXPENSES_LAST_MONTH,
} from '../data/mockData';

// ── State ──────────────────────────────────────────────
interface AppState {
  user: User;
  expenses: Expense[];
  expensesLastMonth: Expense[];
  incomes: Income[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  alerts: Alert[];
  categories: Category[];
  conversations: Conversation[];
}

const initialState: AppState = {
  user: DEFAULT_USER,
  expenses: MOCK_EXPENSES,
  expensesLastMonth: MOCK_EXPENSES_LAST_MONTH,
  incomes: MOCK_INCOMES,
  budgets: MOCK_BUDGETS,
  savingGoals: MOCK_SAVING_GOALS,
  alerts: MOCK_ALERTS,
  categories: DEFAULT_CATEGORIES,
  conversations: [],
};

// ── Actions ────────────────────────────────────────────
type Action =
  | { type: 'SET_USER'; payload: Partial<User> }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_INCOME'; payload: Income }
  | { type: 'UPDATE_BUDGET'; payload: { categoryId: string; amount: number; alertThreshold?: number } }
  | { type: 'UPDATE_SAVING_GOAL'; payload: SavingGoal }
  | { type: 'ADD_SAVING_GOAL'; payload: SavingGoal }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'RECALCULATE_ALERTS' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };

    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.payload] };

    case 'UPDATE_BUDGET': {
      const budgets = state.budgets.map(b =>
        b.categoryId === action.payload.categoryId
          ? { ...b, amount: action.payload.amount, alertThreshold: action.payload.alertThreshold ?? b.alertThreshold }
          : b
      );
      return { ...state, budgets };
    }

    case 'UPDATE_SAVING_GOAL': {
      const goals = state.savingGoals.map(g =>
        g.id === action.payload.id ? action.payload : g
      );
      return { ...state, savingGoals: goals };
    }

    case 'ADD_SAVING_GOAL':
      return { ...state, savingGoals: [...state.savingGoals, action.payload] };

    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, read: true } : a
        ),
      };

    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };

    case 'ADD_CONVERSATION':
      return { ...state, conversations: [...state.conversations, action.payload] };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };

    case 'RECALCULATE_ALERTS': {
      // Recalculate alerts based on current budget usage
      const newAlerts: Alert[] = [];
      const now = new Date().toISOString();
      const currentMonth = '2026-06';

      state.budgets.forEach(budget => {
        const catExpenses = state.expenses.filter(
          e => e.categoryId === budget.categoryId && e.expenseDate.startsWith(currentMonth)
        );
        const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
        const usagePercent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
        const category = state.categories.find(c => c.id === budget.categoryId);

        if (usagePercent >= 100) {
          newAlerts.push({
            id: `alert_${budget.categoryId}_overspent`,
            type: 'danger',
            message: `${category?.name || '未知'}预算已超支！本月预算 ${budget.amount} 元，已支出 ${spent} 元。`,
            categoryId: budget.categoryId,
            threshold: 100,
            currentUsage: usagePercent,
            createdAt: now,
            read: false,
          });
        } else if (usagePercent >= budget.alertThreshold) {
          newAlerts.push({
            id: `alert_${budget.categoryId}_warning`,
            type: 'warning',
            message: `${category?.name || '未知'}预算已使用 ${usagePercent}%，本月还剩 ${budget.amount - spent} 元。`,
            categoryId: budget.categoryId,
            threshold: budget.alertThreshold,
            currentUsage: usagePercent,
            createdAt: now,
            read: false,
          });
        }
      });

      // Check total budget
      const totalBudget = state.budgets.reduce((s, b) => s + b.amount, 0);
      const totalSpent = state.expenses
        .filter(e => e.expenseDate.startsWith(currentMonth))
        .reduce((s, e) => s + e.amount, 0);
      const totalUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

      if (totalUsage >= 90) {
        newAlerts.push({
          id: 'alert_total_warning',
          type: 'warning',
          message: `本月总预算已使用 ${totalUsage}%，建议进入省钱模式。`,
          threshold: 90,
          currentUsage: totalUsage,
          createdAt: now,
          read: false,
        });
      }

      // Check saving goal risk
      const remainingDays = Math.max(1, 30 - new Date().getDate());
      const dailySpend = remainingDays > 0 ? totalSpent / (new Date().getDate() || 1) : totalSpent;
      const projectedTotal = totalSpent + dailySpend * remainingDays;
      const income = state.incomes
        .filter(i => i.month === currentMonth)
        .reduce((s, i) => s + i.amount, 0);
      const projectedSaving = income - projectedTotal;

      if (state.user.savingGoal > 0 && projectedSaving < state.user.savingGoal) {
        newAlerts.push({
          id: 'alert_saving_risk',
          type: 'info',
          message: `按当前支出速度，本月储蓄目标 ${state.user.savingGoal} 元可能无法完成。建议减少弹性支出。`,
          threshold: 90,
          currentUsage: Math.round((projectedSaving / state.user.savingGoal) * 100),
          createdAt: now,
          read: false,
        });
      }

      return { ...state, alerts: newAlerts };
    }

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Computed values
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingBudget: number;
  todaySuggested: number;
  savingProgress: number;
  categorySpending: Map<string, number>;
  categoryBudgetUsage: { categoryId: string; name: string; spent: number; budget: number; usage: number }[];
  totalBudget: number;
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => void;
  addMultipleExpenses: (expenses: Omit<Expense, 'id' | 'userId' | 'createdAt'>[]) => void;
  deleteExpense: (id: string) => void;
  updateBudget: (categoryId: string, amount: number, alertThreshold?: number) => void;
  addConversation: (question: string, answer: string, intent: Conversation['intent'], agentUsed: string) => void;
  markAlertRead: (id: string) => void;
  updateUser: (user: Partial<User>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentMonth = '2026-06';

  // ── Computed values ──────────────────────────────────
  const monthlyIncome = useMemo(() =>
    state.incomes
      .filter(i => i.month === currentMonth)
      .reduce((s, i) => s + i.amount, 0),
    [state.incomes, currentMonth]
  );

  const monthlyExpenses = useMemo(() =>
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0),
    [state.expenses, currentMonth]
  );

  const totalBudget = useMemo(() =>
    state.budgets.reduce((s, b) => s + b.amount, 0),
    [state.budgets]
  );

  const remainingBudget = totalBudget - monthlyExpenses;

  const todaySuggested = useMemo(() => {
    const remainingDays = Math.max(1, 30 - new Date().getDate());
    return Math.max(0, Math.round(remainingBudget / remainingDays));
  }, [remainingBudget]);

  const savingProgress = useMemo(() => {
    const goal = state.savingGoals.find(g => g.status === 'active');
    if (!goal) return 0;
    return Math.round((goal.currentAmount / goal.targetAmount) * 100);
  }, [state.savingGoals]);

  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth))
      .forEach(e => {
        map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
      });
    return map;
  }, [state.expenses, currentMonth]);

  const categoryBudgetUsage = useMemo(() =>
    state.budgets.map(b => {
      const spent = categorySpending.get(b.categoryId) || 0;
      const cat = state.categories.find(c => c.id === b.categoryId);
      return {
        categoryId: b.categoryId,
        name: cat?.name || '未知',
        spent,
        budget: b.amount,
        usage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
      };
    }).sort((a, b) => b.usage - a.usage),
    [state.budgets, categorySpending, state.categories]
  );

  // ── Action helpers ───────────────────────────────────
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
      userId: state.user.id,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    // Recalculate alerts after adding expense
    setTimeout(() => dispatch({ type: 'RECALCULATE_ALERTS' }), 100);
  }, [state.user.id]);

  const addMultipleExpenses = useCallback((expenses: Omit<Expense, 'id' | 'userId' | 'createdAt'>[]) => {
    expenses.forEach(exp => {
      const newExpense: Expense = {
        ...exp,
        id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: state.user.id,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    });
    setTimeout(() => dispatch({ type: 'RECALCULATE_ALERTS' }), 100);
  }, [state.user.id]);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    setTimeout(() => dispatch({ type: 'RECALCULATE_ALERTS' }), 100);
  }, []);

  const updateBudget = useCallback((categoryId: string, amount: number, alertThreshold?: number) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: { categoryId, amount, alertThreshold } });
    setTimeout(() => dispatch({ type: 'RECALCULATE_ALERTS' }), 100);
  }, []);

  const addConversation = useCallback((
    question: string, answer: string, intent: Conversation['intent'], agentUsed: string
  ) => {
    dispatch({
      type: 'ADD_CONVERSATION',
      payload: {
        id: `conv_${Date.now()}`,
        userId: state.user.id,
        question,
        answer,
        intent,
        agentUsed,
        createdAt: new Date().toISOString(),
      },
    });
  }, [state.user.id]);

  const markAlertRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_ALERT_READ', payload: id });
  }, []);

  const updateUser = useCallback((user: Partial<User>) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
    monthlyIncome,
    monthlyExpenses,
    remainingBudget,
    todaySuggested,
    savingProgress,
    categorySpending,
    categoryBudgetUsage,
    totalBudget,
    addExpense,
    addMultipleExpenses,
    deleteExpense,
    updateBudget,
    addConversation,
    markAlertRead,
    updateUser,
  }), [
    state, monthlyIncome, monthlyExpenses, remainingBudget,
    todaySuggested, savingProgress, categorySpending, categoryBudgetUsage,
    totalBudget, addExpense, addMultipleExpenses, deleteExpense, updateBudget,
    addConversation, markAlertRead, updateUser,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
