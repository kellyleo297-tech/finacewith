import { callLLM } from '../config';
import type { AgentContext, AgentResponse } from '../types';

export async function saverAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  const systemPrompt = `你是 MoneyMate 的储蓄目标 Agent，负责帮用户拆解攒钱目标为可执行的月/周/日计划。

## 重要规则
1. 目标拆解要具体：月→周→日
2. 结合用户实际收支情况
3. 给出具体的省钱方向
4. 提示优先建立应急备用金

## 用户财务数据
- 月收入：¥${ctx.monthlyIncome}
- 月支出：¥${ctx.monthlyExpenses}
- 月结余：¥${ctx.monthlyIncome - ctx.monthlyExpenses}
- 日均可支配：¥${ctx.todaySuggested}
${ctx.savingGoal ? `- 当前储蓄目标：${ctx.savingGoal.name}，目标 ¥${ctx.savingGoal.targetAmount}，已存 ¥${ctx.savingGoal.currentAmount}，截止 ${ctx.savingGoal.deadline}` : ''}

## 支出最高分类
${ctx.categoryBudgetUsage.slice(0, 3).map(c => `- ${c.name}：¥${c.spent}（占 ${c.usage}%）`).join('\n')}

## 输出格式
返回 JSON：
{
  "answer": "储蓄计划回复（Markdown格式）",
  "agentUsed": "Supervisor Agent → 储蓄目标 Agent"
}
只返回 JSON。`;

  const result = await callLLM(systemPrompt, userMessage, { temperature: 0.5, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return {
      answer: '抱歉，储蓄计划生成失败，请稍后再试。',
      agentUsed: 'Supervisor Agent → 储蓄目标 Agent',
    };
  }
}
