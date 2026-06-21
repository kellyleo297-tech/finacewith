import { createClient } from '@supabase/supabase-js';

// Supabase anon key is safe to expose in client-side code
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uankoulfoscdnchtzcrz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3_kMqt-XAyrvVv-OAY56gQ_kk3zH1JU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type DbUser = {
  id: string;
  name: string;
  role: string;
  currency: string;
  risk_level: string;
  monthly_income: number;
  income_source: string;
  budget_mode: string;
  saving_goal: number;
  created_at: string;
};

export type DbExpense = {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  note: string;
  payment_method: string;
  expense_date: string;
  created_at: string;
};

export type DbIncome = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  income_date: string;
  month: string;
  is_recurring: boolean;
  note: string;
};

export type DbBudget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  alert_threshold: number;
};

export type DbSavingGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: string;
  created_at: string;
};
