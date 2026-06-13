import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QUICK_QUESTIONS } from '../data/mockData';
import type { Conversation } from '../types';

export default function AIAssistant() {
  const { state, monthlyIncome, monthlyExpenses, remainingBudget, todaySuggested, categoryBudgetUsage, savingProgress, addConversation } = useApp();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; agentUsed?: string; intent?: string }>>([
    {
      role: 'assistant',
      content: `你好 ${state.user.name}！我是你的 AI 财务助手 💰\n\n我可以帮你：\n• 📝 快速记账（自然语言输入即可）\n• 📊 分析消费结构和超支原因\n• 💡 生成预算优化方案\n• 🎯 拆解储蓄目标\n• 📖 解答基础理财知识\n\n试试下面的快捷问题，或者直接告诉我你想做什么～`,
      agentUsed: 'Supervisor Agent',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateAIResponse = (question: string): Promise<{ answer: string; intent: Conversation['intent']; agentUsed: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = generateResponse(question, {
          monthlyIncome, monthlyExpenses, remainingBudget,
          todaySuggested, categoryBudgetUsage, savingProgress,
          userName: state.user.name,
          savingGoal: state.savingGoals.find(g => g.status === 'active'),
        });
        resolve(result);
      }, 800 + Math.random() * 1200);
    });
  };

  const handleSend = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isThinking) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsThinking(true);

    try {
      const { answer, intent, agentUsed } = await simulateAIResponse(question);
      setMessages(prev => [...prev, { role: 'assistant', content: answer, agentUsed, intent }]);
      addConversation(question, answer, intent, agentUsed);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我暂时无法处理你的请求。请稍后再试。', agentUsed: 'Error Handler' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSend(q);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">AI 财务助手</h2>
            <p className="text-xs text-slate-400">多 Agent 智能协作</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-100'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-500'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.agentUsed && (
                  <p className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    🤖 {msg.agentUsed}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-400">思考中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <p className="text-xs text-slate-400 mb-2">快捷问题：</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q.text)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入问题，例如：帮我分析本月消费..."
            className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Response Generator ──────────────────────────────
interface AIContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingBudget: number;
  todaySuggested: number;
  categoryBudgetUsage: { categoryId: string; name: string; spent: number; budget: number; usage: number }[];
  savingProgress: number;
  userName: string;
  savingGoal: { name: string; targetAmount: number; currentAmount: number; deadline: string } | undefined;
}

function generateResponse(
  question: string,
  ctx: AIContext
): { answer: string; intent: Conversation['intent']; agentUsed: string } {
  const q = question.toLowerCase();

  // Intent: Record expense (natural language记账)
  if (q.includes('记') || q.includes('花了') || q.includes('买了') || q.includes('付了') || /[东西].*?\d+元?/.test(q)) {
    const intent: Conversation['intent'] = 'record';
    const agentUsed = 'Supervisor Agent → 记账 Agent';

    // Try to extract amounts
    const amounts = q.match(/\d+/g);
    if (amounts) {
      const items = amounts.map(a => `¥${a}`).join('、');
      return {
        answer: `识别到以下支出：\n\n${items}\n\n请在记账页面确认或补充分类信息。💡 提示：你可以说"午饭花了35，奶茶18"来一次性记录多笔。`,
        intent,
        agentUsed,
      };
    }
    return {
      answer: '请告诉我具体的金额和内容，例如："午饭花了35元" 或 "打车42元"。我会帮你自动分类和记录。',
      intent,
      agentUsed,
    };
  }

  // Intent: Analyze spending
  if (q.includes('分析') || q.includes('花多') || q.includes('哪里花') || q.includes('消费结构') || q.includes('复盘') || q.includes('为什么') || q.includes('攒不下')) {
    const intent: Conversation['intent'] = 'analyze';
    const agentUsed = 'Supervisor Agent → 消费分析 Agent';

    const topSpending = ctx.categoryBudgetUsage.slice(0, 3);
    const overBudget = ctx.categoryBudgetUsage.filter(c => c.usage >= 100);
    const nearBudget = ctx.categoryBudgetUsage.filter(c => c.usage >= 70 && c.usage < 100);

    let answer = `📊 **本月消费分析**\n\n`;
    answer += `本月收入：¥${ctx.monthlyIncome.toLocaleString()}\n`;
    answer += `本月支出：¥${ctx.monthlyExpenses.toLocaleString()}\n`;
    answer += `结余：¥${(ctx.monthlyIncome - ctx.monthlyExpenses).toLocaleString()}\n`;
    answer += `消费率：${ctx.monthlyIncome > 0 ? Math.round((ctx.monthlyExpenses / ctx.monthlyIncome) * 100) : 0}%\n\n`;

    answer += `**支出 TOP 3：**\n`;
    topSpending.forEach((c, i) => {
      answer += `${i + 1}. ${c.name}：¥${c.spent.toLocaleString()}（预算使用率 ${c.usage}%）\n`;
    });

    if (overBudget.length > 0) {
      answer += `\n⚠️ **超支分类：**${overBudget.map(c => c.name).join('、')}\n`;
    }
    if (nearBudget.length > 0) {
      answer += `\n⚡ **接近预算上限：**${nearBudget.map(c => `${c.name}(${c.usage}%)`).join('、')}\n`;
    }

    // Find high-frequency small expenses pattern
    answer += `\n💡 **分析洞察：**\n`;
    answer += `你的消费主要集中在高频小额支出上（外卖、奶茶、咖啡等），这类支出单笔金额不大，但累积起来占比很高。建议设置每周外卖/奶茶次数上限，或使用"今日可花"进行每日额度控制。`;

    return { answer, intent, agentUsed };
  }

  // Intent: Budget planning
  if (q.includes('预算') || q.includes('制定') || q.includes('规划') || q.includes('方案') || q.includes('下月')) {
    const intent: Conversation['intent'] = 'budget';
    const agentUsed = 'Supervisor Agent → 预算规划 Agent';

    const overBudget = ctx.categoryBudgetUsage.filter(c => c.usage >= 100);
    const underBudget = ctx.categoryBudgetUsage.filter(c => c.usage < 50 && c.budget > 0);

    let answer = `📋 **预算优化方案**\n\n`;
    answer += `**当前预算执行情况：**\n`;
    answer += `总预算：¥${ctx.categoryBudgetUsage.reduce((s, c) => s + c.budget, 0).toLocaleString()}\n`;
    answer += `已使用：${ctx.monthlyExpenses > 0 ? Math.round((ctx.monthlyExpenses / ctx.categoryBudgetUsage.reduce((s, c) => s + c.budget, 0)) * 100) : 0}%\n\n`;

    if (overBudget.length > 0) {
      answer += `**建议调整：**\n`;
      overBudget.forEach(c => {
        const suggestedBudget = Math.round(c.spent * 1.1);
        answer += `• ${c.name}：从 ¥${c.budget} 上调至 ¥${suggestedBudget}（基于实际支出）\n`;
      });
    }

    if (underBudget.length > 0) {
      answer += `\n**可释放预算：**\n`;
      underBudget.slice(0, 2).forEach(c => {
        answer += `• ${c.name}：预算 ¥${c.budget}，实际支出 ¥${c.spent}，可下调至 ¥${Math.round(c.spent * 1.3)}\n`;
      });
    }

    answer += `\n💡 建议采用"50-30-20"法则：50%用于必要支出，30%用于弹性消费，20%用于储蓄。`;

    return { answer, intent, agentUsed };
  }

  // Intent: Saving goal
  if (q.includes('攒') || q.includes('储蓄') || q.includes('存钱') || q.includes('目标') || q.includes('攒钱')) {
    const intent: Conversation['intent'] = 'saving';
    const agentUsed = 'Supervisor Agent → 储蓄目标 Agent';

    let answer = `🎯 **储蓄计划分析**\n\n`;

    if (ctx.savingGoal) {
      const remaining = ctx.savingGoal.targetAmount - ctx.savingGoal.currentAmount;
      const monthlyNeeded = 1500; // user's monthly saving goal
      const monthsNeeded = Math.ceil(remaining / monthlyNeeded);

      answer += `**当前目标：**${ctx.savingGoal.name}\n`;
      answer += `目标金额：¥${ctx.savingGoal.targetAmount.toLocaleString()}\n`;
      answer += `已存：¥${ctx.savingGoal.currentAmount.toLocaleString()}（${Math.round((ctx.savingGoal.currentAmount / ctx.savingGoal.targetAmount) * 100)}%）\n`;
      answer += `剩余：¥${remaining.toLocaleString()}\n`;
      answer += `预计完成时间：${monthsNeeded} 个月后\n\n`;

      answer += `**执行计划：**\n`;
      answer += `• 每月存 ¥${monthlyNeeded.toLocaleString()}（月收入 ${ctx.monthlyIncome > 0 ? Math.round((monthlyNeeded / ctx.monthlyIncome) * 100) : 0}%）\n`;
      answer += `• 每周存 ¥${Math.round(monthlyNeeded / 4).toLocaleString()}\n`;
      answer += `• 每日存 ¥${Math.round(monthlyNeeded / 30).toLocaleString()}\n\n`;
    }

    // Generic saving goal decomposition
    if (q.includes('半年') || q.includes('6个月') || (q.includes('1万') || q.includes('10000'))) {
      answer += `\n**6个月攒1万计划：**\n\n`;
      answer += `目标：¥10,000\n`;
      answer += `每月需存：¥1,667\n`;
      answer += `每周需存：¥417\n`;
      answer += `每日需存：¥56\n\n`;
      answer += `**建议策略：**\n`;
      answer += `1. 削减高频小额消费（外卖、奶茶）→ 预计月省 ¥300-500\n`;
      answer += `2. 减少冲动购物 → 预计月省 ¥200-400\n`;
      answer += `3. 优化订阅服务 → 预计月省 ¥50-100\n`;
      answer += `4. 选择公共交通替代打车 → 预计月省 ¥200-300\n\n`;
      answer += `按此方案，每月可多存 ¥750-1,300。`;
    }

    answer += `\n💡 建议优先建立 3-6 个月生活费的应急备用金，再进行其他储蓄目标。`;

    return { answer, intent, agentUsed };
  }

  // Intent: Can I buy this? (消费决策)
  if (q.includes('可以买') || q.includes('能买') || q.includes('该不该买') || (q.includes('买') && /\d+元?/.test(q))) {
    const intent: Conversation['intent'] = 'general';
    const agentUsed = 'Supervisor Agent → 消费分析 Agent';

    const amountMatch = q.match(/(\d+)\s*元?/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 0;

    let answer = `🛒 **消费决策分析**\n\n`;

    if (amount > 0) {
      const canAfford = amount <= ctx.remainingBudget;

      answer += `你想购买的商品金额：¥${amount.toLocaleString()}\n`;
      answer += `本月剩余预算：¥${ctx.remainingBudget.toLocaleString()}\n`;
      answer += `今日建议可花：¥${ctx.todaySuggested}\n\n`;

      if (!canAfford) {
        answer += `⚠️ **不建议现在购买**\n\n`;
        answer += `这笔支出超出本月剩余预算 ¥${(amount - ctx.remainingBudget).toLocaleString()}。如果购买，你需要从其他分类调拨预算，或等待下月。\n\n`;
        answer += `建议：\n`;
        answer += `• 如果非必要，可以等下月\n`;
        answer += `• 如果是必需品，考虑从低使用率分类调拨预算\n`;
        answer += `• 也可以设置储蓄目标，分期攒钱购买`;
      } else if (amount > ctx.todaySuggested * 3) {
        answer += `⚡ **可以买，但需谨慎**\n\n`;
        answer += `这笔支出在预算范围内，但金额较大。购买后未来 ${Math.ceil(amount / Math.max(1, ctx.todaySuggested))} 天建议日均消费控制在 ¥${ctx.todaySuggested} 以内。`;
      } else {
        answer += `✅ **可以购买**\n\n`;
        answer += `这笔支出在预算安全范围内，不影响本月储蓄目标。`;
      }
    } else {
      answer += `请告诉我具体金额，我来帮你分析是否在预算范围内。例如："我现在可以买一个500元的东西吗？"`;
    }

    return { answer, intent, agentUsed };
  }

  // Intent: Finance education / 理财
  if (q.includes('理财') || q.includes('投资') || q.includes('基金') || q.includes('股票') || q.includes('规划') || q.includes('怎么规划')) {
    const intent: Conversation['intent'] = 'finance_edu';
    const agentUsed = 'Supervisor Agent → 理财教育 Agent → 风控合规 Agent';

    // Detect high-risk questions
    if (q.includes('推荐') && (q.includes('股票') || q.includes('基金') || q.includes('代码'))) {
      return {
        answer: `⚠️ **风险提示**\n\n作为 AI 财务助手，我不能直接推荐具体的股票或基金代码。投资决策需要考虑你的个人财务状况、风险承受能力、投资期限等多个因素。\n\n建议你：\n1. 先建立 3-6 个月生活费的应急备用金\n2. 完成风险偏好评估\n3. 了解不同资产类别（货币基金、债券、指数基金等）\n4. 从低风险产品开始，逐步学习\n5. 不要投入超过你能承受损失的资金\n\n我可以帮你做风险偏好测试，或者解释不同理财工具的特点。`,
        intent,
        agentUsed: 'Supervisor Agent → 理财教育 Agent → ⚠️ 风控拦截',
      };
    }

    if (q.includes('稳赚') || q.includes('保本') || q.includes('翻倍') || q.includes('借钱炒') || q.includes('全部')) {
      return {
        answer: `⚠️ **重要风险提示**\n\n不存在"稳赚不赔"或"保本高收益"的理财产品。所有投资都伴随风险，收益越高风险越大。\n\n不建议：\n• 借钱投资\n• 把所有资金投入单一产品\n• 追求短期暴富\n• 跟风买入不了解的产品\n\n建议优先：\n• 建立应急备用金（3-6个月生活费）\n• 还清高息债务\n• 根据风险偏好分散配置\n• 长期定投，而非短期投机\n\n如需了解更多，我可以帮你做基础的风险偏好评估。`,
        intent,
        agentUsed: 'Supervisor Agent → 理财教育 Agent → ⚠️ 风控拦截',
      };
    }

    let answer = `📖 **理财规划分析**\n\n`;
    answer += `在考虑理财前，建议先确认以下几点：\n\n`;
    answer += `**1. 应急备用金**\n`;
    answer += `建议准备 3-6 个月的生活费作为应急备用金。你目前月支出约 ¥${ctx.monthlyExpenses.toLocaleString()}，建议备用金 ¥${(ctx.monthlyExpenses * 3).toLocaleString()} - ¥${(ctx.monthlyExpenses * 6).toLocaleString()}。\n\n`;

    answer += `**2. 风险偏好**\n`;
    answer += `你还没有完成风险偏好测试。在投资前，建议先明确自己是保守型、稳健型还是进取型。我可以帮你做快速评估。\n\n`;

    answer += `**3. 通用规划思路**\n`;
    answer += `• 短期资金（1年内要用）：货币基金、定期存款\n`;
    answer += `• 中期资金（1-3年）：债券基金、固收+\n`;
    answer += `• 长期资金（3年以上）：指数基金定投\n`;
    answer += `• 不要把所有钱放在一个产品里\n`;
    answer += `• 定投比一次性买入更适合新手\n\n`;

    answer += `⚠️ **风险提示**：以上为通用理财教育内容，不构成具体投资建议。投资有风险，入市需谨慎。`;

    return { answer, intent, agentUsed };
  }

  // Intent: How much can I spend / remaining budget
  if (q.includes('还能花') || q.includes('剩多少') || q.includes('余额') || q.includes('多少预算')) {
    const intent: Conversation['intent'] = 'analyze';
    const agentUsed = 'Supervisor Agent → 消费分析 Agent';

    return {
      answer: `💰 **预算使用情况**\n\n本月总预算：¥${ctx.categoryBudgetUsage.reduce((s, c) => s + c.budget, 0).toLocaleString()}\n已支出：¥${ctx.monthlyExpenses.toLocaleString()}\n剩余可花：¥${ctx.remainingBudget.toLocaleString()}\n今日建议：¥${ctx.todaySuggested}\n\n${ctx.remainingBudget > 0 ? `按剩余 ${Math.max(1, 30 - new Date().getDate())} 天计算，日均可用 ¥${ctx.todaySuggested}。` : '⚠️ 预算已超支，建议调整消费计划。'}`,
      intent,
      agentUsed,
    };
  }

  // Default / General
  return {
    answer: `好的，我理解你想了解关于"${question.slice(0, 20)}${question.length > 20 ? '...' : ''}"的问题。\n\n作为你的 AI 财务助手，我可以帮你：\n\n📝 **记账**：直接告诉我花了多少钱\n📊 **分析**：问"我这个月哪里花多了"\n💡 **预算**：问"帮我制定下月预算"\n🎯 **储蓄**：问"我想半年攒1万"\n📖 **理财**：问"如何规划每月结余"\n🛒 **决策**：问"我可以买XX元的东西吗"\n\n请告诉我你想做什么？`,
    intent: 'general',
    agentUsed: 'Supervisor Agent',
  };
}
