import { Router, type Response } from 'express';
import { db } from '../db.js';
import { verifyToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/incomes — get current month
router.get('/', async (req: AuthRequest, res: Response) => {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data, error } = await db.from('incomes')
    .select('*').eq('user_id', req.userId).eq('month', month);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/incomes
router.post('/', async (req: AuthRequest, res: Response) => {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { amount, source, income_date, is_recurring, note } = req.body;
  const { data, error } = await db.from('incomes').insert({
    user_id: req.userId, amount, source: source || '', month,
    income_date: income_date || new Date().toISOString().slice(0, 10),
    is_recurring: is_recurring ?? true,
    note: note || `${month} ${source || '收入'}`,
  }).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Update user's monthly_income
  await db.from('users').update({ monthly_income: Number(amount) }).eq('id', req.userId);

  res.status(201).json(data);
});

export default router;
