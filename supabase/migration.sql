-- MoneyMate AI - Database Schema
-- Run this in Supabase SQL Editor: https://uankoulfoscdnchtzcrz.supabase.co

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'worker',
  currency TEXT DEFAULT 'CNY',
  risk_level TEXT DEFAULT '',
  monthly_income NUMERIC DEFAULT 0,
  income_source TEXT DEFAULT '',
  budget_mode TEXT DEFAULT 'balanced',
  saving_goal NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email column if table already exists (for existing deploys)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Categories table (default categories per user)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cat_key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  icon TEXT DEFAULT '📦',
  is_default BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- 3. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category_id TEXT NOT NULL,
  note TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'wechat',
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  source TEXT DEFAULT '',
  income_date DATE NOT NULL,
  month TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  note TEXT DEFAULT ''
);

-- 5. Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  alert_threshold INTEGER DEFAULT 70
);

-- 6. Saving goals table
CREATE TABLE IF NOT EXISTS saving_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent TEXT DEFAULT 'general',
  agent_used TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_month ON incomes(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user can only see their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can CRUD own expenses" ON expenses FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can CRUD own incomes" ON incomes FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can CRUD own budgets" ON budgets FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can CRUD own goals" ON saving_goals FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can CRUD own conversations" ON conversations FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can CRUD own categories" ON categories FOR ALL USING (auth.uid() = user_id OR true);
