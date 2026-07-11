import { Router, type Response } from 'express';
import { db } from '../db.js';
import { verifyToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/budgets — get current month
router.get('/', async (req: AuthRequest, res: Response) => {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  let { data, error } = await db.from('budgets')
    .select('*').eq('user_id', req.userId).eq('month', month);

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Seed default budgets if empty
  if (!data || data.length === 0) {
    const defaults = [
      { category_id: 'cat_food', amount: 1800, alert_threshold: 70 },
      { category_id: 'cat_transport', amount: 500, alert_threshold: 80 },
      { category_id: 'cat_entertainment', amount: 600, alert_threshold: 70 },
      { category_id: 'cat_shopping', amount: 800, alert_threshold: 70 },
      { category_id: 'cat_learning', amount: 500, alert_threshold: 80 },
      { category_id: 'cat_social', amount: 400, alert_threshold: 70 },
      { category_id: 'cat_medical', amount: 300, alert_threshold: 80 },
      { category_id: 'cat_other', amount: 300, alert_threshold: 80 },
    ].map(b => ({ user_id: req.userId, ...b, month }));
    await db.from('budgets').insert(defaults);
    data = defaults as any;
  }

  res.json(data);
});

// PUT /api/budgets/:categoryId
router.put('/:categoryId', async (req: AuthRequest, res: Response) => {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { amount, alert_threshold } = req.body;
  const categoryId = req.params.categoryId;

  // Upsert
  const { data: existing } = await db.from('budgets').select('id')
    .eq('user_id', req.userId).eq('category_id', categoryId).eq('month', month).single();

  if (existing) {
    await db.from('budgets').update({ amount, alert_threshold }).eq('id', existing.id);
  } else {
    await db.from('budgets').insert({
      user_id: req.userId, category_id: categoryId, amount, month, alert_threshold,
    });
  }

  res.json({ success: true });
});

export default router;
