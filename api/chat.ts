import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supervisorAgent } from '../server/agents/supervisor.js';
import { callLLM, callLLMStream } from '../server/config.js';
import { complianceAgent } from '../server/agents/compliance.js';
import type { AgentContext } from '../server/types.js';

// ── Context (same as before) ───────────────────────────
const CAT_NAMES: Record<string, string> = {
  cat_food: '饮食', cat_transport: '交通', cat_entertainment: '娱乐',
  cat_shopping: '购物', cat_learning: '学习', cat_rent: '房租',
  cat_medical: '医疗', cat_social: '人情社交', cat_investment: '投资理财', cat_other: '其他',
};

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
  mockExpenses.forEach(e => { catSpending[e.categoryId] = (catSpending[e.categoryId] || 0) + e.amount; });
  const monthlyExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = Object.values(budgets).reduce((s, b) => s + b, 0);
  const categoryBudgetUsage = Object.entries(budgets).map(([catId, budget]) => {
    const spent = catSpending[catId] || 0;
    return { categoryId: catId, name: CAT_NAMES[catId] || '未知', spent, budget, usage: budget > 0 ? Math.round((spent / budget) * 100) : 0 };
  }).sort((a, b) => b.usage - a.usage);

  return {
    userId: 'user_1', userName: '小明', monthlyIncome: 8000, monthlyExpenses,
    remainingBudget: totalBudget - monthlyExpenses,
    todaySuggested: Math.max(0, Math.round((totalBudget - monthlyExpenses) / Math.max(1, 30 - new Date().getDate()))),
    totalBudget, savingProgress: 60, categoryBudgetUsage,
    categories: Object.entries(CAT_NAMES).map(([id, name]) => ({ id, name, icon: '📦' })),
    savingGoal: { name: '应急备用金', targetAmount: 15000, currentAmount: 9000, deadline: '2026-12-31' },
  };
}

// ── Build specialist system prompt ─────────────────────
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
      return `你是储蓄目标 Agent。用户:${ctx.userName} 月收入:¥${ctx.monthlyIncome} 月支出:¥${ctx.monthlyExpenses} 日均:¥${ctx.todaySuggested}${ctx.savingGoal ? ` 目标:${ctx.savingGoal.name} ¥${ctx.savingGoal.targetAmount} 已存:¥${ctx.savingGoal.currentAmount}` : ''}\n问题:${userMessage}\n输出 JSON：{"answer":"储蓄计划(Markdown)","agentUsed":"Supervisor → 储蓄目标 Agent"}。只输出JSON。`;

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

// ── Helper: extract JSON from potentially malformed stream output
function tryParseJSON(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text); } catch { /* continue */ }
  // Try to find JSON block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* nope */ }
  }
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
    const { message, stream: wantStream } = req.body;
    if (!message) { res.status(400).json({ error: 'message is required' }); return; }

    const ctx = getContext();

    // Step 1: Supervisor (always non-streaming, fast)
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
      // SSE headers
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

        // Try to extract records / metadata from the full response
        const parsed = tryParseJSON(fullText);
        const answer = (parsed?.answer as string) || fullText;
        const records = parsed?.records;

        // Compliance check for finance/saving
        let finalAgent = agentLabel;
        if (intent === 'finance_edu' || intent === 'saving') {
          const check = await complianceAgent(answer);
          if (check.status === 'violation' && check.fixedAnswer) {
            // Stream the fixed answer instead
            res.write(`data: ${JSON.stringify({ type: 'override', content: check.fixedAnswer })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', intent, agentUsed: agentLabel + ' → ⚠️ 风控修正', records })}\n\n`);
            res.end();
            return;
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'done', intent, agentUsed: finalAgent, records })}\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: '生成中断，请重试' })}\n\n`);
      }
      res.end();
      return;
    }

    // ── Non-streaming mode (original behavior) ──────
    const rawText = await callLLM(sysPrompt, message, { temperature: 0.5, jsonMode: true });
    const parsed = tryParseJSON(rawText);

    const answer = (parsed?.answer as string) || rawText;
    const records = parsed?.records;

    // Compliance check
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
