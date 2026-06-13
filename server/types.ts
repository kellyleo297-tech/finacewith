export interface AgentContext {
  userId: string;
  userName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingBudget: number;
  todaySuggested: number;
  totalBudget: number;
  savingProgress: number;
  categoryBudgetUsage: {
    categoryId: string;
    name: string;
    spent: number;
    budget: number;
    usage: number;
  }[];
  categories: {
    id: string;
    name: string;
    icon: string;
  }[];
  savingGoal?: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
  };
}

export interface AgentResponse {
  answer: string;
  intent: string;
  agentUsed: string;
}

export interface ExpenseRecord {
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}
