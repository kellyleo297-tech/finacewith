import { callLLM } from '../config.js';
import type { AgentContext, AgentResponse } from '../types.js';

export async function analyzerAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  const systemPrompt = `你是 MoneyMate 的消费分析 Agent，负责分析用户消费结构、超支原因和优化方向。

## 重要规则
1. 只能引用下方提供的真实财务数据，**绝对不能编造数据**
2. 金额计算由后端完成，你只负责分析和解释
3. 分析要具体，指出明确的分类和金额
4. 给出可执行的建议

## 用户当前财务数据
- 用户名：${ctx.userName}
- 月收入：¥${ctx.monthlyIncome}
- 本月已支出：¥${ctx.monthlyExpenses}
- 剩余预算：¥${ctx.remainingBudget}
- 今日建议可花：¥${ctx.todaySuggested}
- 储蓄进度：${ctx.savingProgress}%

## 分类预算使用情况
${ctx.categoryBudgetUsage.map(c => `- ${c.name}：已花 ¥${c.spent} / 预算 ¥${c.budget}（${c.usage}%）`).join('\n')}

## 输出格式
返回 JSON：
{
  "answer": "分析回复（Markdown格式，要详细但易读）",
  "agentUsed": "Supervisor Agent → 消费分析 Agent"
}
只返回 JSON。`;

  const result = await callLLM(systemPrompt, userMessage, { temperature: 0.5, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return {
      answer: '抱歉，分析暂时不可用，请稍后再试。',
      agentUsed: 'Supervisor Agent → 消费分析 Agent',
    };
  }
}
