import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supervisorAgent } from '../server/agents/supervisor';
import { recorderAgent } from '../server/agents/recorder';
import { analyzerAgent } from '../server/agents/analyzer';
import { budgeterAgent } from '../server/agents/budgeter';
import { saverAgent } from '../server/agents/saver';
import { educatorAgent } from '../server/agents/educator';
import { complianceAgent } from '../server/agents/compliance';
import type { AgentContext } from '../server/types';

// ── Mock data context (same as Express server) ─────────
function getContext(): AgentContext {
  const mockExpenses = [
    { categoryId: 'cat_food', amount: 35 }, { categoryId: 'cat_food', amount: 18 },
    { categoryId: 'cat_transport', amount: 42 }, { categoryId: 'cat_food', amount: 28 },
    { categoryId: 'cat_food', amount: 15 }, { categoryId: 'cat_entertainment', amount: 120 },
    { categoryId: 'cat_food', amount: 45 }, { categoryId: 'cat_shopping', amount: 200 },
    { categoryId: 'cat_food', amount: 88 }, { categoryId: 'cat_transport', amount: 6 },
    { categoryId: 'cat_food', amount: 32 }, { categoryId: 'cat_food', amount: 25 },
    { categoryId: 'cat_social', amount: 150 }, { categoryId: 'cat_food', amount: 38 },
    { categoryId: 'cat_food', amount: 20 }, { categoryId: 'cat_transport', amount: 55 },
    { categoryId: 'cat_shopping', amount: 299 }, { categoryId: 'cat_food', amount: 40 },
    { categoryId: 'cat_food', amount: 16 }, { categoryId: 'cat_entertainment', amount: 68 },
    { categoryId: 'cat_food', amount: 33 }, { categoryId: 'cat_food', amount: 22 },
    { categoryId: 'cat_learning', amount: 180 }, { categoryId: 'cat_food', amount: 42 },
    { categoryId: 'cat_transport', amount: 8 }, { categoryId: 'cat_food', amount: 95 },
    { categoryId: 'cat_food', amount: 35 }, { categoryId: 'cat_medical', amount: 50 },
    { categoryId: 'cat_food', amount: 36 }, { categoryId: 'cat_food', amount: 19 },
    { categoryId: 'cat_transport', amount: 30 }, { categoryId: 'cat_shopping', amount: 150 },
    { categoryId: 'cat_food', amount: 42 },
  ];

  const budgets: Record<string, number> = {
    cat_food: 1800, cat_transport: 500, cat_entertainment: 600,
    cat_shopping: 800, cat_learning: 500, cat_social: 400,
    cat_medical: 300, cat_rent: 2500, cat_investment: 0, cat_other: 300,
  };

  const catSpending: Record<string, number> = {};
  mockExpenses.forEach(e => {
    catSpending[e.categoryId] = (catSpending[e.categoryId] || 0) + e.amount;
  });

  const monthlyExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = Object.values(budgets).reduce((s, b) => s + b, 0);

  const categoryBudgetUsage = Object.entries(budgets).map(([catId, budget]) => {
    const spent = catSpending[catId] || 0;
    return {
      categoryId: catId,
      name: CAT_NAMES[catId] || '未知',
      spent,
      budget,
      usage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    };
  }).sort((a, b) => b.usage - a.usage);

  return {
    userId: 'user_1',
    userName: '小明',
    monthlyIncome: 8000,
    monthlyExpenses,
    remainingBudget: totalBudget - monthlyExpenses,
    todaySuggested: Math.max(0, Math.round((totalBudget - monthlyExpenses) / Math.max(1, 30 - new Date().getDate()))),
    totalBudget,
    savingProgress: 60,
    categoryBudgetUsage,
    categories: Object.entries(CAT_NAMES).map(([id, name]) => ({ id, name, icon: CAT_ICONS[id] || '📦' })),
    savingGoal: {
      name: '应急备用金',
      targetAmount: 15000,
      currentAmount: 9000,
      deadline: '2026-12-31',
    },
  };
}

const CAT_NAMES: Record<string, string> = {
  cat_food: '饮食', cat_transport: '交通', cat_entertainment: '娱乐',
  cat_shopping: '购物', cat_learning: '学习', cat_rent: '房租',
  cat_medical: '医疗', cat_social: '人情社交', cat_investment: '投资理财', cat_other: '其他',
};

const CAT_ICONS: Record<string, string> = {
  cat_food: '🍽️', cat_transport: '🚗', cat_entertainment: '🎮',
  cat_shopping: '🛍️', cat_learning: '📚', cat_rent: '🏠',
  cat_medical: '💊', cat_social: '🎁', cat_investment: '📈', cat_other: '📦',
};

// ── Vercel Serverless Handler ──────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const ctx = getContext();

    // Step 1: Supervisor — classify intent
    const { intent } = await supervisorAgent(message);
    console.log(`[Supervisor] Intent: ${intent} | "${message.slice(0, 50)}"`);

    // Step 2: Route to specialist Agent
    let response: { answer: string; intent: string; agentUsed: string; records?: unknown[] };

    switch (intent) {
      case 'record':
        response = await recorderAgent(message, ctx);
        break;
      case 'analyze':
        response = await analyzerAgent(message, ctx);
        break;
      case 'budget':
        response = await budgeterAgent(message, ctx);
        break;
      case 'saving':
        response = await saverAgent(message, ctx);
        break;
      case 'finance_edu':
        response = await educatorAgent(message, ctx);
        break;
      case 'decision': {
        const analyzeResp = await analyzerAgent(
          `用户想买东西，问题：${message}。请分析是否在预算范围内。`,
          ctx
        );
        response = { ...analyzeResp, intent: 'decision' };
        break;
      }
      default:
        response = {
          answer: `你好！我是你的 AI 财务助手 💰\n\n我可以帮你：\n• 📝 记账：直接告诉我花了多少钱\n• 📊 分析：问"我这个月哪里花多了"\n• 💡 预算：问"帮我优化预算"\n• 🎯 储蓄：问"我想半年攒1万"\n• 📖 理财：问"每月结余怎么规划"\n\n请告诉我你需要什么帮助？`,
          intent: 'general',
          agentUsed: 'Supervisor Agent',
        };
    }

    // Step 3: Compliance check (for finance and saving)
    if (intent === 'finance_edu' || intent === 'saving') {
      const check = await complianceAgent(response.answer);
      if (check.status === 'violation' && check.fixedAnswer) {
        response.answer = check.fixedAnswer;
        response.agentUsed += ' → ⚠️ 风控修正';
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('[Agent Error]', error);
    res.status(500).json({
      answer: '抱歉，AI 助手暂时不可用，请稍后再试。',
      intent: 'error',
      agentUsed: 'Error Handler',
    });
  }
}
