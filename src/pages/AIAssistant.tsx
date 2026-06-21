import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Check, Sparkles, Clock, Trash2, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { QUICK_QUESTIONS } from '../data/mockData';
import type { Conversation } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentUsed?: string;
  intent?: string;
  records?: { amount: number; categoryId: string; note: string; date: string }[];
  recordsConfirmed?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

const HISTORY_LIMIT = 20; // Number of recent messages to send as context

export default function AIAssistant() {
  const { state, addConversation, addMultipleExpenses } = useApp();
  const { user: authUser } = useAuth();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `你好 ${state.user.name}！我是你的 AI 财务助手 💰\n\n我可以帮你：\n• 📝 快速记账（直接说"午饭花了35"）\n• 📊 分析消费结构和超支原因\n• 💡 生成预算优化方案\n• 🎯 拆解储蓄目标\n• 📖 解答基础理财知识\n\n试试下面的快捷问题，或者直接告诉我你想做什么～`,
      agentUsed: 'Supervisor Agent',
    },
  ]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load past conversations from Supabase
  useEffect(() => {
    if (!authUser?.id) return;
    supabase
      .from('conversations')
      .select('id, question, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const sessions: ChatSession[] = data.map((d: any) => ({
            id: d.id,
            title: d.question.slice(0, 30) + (d.question.length > 30 ? '...' : ''),
            createdAt: d.created_at,
          }));
          setHistory(sessions);
        }
      });
  }, [authUser?.id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context from recent messages
  const buildContext = useCallback((): string => {
    const recent = messages
      .filter(m => m.role !== 'assistant' || m.agentUsed !== '...')
      .slice(-HISTORY_LIMIT);
    if (recent.length <= 1) return '';

    return recent
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 200)}`)
      .join('\n');
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isThinking) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '', agentUsed: '...' }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const conversationContext = buildContext();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          stream: true,
          userId: authUser?.id,
          history: conversationContext,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalIntent = '';
      let finalAgent = '';
      let finalRecords: Message['records'];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (!data.trim()) continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'token') {
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], content: updated[lastIdx].content + event.content };
                }
                return updated;
              });
            } else if (event.type === 'override') {
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], content: event.content };
                }
                return updated;
              });
            } else if (event.type === 'done') {
              finalIntent = event.intent;
              finalAgent = event.agentUsed;
              finalRecords = event.records;
            }
          } catch { /* skip */ }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            agentUsed: finalAgent || 'Agent',
            intent: finalIntent,
            records: finalRecords,
          };
        }
        return updated;
      });

      if (finalIntent) {
        addConversation(question, messages[messages.length - 1]?.content || '', finalIntent as Conversation['intent'], finalAgent || 'Agent');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = { ...updated[lastIdx], content: '抱歉，我暂时无法处理你的请求。请稍后再试。', agentUsed: 'Error Handler' };
        }
        return updated;
      });
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, authUser?.id, addConversation, buildContext, messages]);

  const confirmRecords = useCallback((msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg?.records || msg.recordsConfirmed) return;

    addMultipleExpenses(msg.records.map(r => ({
      amount: r.amount,
      categoryId: r.categoryId,
      note: r.note || '',
      paymentMethod: 'wechat' as const,
      expenseDate: r.date || new Date().toISOString().slice(0, 10),
    })));

    setMessages(prev => {
      const updated = [...prev];
      updated[msgIndex] = { ...updated[msgIndex], recordsConfirmed: true };
      return updated;
    });
  }, [messages, addMultipleExpenses]);

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `你好 ${state.user.name}！我是你的 AI 财务助手 💰\n\n我可以帮你：\n• 📝 快速记账（直接说"午饭花了35"）\n• 📊 分析消费结构和超支原因\n• 💡 生成预算优化方案\n• 🎯 拆解储蓄目标\n• 📖 解答基础理财知识\n\n试试下面的快捷问题，或者直接告诉我你想做什么～`,
      agentUsed: 'Supervisor Agent',
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        {showHistory ? (
          <button onClick={() => setShowHistory(false)} className="p-1 text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={() => setShowHistory(true)} className="p-1 text-slate-400 hover:text-slate-600">
            <Clock className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">AI 财务助手</h2>
          <p className="text-xs text-slate-400">
            多 Agent 智能协作{isThinking ? ' · 生成中...' : messages.length > 2 ? ` · 上下文记忆已启用` : ''}
          </p>
        </div>
        {isThinking && (
          <button onClick={() => abortRef.current?.abort()} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg">
            取消
          </button>
        )}
        {messages.length > 2 && (
          <button onClick={clearChat} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="清除对话">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-56 bg-slate-50 border-r border-slate-100 overflow-y-auto flex-shrink-0 p-2">
            <p className="text-xs text-slate-400 px-2 py-1 mb-1">历史对话</p>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-2">暂无历史</p>
            ) : (
              history.map(h => (
                <div
                  key={h.id}
                  className="px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 cursor-pointer truncate"
                  title={h.title}
                >
                  {h.title}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-100' : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className="min-w-0">
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                    {isThinking && i === messages.length - 1 && msg.role === 'assistant' && msg.content && (
                      <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-0.5 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>

                  {msg.records && msg.records.length > 0 && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> 识别到 {msg.records.length} 笔消费
                        </span>
                        {msg.recordsConfirmed ? (
                          <span className="text-xs text-emerald-500 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 已记录
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmRecords(i)}
                            className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> 确认记录
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {msg.records.map((r, ri) => {
                          const cat = state.categories.find(c => c.id === r.categoryId);
                          return (
                            <div key={ri} className="flex justify-between text-xs text-slate-600">
                              <span>{cat?.icon || '📦'} {r.note || cat?.name || '支出'}</span>
                              <span className="font-medium">¥{r.amount}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {msg.agentUsed && msg.agentUsed !== '...' && (
                    <p className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      🤖 {msg.agentUsed}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isThinking && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-slate-400">AI 思考中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <p className="text-xs text-slate-400 mb-2">快捷问题：</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q.text)}
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
            placeholder={messages.length > 2 ? "继续对话，AI 记得上下文..." : "输入问题或消费内容..."}
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
