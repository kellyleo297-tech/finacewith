import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = Router();

const DEFAULT_BUDGETS = [
  { category_id: 'cat_food', amount: 1800, alert_threshold: 70 },
  { category_id: 'cat_transport', amount: 500, alert_threshold: 80 },
  { category_id: 'cat_entertainment', amount: 600, alert_threshold: 70 },
  { category_id: 'cat_shopping', amount: 800, alert_threshold: 70 },
  { category_id: 'cat_learning', amount: 500, alert_threshold: 80 },
  { category_id: 'cat_social', amount: 400, alert_threshold: 70 },
  { category_id: 'cat_medical', amount: 300, alert_threshold: 80 },
  { category_id: 'cat_other', amount: 300, alert_threshold: 80 },
];

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: '邮箱、密码、昵称不能为空' });
      return;
    }

    // Check existing user
    const { data: existing } = await db.from('users').select('id').eq('email', email).single();
    if (existing) {
      res.status(409).json({ error: '该邮箱已注册' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error } = await db.from('users').insert({
      email,
      name,
      password_hash: hashedPassword,
    }).select('id, email, name').single();

    if (error || !user) {
      res.status(500).json({ error: '注册失败' });
      return;
    }

    // Seed default budgets
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const budgets = DEFAULT_BUDGETS.map(b => ({ user_id: user.id, ...b, month }));
    await db.from('budgets').insert(budgets);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码不能为空' });
      return;
    }

    const { data: user, error } = await db.from('users').select('*').eq('email', email).single();
    if (error || !user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/auth/me — get current user
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { data: user } = await db.from('users').select('id, email, name, monthly_income, income_source, budget_mode, saving_goal, created_at').eq('id', userId).single();
  res.json(user);
});

export default router;
