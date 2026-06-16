import { callLLM } from '../config.js';

const SYSTEM_PROMPT = `你是 MoneyMate AI 的 Supervisor Agent（调度中心）。

你的职责是分析用户输入，判断用户意图，然后路由到合适的专业 Agent。

## 可路由的意图类型

1. **record** — 用户想记账。例如："午饭花了35"、"记一下打车42"、"买了杯奶茶18"
2. **analyze** — 用户想分析消费。例如："我这个月哪里花多了"、"帮我复盘"、"为什么没攒下钱"
3. **budget** — 用户想做预算。例如："帮我制定预算"、"下月怎么规划"、"预算超了怎么办"
4. **saving** — 用户想存钱/攒钱。例如："我想半年攒1万"、"怎么存钱"、"储蓄目标"
5. **finance_edu** — 用户问理财知识。例如："怎么理财"、"基金是什么"、"每月剩1500怎么规划"
6. **decision** — 用户想知道能不能买。例如："我能买这个吗"、"500元的东西该不该买"
7. **general** — 其他问题。例如：打招呼、问功能、闲聊

## 输出格式

返回 JSON：
{
  "intent": "意图类型",
  "confidence": 0.95,
  "reasoning": "简短判断理由"
}

只返回 JSON，不要其他内容。`;

interface SupervisorResult {
  intent: string;
  confidence: number;
  reasoning: string;
}

// ── Rule Layer: high-confidence keyword matching ──────
const RULES: { intent: string; keywords: string[][]; }[] = [
  {
    intent: 'record',
    keywords: [
      ['花了', '买了', '付了', '付钱', '消费了'],
      ['记', '账', '记一下', '帮我记'],
      ['午饭', '晚饭', '奶茶', '咖啡', '外卖', '打车', '地铁', '公交'],
    ],
  },
  {
    intent: 'analyze',
    keywords: [
      ['分析', '复盘', '总结', '报告'],
      ['哪里花多', '花多了', '花在哪', '消费结构'],
      ['为什么没攒', '攒不下', '没存下'],
      ['还剩多少', '还能花', '剩多少', '余额', '多少预算'],
      ['花了多少', '支出多少'],
    ],
  },
  {
    intent: 'budget',
    keywords: [
      ['制定预算', '设置预算', '调整预算', '优化预算'],
      ['预算方案', '预算建议', '预算规划'],
      ['下月', '下个月', '怎么规划'],
    ],
  },
  {
    intent: 'saving',
    keywords: [
      ['攒钱', '存钱', '储蓄', '省钱'],
      ['目标', '计划'],
      ['半年', '一年', '几个月', '每月存'],
    ],
  },
  {
    intent: 'finance_edu',
    keywords: [
      ['理财', '投资', '基金', '股票', '债券', '定投'],
      ['风险', '收益', '资产'],
      ['怎么规划', '怎么分配'],
      ['新手', '入门', '学习'],
    ],
  },
  {
    intent: 'decision',
    keywords: [
      ['能买', '可以买', '该不该买', '能不能买'],
      ['买.*吗', '买.*值'],
    ],
  },
];

function quickClassify(message: string): SupervisorResult | null {
  const q = message.toLowerCase();

  for (const rule of RULES) {
    for (const group of rule.keywords) {
      const allMatch = group.every(kw => q.includes(kw));
      if (allMatch && group.some(kw => kw.length >= 3)) {
        return {
          intent: rule.intent,
          confidence: 0.92,
          reasoning: `规则匹配: ${group.filter(kw => q.includes(kw)).join(', ')}`,
        };
      }
    }
  }

  // Single-keyword high-precision matches
  if (/^(我|帮我|给我)?记(一下|一笔)/.test(q) && /\d/.test(q)) {
    return { intent: 'record', confidence: 0.95, reasoning: '规则匹配: 记账指令+数字' };
  }
  if (/^(看|查|显示|告诉).{0,4}(预算|花了|余额|还剩)/.test(q)) {
    return { intent: 'analyze', confidence: 0.90, reasoning: '规则匹配: 查询指令' };
  }

  // Amount-only → likely recording
  if (/^\d+$/.test(q.trim()) || /^\d+元?$/.test(q.trim())) {
    return { intent: 'record', confidence: 0.85, reasoning: '规则匹配: 纯数字输入' };
  }

  return null; // No match, fall through to LLM
}

// ── Main Supervisor function ──────────────────────────
export async function supervisorAgent(userMessage: string): Promise<SupervisorResult> {
  // Step 1: Try rule layer first (fast + free)
  const quickResult = quickClassify(userMessage);
  if (quickResult && quickResult.confidence >= 0.90) {
    console.log(`[Supervisor] ⚡ Rule match: ${quickResult.intent} (${quickResult.reasoning})`);
    return quickResult;
  }

  // Step 2: Fall through to LLM for ambiguous inputs
  console.log(`[Supervisor] 🤖 LLM classify...`);
  const result = await callLLM(SYSTEM_PROMPT, userMessage, { temperature: 0.3, jsonMode: true });
  try {
    return JSON.parse(result);
  } catch {
    return { intent: 'general', confidence: 0.5, reasoning: '解析失败，默认路由' };
  }
}
