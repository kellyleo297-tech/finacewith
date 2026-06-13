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

  const callAgentAPI = async (question: string): Promise<{ answer: string; intent: string; agentUsed: string; records?: { amount: number; categoryId: string; note: string; date: string }[] }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
    });
    if (!res.ok) throw new Error('API error');
    return res.json();
  };

  const handleSend = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isThinking) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsThinking(true);

    try {
      const { answer, intent, agentUsed } = await callAgentAPI(question);
      setMessages(prev => [...prev, { role: 'assistant', content: answer, agentUsed, intent }]);
      addConversation(question, answer, intent as Conversation['intent'], agentUsed);
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
