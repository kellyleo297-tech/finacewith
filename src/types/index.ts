export interface User {
  id: string;
  name: string;
  role: 'student' | 'worker' | 'freelancer';
  currency: string;
  riskLevel: 'low' | 'medium' | 'high' | '';
  monthlyIncome: number;
  incomeSource: string;
  budgetMode: 'conservative' | 'balanced' | 'custom';
  savingGoal: number;
  fixedExpenses: FixedExpense[];
  createdAt: string;
  isOnboarded: boolean;
}

export interface FixedExpense {
  name: string;
  amount: number;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string;
  incomeDate: string;
  month: string;
  isRecurring: boolean;
  note?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  note: string;
  paymentMethod: 'cash' | 'wechat' | 'alipay' | 'card' | 'other';
  expenseDate: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: string;
  alertThreshold: number; // 0-100 percentage
}

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  question: string;
  answer: string;
  intent: 'record' | 'analyze' | 'budget' | 'saving' | 'finance_edu' | 'general';
  agentUsed: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  categoryId?: string;
  threshold: number;
  currentUsage: number;
  createdAt: string;
  read: boolean;
}

export interface QuickQuestion {
  text: string;
  intent: string;
}
