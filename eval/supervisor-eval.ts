/**
 * MoneyMate AI — Supervisor Agent 评测
 * 评测 Supervisor Agent 的规则层命中率和准确率
 *
 * 运行: npx tsx eval/supervisor-eval.ts
 */

// ── 从 supervisor.ts 复制的规则层逻辑（避免 import 依赖） ──

const RULES: { intent: string; keywords: string[][] }[] = [
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

function quickClassify(message: string): { intent: string; confidence: number; reasoning: string } | null {
  const q = message.toLowerCase();

  // Strategy: iterate rules, count matched keywords across all groups
  let bestMatch: { intent: string; confidence: number; matched: string[] } | null = null;

  for (const rule of RULES) {
    const matched: string[] = [];
    for (const group of rule.keywords) {
      for (const kw of group) {
        if (q.includes(kw) && kw.length >= 2) {
          matched.push(kw);
          break; // one match per group is enough
        }
      }
    }
    // Rule fires if keywords from >= 1 group matched
    if (matched.length >= 1) {
      // Keep the rule with the most matching groups
      if (!bestMatch || matched.length > bestMatch.matched.length) {
        bestMatch = {
          intent: rule.intent,
          confidence: 0.85 + matched.length * 0.05,
          matched,
        };
      }
    }
  }

  if (bestMatch) {
    return {
      intent: bestMatch.intent,
      confidence: Math.min(bestMatch.confidence, 0.98),
      reasoning: `规则匹配: ${bestMatch.matched.join(', ')}`,
    };
  }

  // Regex fallbacks
  if (/^(我|帮我|给我)?记(一下|一笔)/.test(q) && /\d/.test(q)) {
    return { intent: 'record', confidence: 0.95, reasoning: '规则匹配: 记账指令+数字' };
  }
  if (/^(看|查|显示|告诉).{0,4}(预算|花了|余额|还剩)/.test(q)) {
    return { intent: 'analyze', confidence: 0.90, reasoning: '规则匹配: 查询指令' };
  }
  if (/^\d+$/.test(q.trim()) || /^\d+元?$/.test(q.trim())) {
    return { intent: 'record', confidence: 0.85, reasoning: '规则匹配: 纯数字输入' };
  }

  return null;
}

// ── 测试用例 ─────────────────────────────────────
interface TestCase {
  input: string;
  expectedIntent: string;
  shouldHit: boolean; // true = 期望规则层命中, false = 期望 LLM 兜底
  category: string;
}

const TEST_CASES: TestCase[] = [
  // ═══ 记账 (record) ═══
  { input: '午饭花了35', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '买了杯奶茶18', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '打车花了42元', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '帮我记一笔 晚饭外卖28', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '记一下 咖啡15', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '刚刚付了电影票120', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '35', expectedIntent: 'record', shouldHit: true, category: '记账' },
  { input: '买了点东西花了200', expectedIntent: 'record', shouldHit: false, category: '记账' },
  { input: '食堂吃饭刷卡的', expectedIntent: 'record', shouldHit: false, category: '记账' },

  // ═══ 消费分析 (analyze) ═══
  { input: '帮我分析这个月的消费', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '我这个月哪里花多了', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '为什么这个月没攒下钱', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '我还有多少预算', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '看看还剩多少钱可以花', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '这个月花了多少', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '总结一下我的消费习惯', expectedIntent: 'analyze', shouldHit: true, category: '分析' },
  { input: '我是不是花太多了', expectedIntent: 'analyze', shouldHit: false, category: '分析' },

  // ═══ 预算规划 (budget) ═══
  { input: '帮我制定下个月的预算', expectedIntent: 'budget', shouldHit: true, category: '预算' },
  { input: '怎么优化我的预算', expectedIntent: 'budget', shouldHit: true, category: '预算' },
  { input: '下月应该怎么规划', expectedIntent: 'budget', shouldHit: true, category: '预算' },
  { input: '给我一个预算方案', expectedIntent: 'budget', shouldHit: true, category: '预算' },
  { input: '预算超了怎么办', expectedIntent: 'budget', shouldHit: false, category: '预算' },

  // ═══ 储蓄 (saving) ═══
  { input: '我想半年攒1万', expectedIntent: 'saving', shouldHit: true, category: '储蓄' },
  { input: '怎么存钱比较快', expectedIntent: 'saving', shouldHit: true, category: '储蓄' },
  { input: '帮我定一个储蓄目标', expectedIntent: 'saving', shouldHit: true, category: '储蓄' },
  { input: '我想每月存1500', expectedIntent: 'saving', shouldHit: true, category: '储蓄' },
  { input: '有什么省钱的方法', expectedIntent: 'saving', shouldHit: false, category: '储蓄' },

  // ═══ 理财教育 (finance_edu) ═══
  { input: '怎么开始学理财', expectedIntent: 'finance_edu', shouldHit: true, category: '理财' },
  { input: '基金和股票有什么区别', expectedIntent: 'finance_edu', shouldHit: true, category: '理财' },
  { input: '新手怎么入门投资', expectedIntent: 'finance_edu', shouldHit: true, category: '理财' },
  { input: '定投是什么', expectedIntent: 'finance_edu', shouldHit: true, category: '理财' },
  { input: '债券和基金哪个风险大', expectedIntent: 'finance_edu', shouldHit: true, category: '理财' },
  { input: '我适合买理财吗', expectedIntent: 'finance_edu', shouldHit: false, category: '理财' },

  // ═══ 消费决策 (decision) ═══
  { input: '我能买这个500元的手表吗', expectedIntent: 'decision', shouldHit: true, category: '决策' },
  { input: 'AirPods该不该买', expectedIntent: 'decision', shouldHit: true, category: '决策' },
  { input: '现在能不能买一台switch', expectedIntent: 'decision', shouldHit: true, category: '决策' },
  { input: '这个耳机值得买吗', expectedIntent: 'decision', shouldHit: true, category: '决策' },
  { input: '纠结要不要买', expectedIntent: 'decision', shouldHit: false, category: '决策' },

  // ═══ 边界 / 模糊 (general) ═══
  { input: '你好', expectedIntent: 'general', shouldHit: false, category: '闲聊' },
  { input: '你是谁', expectedIntent: 'general', shouldHit: false, category: '闲聊' },
  { input: '今天天气不错', expectedIntent: 'general', shouldHit: false, category: '闲聊' },
  { input: '谢谢', expectedIntent: 'general', shouldHit: false, category: '闲聊' },
];

// ── 执行评测 ────────────────────────────────────
interface Result {
  input: string;
  expected: string;
  actual: string | null;
  hit: boolean;
  correct: boolean;
  category: string;
}

const results: Result[] = [];

for (const tc of TEST_CASES) {
  const result = quickClassify(tc.input);

  let correct = false;
  if (tc.shouldHit) {
    // 期望规则层命中 → 检查 intent 是否正确
    correct = result !== null && result.intent === tc.expectedIntent;
  } else {
    // 期望规则层未命中（走 LLM）
    correct = result === null;
  }

  results.push({
    input: tc.input,
    expected: tc.expectedIntent,
    actual: result?.intent ?? null,
    hit: result !== null,
    correct,
    category: tc.category,
  });
}

// ── 输出报告 ────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log('║   MoneyMate AI — Supervisor 评测报告    ║');
console.log('╚══════════════════════════════════════════╝\n');

// 按分类展示
const categories = [...new Set(results.map(r => r.category))];
for (const cat of categories) {
  const catResults = results.filter(r => r.category === cat);
  const correct = catResults.filter(r => r.correct).length;
  console.log(`\n── ${cat} (${correct}/${catResults.length}) ──`);
  for (const r of catResults) {
    const icon = r.correct ? '✅' : '❌';
    const status = r.hit
      ? `规则命中 → ${r.actual}`
      : `未命中 → LLM 兜底`;
    if (!r.correct) {
      console.log(`  ${icon} "${r.input}"`);
      console.log(`     期望: ${r.expected} | ${status}`);
    }
  }
}

// 汇总统计
const total = results.length;
const correct = results.filter(r => r.correct).length;
const hitCount = results.filter(r => r.hit).length;
const shouldHit = TEST_CASES.filter(tc => tc.shouldHit).length;
const shouldMiss = TEST_CASES.filter(tc => !tc.shouldHit).length;
const correctHit = results.filter(r => r.correct && r.hit).length;
const correctMiss = results.filter(r => r.correct && !r.hit).length;

console.log('\n\n══════ 汇总统计 ══════\n');
console.log(`测试总数:        ${total}`);
console.log(`正确数:          ${correct}`);
console.log(`总体准确率:      ${(correct / total * 100).toFixed(1)}%`);
console.log('');
console.log(`── 规则层命中率 ──`);
console.log(`期望规则命中:    ${shouldHit}`);
console.log(`实际规则命中:    ${correctHit}`);
console.log(`命中准确率:      ${(correctHit / shouldHit * 100).toFixed(1)}%`);
console.log(`命中覆盖率:      ${(hitCount / total * 100).toFixed(1)}% (${
  hitCount}/${total})`);
console.log('');
console.log(`── LLM 兜底 ──`);
console.log(`期望 LLM 兜底:   ${shouldMiss}`);
console.log(`正确路由到 LLM:  ${correctMiss}/${shouldMiss}`);
console.log(`兜底率:          ${(shouldMiss / total * 100).toFixed(1)}%`);

// 错误分析
const errors = results.filter(r => !r.correct);
if (errors.length > 0) {
  console.log('\n── 错误分析 ──');
  for (const e of errors) {
    if (e.hit) {
      console.log(`  ❌ "${e.input}" → 误判为 ${e.actual} (实际: ${e.expected})`);
    } else {
      console.log(`  ❌ "${e.input}" → 规则层未命中 (期望命中: ${e.expected})`);
    }
  }
}
console.log('');
