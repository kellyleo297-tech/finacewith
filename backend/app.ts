import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import { verifyToken } from './middleware/auth.js';
import expensesRoutes from './routes/expenses.js';
import incomesRoutes from './routes/incomes.js';
import budgetsRoutes from './routes/budgets.js';
import aiRoutes from './routes/ai.js';

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/incomes', incomesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/ai', aiRoutes);

// GET /api/user/profile — protected
app.get('/api/user/profile', verifyToken, async (req: any, res) => {
  const { db } = await import('./db.js');
  const { data } = await db.from('users').select('id, email, name, monthly_income, income_source, budget_mode, saving_goal, created_at').eq('id', req.userId).single();
  res.json(data);
});

// PUT /api/user/profile — protected
app.put('/api/user/profile', verifyToken, async (req: any, res) => {
  const { db } = await import('./db.js');
  const { name, monthly_income, income_source, budget_mode, saving_goal } = req.body;
  const updates: any = {};
  if (name) updates.name = name;
  if (monthly_income !== undefined) updates.monthly_income = monthly_income;
  if (income_source) updates.income_source = income_source;
  if (budget_mode) updates.budget_mode = budget_mode;
  if (saving_goal !== undefined) updates.saving_goal = saving_goal;
  await db.from('users').update(updates).eq('id', req.userId);
  res.json({ success: true });
});

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
