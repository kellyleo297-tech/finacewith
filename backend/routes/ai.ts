import { Router, type Response } from 'express';
import { verifyToken, type AuthRequest } from '../middleware/auth.js';
import { supervisorAgent } from '../../server/agents/supervisor.js';
import { callLLM, callLLMStream } from '../../server/config.js';
import { complianceAgent } from '../../server/agents/compliance.js';
import { db } from '../db.js';
import type { AgentContext } from '../../server/types.js';

const router = Router();
router.use(verifyToken);

const CAT_NAMES: Record<string, string> = {
  cat_food: '饮食', cat_transport: '交通', cat_entertainment: '娱乐',
  cat_shopping: '购物', cat_learning: '学习', cat_rent: '房租',
  cat_medical: '医疗', cat_social: '人情社交', cat_investment: '投资理财', cat_other: '其他',
};
const CAT_KEYS = Object.keys(CAT_NAMES);

async function getContext(userId: string): Promise<AgentContext> {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const { data: userData } = await db.from('users').select('*').eq('id', userId).single();
  const { data: expData } = await db.from('expenses').select('*').eq('user_id', userId).gte('expense_date', `${month}-01`);
  const { data: budData } = await db.from('budgets').select('*').eq('user_id', userId).eq('month', month);
  const { data: goalData } = await db.from('saving_goals').select('*').eq('user_id', userId).eq('status', 'active');

  const expenses = expData || [];
  const monthlyExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const catSpending: Record<string, number> = {};
  expenses.forEach((e: any) => { catSpending[e.category_id] = (catSpending[e.category_id] || 0) + Number(e.amount); });

  const categoryBudgetUsage = (budData || []).map((b: any) => {
    const spent = catSpending[b.category_id] || 0;
    return { categoryId: b.category_id, name: CAT_NAMES[b.category_id] || b.category_id, spent, budget: Number(b.amount), usage: Number(b.amount) > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0 };
  }).sort((a: any, b: any) => b.usage - a.usage);

  CAT_KEYS.forEach(key => {
    if (!categoryBudgetUsage.find((c: any) => c.categoryId === key)) {
      categoryBudgetUsage.push({ categoryId: key, name: CAT_NAMES[key], spent: catSpending[key] || 0, budget: 0, usage: 0 });
    }
  });

  const totalBudget = (budData || []).reduce((s: number, b: any) => s + Number(b.amount), 0);
  const remainingBudget = totalBudget - monthlyExpenses;
  const daysLeft = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate());

  return {
    userId, userName: userData?.name || '用户',
    monthlyIncome: Number(userData?.monthly_income) || 0,
    monthlyExpenses, remainingBudget,
    todaySuggested: Math.max(0, Math.round(remainingBudget / daysLeft)),
    totalBudget, savingProgress: goalData?.[0] ? Math.round((Number(goalData[0].current_amount) / Number(goalData[0].target_amount)) * 100) : 0,
    categoryBudgetUsage,
    categories: CAT_KEYS.map(key => ({ id: key, name: CAT_NAMES[key], icon: '📦' })),
    savingGoal: goalData?.[0] ? { name: goalData[0].name, targetAmount: Number(goalData[0].target_amount), currentAmount: Number(goalData[0].current_amount), deadline: goalData[0].deadline } : undefined,
  };
}

function buildPrompt(intent: string, ctx: AgentContext, userMessage: string, history?: string): string | null {
  const catUsage = ctx.categoryBudgetUsage.map(c => `- ${c.name}：已花 ¥${c.spent} / ¥${c.budget}（${c.usage}%）`).join('\n');
  const ctxHeader = history ? `\n对话历史：${history}\n` : '';

  switch (intent) {
    case 'record': return `你是记账 Agent。从自然语言提取消费记录，输出JSON：{"answer":"确认回复","records":[{"amount":数字,"categoryId":"cat_xxx","note":"备注","date":"YYYY-MM-DD"}]}。分类: cat_food cat_transport cat_entertainment cat_shopping cat_learning cat_social cat_medical cat_other。${ctxHeader}只输出JSON。`;
    case 'analyze': return `你是消费分析 Agent。用户:${ctx.userName} 月收入:¥${ctx.monthlyIncome} 已支出:¥${ctx.monthlyExpenses} 剩余:¥${ctx.remainingBudget}\n预算:\n${catUsage}${ctxHeader}问题:${userMessage}\n输出JSON：{"answer":"分析(Markdown)","agentUsed":"消费分析Agent"}。只输出JSON。`;
    case 'budget': return `你是预算规划 Agent。${ctx.userName} 月收入:¥${ctx.monthlyIncome} 已支出:¥${ctx.monthlyExpenses}\n预算:\n${catUsage}${ctxHeader}问题:${userMessage}\n输出JSON：{"answer":"建议(Markdown)","agentUsed":"预算规划Agent"}。只输出JSON。`;
    case 'saving': return `你是储蓄 Agent。${ctx.userName} 月收入:¥${ctx.monthlyIncome} 月支出:¥${ctx.monthlyExpenses}${ctx.savingGoal ? ` 目标:${ctx.savingGoal.name} ¥${ctx.savingGoal.targetAmount}` : ''}${ctxHeader}问题:${userMessage}\n输出JSON：{"answer":"计划(Markdown)","agentUsed":"储蓄Agent"}。只输出JSON。`;
    case 'finance_edu': return `你是理财教育 Agent。不推荐股票/基金代码、不承诺收益、必须含风险提示。${ctx.userName} 月收入:¥${ctx.monthlyIncome} 结余:¥${ctx.monthlyIncome - ctx.monthlyExpenses}${ctxHeader}问题:${userMessage}\n输出JSON：{"answer":"回复(Markdown，含⚠️风险提示)","agentUsed":"理财教育Agent"}。只输出JSON。`;
    case 'decision': return `你是消费决策 Agent。剩余预算:¥${ctx.remainingBudget} 今日可花:¥${ctx.todaySuggested}${ctxHeader}问题:${userMessage}\n输出JSON：{"answer":"建议分析","agentUsed":"消费分析Agent"}。只输出JSON。`;
    default: return null;
  }
}

function tryParseJSON(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

// POST /api/ai/chat
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) { res.status(400).json({ error: 'message required' }); return; }

    const ctx = await getContext(req.userId!);
    const { intent } = await supervisorAgent(message);
    const sysPrompt = buildPrompt(intent, ctx, message, history);

    if (!sysPrompt) {
      res.json({ answer: '你好！我是你的 AI 财务助手 💰\n\n我可以帮你记账、分析消费、制定预算、规划储蓄、解答理财问题。请告诉我你需要什么帮助？', intent: 'general', agentUsed: 'Supervisor' });
      return;
    }

    // Non-streaming (simpler for backend)
    const rawText = await callLLM(sysPrompt, message, { temperature: 0.5, jsonMode: true });
    const parsed = tryParseJSON(rawText);
    let answer = (parsed?.answer as string) || rawText;
    const records = parsed?.records;
    let agentLabel = (parsed?.agentUsed as string) || `Agent: ${intent}`;

    // Compliance check
    if (intent === 'finance_edu' || intent === 'saving') {
      const check = await complianceAgent(answer);
      if (check.status === 'violation' && check.fixedAnswer) {
        answer = check.fixedAnswer;
        agentLabel += ' → ⚠️ 风控修正';
      }
    }

    res.json({ answer, intent, agentUsed: agentLabel, records });
  } catch (e) {
    console.error('[AI Error]', e);
    res.status(500).json({ answer: '抱歉，AI 助手暂时不可用。', intent: 'error', agentUsed: 'Error' });
  }
});

export default router;
