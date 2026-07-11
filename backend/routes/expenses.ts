import { Router, type Response } from 'express';
import { db } from '../db.js';
import { verifyToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/expenses — get current month expenses
router.get('/', async (req: AuthRequest, res: Response) => {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data, error } = await db.from('expenses')
    .select('*')
    .eq('user_id', req.userId)
    .gte('expense_date', `${month}-01`)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/expenses — create
router.post('/', async (req: AuthRequest, res: Response) => {
  const { amount, category_id, note, payment_method, expense_date } = req.body;
  const { data, error } = await db.from('expenses').insert({
    user_id: req.userId,
    amount,
    category_id,
    note: note || '',
    payment_method: payment_method || 'wechat',
    expense_date: expense_date || new Date().toISOString().slice(0, 10),
  }).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// POST /api/expenses/batch — batch create
router.post('/batch', async (req: AuthRequest, res: Response) => {
  const { expenses } = req.body;
  if (!Array.isArray(expenses)) {
    res.status(400).json({ error: 'expenses must be an array' });
    return;
  }
  const rows = expenses.map((e: any) => ({
    user_id: req.userId,
    amount: e.amount,
    category_id: e.category_id || 'cat_other',
    note: e.note || '',
    payment_method: e.payment_method || 'wechat',
    expense_date: e.expense_date || new Date().toISOString().slice(0, 10),
  }));
  const { data, error } = await db.from('expenses').insert(rows).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { error } = await db.from('expenses').delete().eq('id', req.params.id).eq('user_id', req.userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;
