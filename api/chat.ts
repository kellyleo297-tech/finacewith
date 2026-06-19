import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { supervisorAgent } from '../server/agents/supervisor.js';
import { callLLM, callLLMStream } from '../server/config.js';
import { complianceAgent } from '../server/agents/compliance.js';
import type { AgentContext } from '../server/types.js';

// ── Supabase server client ─────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// ── Constants ──────────────────────────────────────────
const CAT_KEYS = ['cat_food','cat_transport','cat_entertainment','cat_shopping','cat_learning','cat_rent','cat_medical','cat_social','cat_investment','cat_other'];
const CAT_NAMES: Record<string, string> = {
  cat_food: '饮食', cat_transport: '交通', cat_entertainment: '娱乐',
  cat_shopping: '购物', cat_learning: '学习', cat_rent: '房租',
  cat_medical: '医疗', cat_social: '人情社交', cat_investment: '投资理财', cat_other: '其他',
};

// ── Build context from Supabase ────────────────────────
async function getContext(userId: string): Promise<AgentContext> {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Fetch user
  const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();

  // Fetch expenses this month
  const { data: expData } = await supabase.from('expenses').select('*').eq('user_id', userId).gte('expense_date', `${month}-01`);

  // Fetch budgets
  const { data: budData } = await supabase.from('budgets').select('*').eq('user_id', userId).eq('month', month);

  // Fetch saving goals
  const { data: goalData } = await supabase.from('saving_goals').select('*').eq('user_id', userId).eq('status', 'active');

  const expenses = expData || [];
  const budgets = budData || [];
  const monthlyExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  // Calculate per-category spending
  const catSpending: Record<string, number> = {};
  expenses.forEach((e: any) => {
    catSpending[e.category_id] = (catSpending[e.category_id] || 0) + Number(e.amount);
  });

  // Build budget usage list
  const categoryBudgetUsage = budgets.map((b: any) => {
    const spent = catSpending[b.category_id] || 0;
    return {
      categoryId: b.category_id,
      name: CAT_NAMES[b.category_id] || b.category_id,
      spent,
      budget: Number(b.amount),
      usage: Number(b.amount) > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0,
    };
  }).sort((a: any, b: any) => b.usage - a.usage);

  // If no budgets yet, fill missing categories
  CAT_KEYS.forEach(key => {
    if (!categoryBudgetUsage.find((c: any) => c.categoryId === key)) {
      categoryBudgetUsage.push({ categoryId: key, name: CAT_NAMES[key], spent: catSpending[key] || 0, budget: 0, usage: 0 });
    }
  });

  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const remainingBudget = totalBudget - monthlyExpenses;
  const daysLeft = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate());

  return {
    userId,
    userName: userData?.name || '用户',
    monthlyIncome: Number(userData?.monthly_income) || 0,
    monthlyExpenses,
    remainingBudget,
    todaySuggested: Math.max(0, Math.round(remainingBudget / daysLeft)),
    totalBudget,
    savingProgress: goalData?.[0] ? Math.round((Number(goalData[0].current_amount) / Number(goalData[0].target_amount)) * 100) : 0,
    categoryBudgetUsage,
    categories: CAT_KEYS.map(key => ({ id: key, name: CAT_NAMES[key], icon: '📦' })),
    savingGoal: goalData?.[0] ? {
      name: goalData[0].name,
      targetAmount: Number(goalData[0].target_amount),
      currentAmount: Number(goalData[0].current_amount),
      deadline: goalData[0].deadline,
    } : undefined,
  };
}

// ── Build specialist prompt ────────────────────────────
function buildSpecialistPrompt(intent: string, ctx: AgentContext, userMessage: string): string | null {
  const catUsage = ctx.categoryBudgetUsage.map(c =>
    `- ${c.name}：已花 ¥${c.spent} / 预算 ¥${c.budget}（${c.usage}%）`
  ).join('\n');

  switch (intent) {
    case 'record':
      return `你是记账 Agent。从自然语言提取消费记录，输出 JSON：{"answer":"确认回复","records":[{"amount":数字,"categoryId":"cat_xxx","note":"备注","date":"YYYY-MM-DD"}]}。分类: cat_food(饮食) cat_transport(交通) cat_entertainment(娱乐) cat_shopping(购物) cat_learning(学习) cat_social(社交) cat_medical(医疗) cat_other(其他)。只输出JSON。`;
    case 'analyze':
      return `你是消费分析 Agent。基于用户真实数据做分析，不编造数据。用户:${ctx.userName} 月收入:¥${ctx.monthlyIncome} 已支出:¥${ctx.monthlyExpenses} 剩余:¥${ctx.remainingBudget} 储蓄进度:${ctx.savingProgress}%\n分类预算:\n${catUsage}\n问题:${userMessage}\n输出 JSON：{"answer":"分析(Markdown)","agentUsed":"Supervisor → 消费分析 Agent"}。只输出JSON。`;
    case 'budget':
      return `你是预算规划 Agent。用户:${ctx.userName} 月收入:¥${ctx.monthlyIncome} 已支出:¥${ctx.monthlyExpenses} 总预算:¥${ctx.totalBudget}\n分类:\n${catUsage}\n问题:${userMessage}\n输出 JSON：{"answer":"预算建议(Markdown)","agentUsed":"Supervisor → 预算规划 Agent"}。只输出JSON。`;
    case 'saving':
      return `你是储蓄目标 Agent。用户:${ctx.userName} 月收入:¥${ctx.monthlyIncome} 月支出:¥${ctx.monthlyExpenses} 日均可支配:¥${ctx.todaySuggested}${ctx.savingGoal ? ` 目标:${ctx.savingGoal.name} ¥${ctx.savingGoal.targetAmount} 已存:¥${ctx.savingGoal.currentAmount}` : ''}\n问题:${userMessage}\n输出 JSON：{"answer":"储蓄计划(Markdown)","agentUsed":"Supervisor → 储蓄目标 Agent"}。只输出JSON。`;
    case 'finance_edu':
      return `你是理财教育 Agent。原则: 不推荐具体股票/基金代码、不承诺收益、不诱导借钱投资、必须含风险提示。用户月收入:¥${ctx.monthlyIncome} 月支出:¥${ctx.monthlyExpenses} 结余:¥${ctx.monthlyIncome - ctx.monthlyExpenses}\n问题:${userMessage}\n输出 JSON：{"answer":"回复(Markdown，必须含⚠️风险提示)","agentUsed":"Supervisor → 理财教育 Agent"}。只输出JSON。`;
    case 'decision':
      return `你是消费决策 Agent。用户:${ctx.userName} 剩余预算:¥${ctx.remainingBudget} 今日可花:¥${ctx.todaySuggested}\n问题:${userMessage}\n输出 JSON：{"answer":"购买建议分析","agentUsed":"Supervisor → 消费分析 Agent"}。只输出JSON。`;
    default:
      return null;
  }
}

function getAgentLabel(intent: string): string {
  const map: Record<string, string> = {
    record: 'Supervisor Agent → 记账 Agent',
    analyze: 'Supervisor Agent → 消费分析 Agent',
    budget: 'Supervisor Agent → 预算规划 Agent',
    saving: 'Supervisor Agent → 储蓄目标 Agent',
    finance_edu: 'Supervisor Agent → 理财教育 Agent',
    decision: 'Supervisor Agent → 消费分析 Agent',
    general: 'Supervisor Agent',
  };
  return map[intent] || 'Supervisor Agent';
}

function tryParseJSON(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text); } catch { /* continue */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* nope */ } }
  return null;
}

// ── Vercel Handler ─────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { message, stream: wantStream, userId } = req.body;
    if (!message) { res.status(400).json({ error: 'message is required' }); return; }

    // Build context from Supabase (or fallback to empty)
    const ctx = userId
      ? await getContext(userId)
      : {
          userId: '', userName: '用户', monthlyIncome: 8000, monthlyExpenses: 0,
          remainingBudget: 8000, todaySuggested: 266, totalBudget: 8000,
          savingProgress: 0, categoryBudgetUsage: [], categories: [],
          savingGoal: undefined,
        };

    // Step 1: Supervisor
    const { intent } = await supervisorAgent(message);

    // Step 2: Build specialist prompt
    const sysPrompt = buildSpecialistPrompt(intent, ctx, message);
    const agentLabel = getAgentLabel(intent);

    if (!sysPrompt) {
      const answer = `你好！我是你的 AI 财务助手 💰\n\n我可以帮你：\n• 📝 记账：直接告诉我花了多少钱\n• 📊 分析：问"我这个月哪里花多了"\n• 💡 预算：问"帮我优化预算"\n• 🎯 储蓄：问"我想半年攒1万"\n• 📖 理财：问"每月结余怎么规划"\n\n请告诉我你需要什么帮助？`;
      res.status(200).json({ answer, intent, agentUsed: agentLabel });
      return;
    }

    // ── Streaming mode ──────────────────────────────
    if (wantStream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      let fullText = '';
      try {
        for await (const token of callLLMStream(sysPrompt, message, { temperature: 0.5 })) {
          fullText += token;
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        }
        const parsed = tryParseJSON(fullText);
        const answer = (parsed?.answer as string) || fullText;
        const records = parsed?.records;

        let finalAgent = agentLabel;
        if (intent === 'finance_edu' || intent === 'saving') {
          const check = await complianceAgent(answer);
          if (check.status === 'violation' && check.fixedAnswer) {
            res.write(`data: ${JSON.stringify({ type: 'override', content: check.fixedAnswer })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', intent, agentUsed: agentLabel + ' → ⚠️ 风控修正', records })}\n\n`);
            res.end(); return;
          }
        }
        res.write(`data: ${JSON.stringify({ type: 'done', intent, agentUsed: finalAgent, records })}\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: '生成中断，请重试' })}\n\n`);
      }
      res.end();
      return;
    }

    // ── Non-streaming ───────────────────────────────
    const rawText = await callLLM(sysPrompt, message, { temperature: 0.5, jsonMode: true });
    const parsed = tryParseJSON(rawText);
    const answer = (parsed?.answer as string) || rawText;
    const records = parsed?.records;

    if (intent === 'finance_edu' || intent === 'saving') {
      const check = await complianceAgent(answer);
      if (check.status === 'violation' && check.fixedAnswer) {
        res.status(200).json({ answer: check.fixedAnswer, intent, agentUsed: agentLabel + ' → ⚠️ 风控修正', records });
        return;
      }
    }
    res.status(200).json({ answer, intent, agentUsed: agentLabel, records });
  } catch (error) {
    console.error('[Agent Error]', error);
    res.status(500).json({ answer: '抱歉，AI 助手暂时不可用。', intent: 'error', agentUsed: 'Error Handler' });
  }
}
