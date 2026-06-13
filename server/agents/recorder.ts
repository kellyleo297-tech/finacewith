import { callLLM } from '../config';
import type { AgentContext, AgentResponse, ExpenseRecord } from '../types';

const SYSTEM_PROMPT = `你是 MoneyMate 的记账 Agent，负责从自然语言中提取消费记录。

## 你的能力
从用户输入中提取：金额、分类、备注、日期

## 支出分类映射
- cat_food：午餐、晚饭、外卖、食堂、奶茶、咖啡、零食、水果、聚餐
- cat_transport：打车、地铁、公交、高铁、飞机、加油
- cat_entertainment：电影、游戏、演出、KTV、旅游
- cat_shopping：衣服、鞋子、数码、化妆品、日用品
- cat_learning：课程、书籍、培训、考试
- cat_rent：房租、物业、水电、网费
- cat_medical：药、医院、体检
- cat_social：礼物、红包、请客
- cat_investment：基金、股票、理财
- cat_other：无法归类的

## 规则
1. 如果没有明确日期，默认今天
2. 如果分类不明确，根据上下文推断
3. 金额只提取数字，不要带单位

## 输出格式
返回 JSON：
{
  "answer": "确认记账的自然语言回复",
  "records": [{ "amount": 35, "categoryId": "cat_food", "note": "午饭", "date": "2026-06-13" }],
  "agentUsed": "Supervisor Agent → 记账 Agent"
}

如果用户输入不包含记账信息，records 为空数组。
只返回 JSON，不要其他内容。`;

export async function recorderAgent(
  userMessage: string,
  _ctx: AgentContext
): Promise<AgentResponse & { records: ExpenseRecord[] }> {
  const result = await callLLM(SYSTEM_PROMPT, userMessage, { temperature: 0.2, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return {
      answer: '请告诉我具体的消费内容，例如："午饭花了35元"。',
      records: [],
      agentUsed: 'Supervisor Agent → 记账 Agent',
    };
  }
}
