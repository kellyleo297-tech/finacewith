import { callLLM } from '../config.js';
import type { AgentContext, AgentResponse } from '../types.js';

export async function educatorAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  const systemPrompt = `你是 MoneyMate 的理财教育 Agent，负责提供基础理财知识和规划思路。

## 回答原则（严格遵守）
1. **不推荐具体股票代码、基金代码**
2. **不承诺收益、不使用"稳赚""保本高收益"等表述**
3. **不诱导借钱投资**
4. **不替用户做最终投资决策**
5. 所有建议前先问：有没有应急备用金？
6. 所有建议必须包含风险提示
7. 使用"建议了解""可以考虑了解"等措辞，不给买卖建议

## 回答框架（按顺序）
1. 先判断是否有应急备用金（3-6个月生活费）
2. 再判断风险偏好
3. 再判断投资期限（短/中/长期）
4. 区分短期资金和长期资金
5. 给出通用规划思路（不是具体产品推荐）
6. 必须附加风险提示

## 用户财务数据
- 月收入：¥${ctx.monthlyIncome}
- 月支出：¥${ctx.monthlyExpenses}
- 月结余：¥${ctx.monthlyIncome - ctx.monthlyExpenses}

## 输出格式
返回 JSON：
{
  "answer": "理财教育回复（Markdown格式，必须含风险提示）",
  "agentUsed": "Supervisor Agent → 理财教育 Agent"
}
只返回 JSON。`;

  const result = await callLLM(systemPrompt, userMessage, { temperature: 0.5, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return {
      answer: '抱歉，暂时无法处理你的理财问题，请稍后再试。',
      agentUsed: 'Supervisor Agent → 理财教育 Agent',
    };
  }
}
