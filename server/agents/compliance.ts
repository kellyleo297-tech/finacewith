import { callLLM } from '../config';

const SYSTEM_PROMPT = `你是 MoneyMate 的风控合规 Agent，负责检查 AI 回答是否安全合规。

## 检查维度

### 红线（发现以下内容标记为 violation）
1. 推荐具体股票代码、基金代码
2. 承诺收益（"稳赚""保本""年化X%""翻倍"）
3. 诱导借钱投资、加杠杆
4. 建议"全部买入""All in"等极端操作
5. 编造不存在的用户财务数据
6. 说"现在应该买/卖某个资产"

### 黄线（发现以下内容标记为 warning）
1. 缺少风险提示
2. 未询问应急备用金就直接给投资建议
3. 未询问风险偏好就给具体方案
4. 使用"肯定""保证"等绝对化用语

### 合规要求
所有理财相关回答末尾必须包含风险提示。

## 输出格式
返回 JSON：
{
  "status": "pass" | "warning" | "violation",
  "issues": ["问题描述1", "问题描述2"],
  "fixedAnswer": "修正后的回答（如果需要修正）；如果无需修正，设为空字符串"
}
只返回 JSON，不要其他内容。`;

export async function complianceAgent(originalAnswer: string): Promise<{
  status: 'pass' | 'warning' | 'violation';
  issues: string[];
  fixedAnswer: string;
}> {
  const result = await callLLM(SYSTEM_PROMPT, `检查以下 AI 回答：\n\n${originalAnswer}`, {
    temperature: 0.1,
    jsonMode: true,
  });
  try {
    return JSON.parse(result);
  } catch {
    return { status: 'pass', issues: [], fixedAnswer: '' };
  }
}
