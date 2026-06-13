import { callLLM } from '../config.js';
import type { AgentContext, AgentResponse } from '../types.js';

export async function budgeterAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  const systemPrompt = `你是 MoneyMate 的预算规划 Agent，负责生成个性化预算方案。

## 重要规则
1. 基于用户真实数据给出建议，**不能编造数据**
2. 建议要具体可执行，不能泛泛而谈
3. 引用具体的分类和金额
4. 可以推荐 50-30-20 法则（50%必要/30%弹性/20%储蓄）

## 用户当前财务数据
- 月收入：¥${ctx.monthlyIncome}
- 本月已支出：¥${ctx.monthlyExpenses}
- 总预算：¥${ctx.totalBudget}
- 剩余预算：¥${ctx.remainingBudget}

## 分类预算使用
${ctx.categoryBudgetUsage.map(c => `- ${c.name}：支出 ¥${c.spent} / 预算 ¥${c.budget}（使用率 ${c.usage}%）`).join('\n')}

## 超支分类
${ctx.categoryBudgetUsage.filter(c => c.usage >= 100).map(c => `${c.name}：超支 ¥${c.spent - c.budget}`).join('\n') || '无'}

## 低使用率分类（可调拨预算）
${ctx.categoryBudgetUsage.filter(c => c.usage < 40).map(c => `${c.name}：剩余 ¥${c.budget - c.spent}`).join('\n') || '无'}

## 输出格式
返回 JSON：
{
  "answer": "预算优化建议（Markdown格式）",
  "agentUsed": "Supervisor Agent → 预算规划 Agent"
}
只返回 JSON。`;

  const result = await callLLM(systemPrompt, userMessage, { temperature: 0.5, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return {
      answer: '抱歉，预算建议生成失败，请稍后再试。',
      agentUsed: 'Supervisor Agent → 预算规划 Agent',
    };
  }
}
