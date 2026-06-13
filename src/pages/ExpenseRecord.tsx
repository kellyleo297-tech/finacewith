import { useState } from 'react';
import { Sparkles, Trash2, Check, X, Mic, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PAYMENT_METHODS } from '../data/mockData';
import type { Expense } from '../types';

export default function ExpenseRecord() {
  const { state, addExpense, deleteExpense } = useApp();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('wechat');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showSuccess, setShowSuccess] = useState(false);

  // Natural language input
  const [nlInput, setNlInput] = useState('');
  const [nlParsed, setNlParsed] = useState<{ amount: number; categoryId: string; note: string }[] | null>(null);
  const [showNL, setShowNL] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    addExpense({
      amount: parseFloat(amount),
      categoryId,
      note: note || state.categories.find(c => c.id === categoryId)?.name || '',
      paymentMethod,
      expenseDate: date,
    });

    // Reset
    setAmount('');
    setNote('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleNaturalLanguage = () => {
    // Simple NL parsing simulation
    const input = nlInput.trim();
    if (!input) return;

    const results: { amount: number; categoryId: string; note: string }[] = [];
    // Pattern: keyword + amount
    const patterns = [
      { regex: /(?:午饭|晚饭|早餐|午餐|晚餐|外卖|食堂|聚餐|吃饭|零食|奶茶|咖啡|水果).*?(\d+)/g, cat: 'cat_food' },
      { regex: /(?:打车|地铁|公交|通勤|加油|停车|火车|飞机).*?(\d+)/g, cat: 'cat_transport' },
      { regex: /(?:电影|游戏|演出|KTV|唱歌|旅游|景点).*?(\d+)/g, cat: 'cat_entertainment' },
      { regex: /(?:衣服|鞋子|数码|美妆|化妆品|包包|耳机|手机).*?(\d+)/g, cat: 'cat_shopping' },
      { regex: /(?:课程|书籍|资料|培训|考试|报名).*?(\d+)/g, cat: 'cat_learning' },
      { regex: /(?:房租|物业|水电|网费).*?(\d+)/g, cat: 'cat_rent' },
      { regex: /(?:药|体检|看病|医院|挂号).*?(\d+)/g, cat: 'cat_medical' },
      { regex: /(?:礼物|红包|聚餐|请客|聚会|婚礼).*?(\d+)/g, cat: 'cat_social' },
    ];

    for (const { regex, cat } of patterns) {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      while ((match = regexCopy.exec(input)) !== null) {
        results.push({
          amount: parseInt(match[1]),
          categoryId: cat,
          note: match[0].replace(match[1], '').trim() || state.categories.find(c => c.id === cat)?.name || '',
        });
      }
    }

    // Generic amount pattern
    if (results.length === 0) {
      const genericMatch = input.match(/(\d+)/);
      if (genericMatch) {
        results.push({
          amount: parseInt(genericMatch[1]),
          categoryId: 'cat_other',
          note: input.replace(genericMatch[1], '').trim(),
        });
      }
    }

    if (results.length > 0) {
      setNlParsed(results);
    }
  };

  const confirmNLParsed = () => {
    if (!nlParsed) return;
    nlParsed.forEach(item => {
      addExpense({
        amount: item.amount,
        categoryId: item.categoryId,
        note: item.note,
        paymentMethod: 'wechat',
        expenseDate: new Date().toISOString().slice(0, 10),
      });
    });
    setNlInput('');
    setNlParsed(null);
    setShowNL(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  // Recent expenses
  const recentExpenses = state.expenses.slice(0, 10);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
          ✅ 记账成功
        </div>
      )}

      <h2 className="text-xl font-bold text-slate-800">记一笔</h2>

      {/* Quick Record Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        {/* Amount */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">金额</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">¥</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-3 text-3xl font-bold text-slate-800 bg-slate-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300"
              autoFocus
            />
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <label className="text-xs text-slate-500 mb-2 block">分类</label>
          <div className="grid grid-cols-5 gap-2">
            {state.categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  categoryId === cat.id
                    ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note, Date, Payment in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">备注</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="添加备注..."
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">日期</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-xs text-slate-500 mb-2 block">支付方式</label>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value as Expense['paymentMethod'])}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  paymentMethod === pm.value
                    ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{pm.icon}</span>
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          保存支出
        </button>
      </form>

      {/* Natural Language Entry */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <button
          onClick={() => setShowNL(!showNL)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-700">自然语言记账</span>
          </div>
          <span className="text-xs text-slate-400">AI 智能识别</span>
        </button>

        {showNL && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNaturalLanguage()}
                placeholder='例如："今天午饭花了35，奶茶18"'
                className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleNaturalLanguage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                解析
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg text-xs text-slate-500 hover:bg-slate-200 transition-colors">
                <Mic className="w-3.5 h-3.5" /> 语音
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg text-xs text-slate-500 hover:bg-slate-200 transition-colors">
                <Image className="w-3.5 h-3.5" /> 截图识别
              </button>
            </div>

            {/* Parsed Results */}
            {nlParsed && (
              <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-indigo-700">识别结果：</p>
                  <div className="flex gap-1">
                    <button onClick={confirmNLParsed} className="p-1 rounded bg-green-500 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setNlParsed(null); setNlInput(''); }} className="p-1 rounded bg-slate-300 text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {nlParsed.map((item, i) => {
                  const cat = state.categories.find(c => c.id === item.categoryId);
                  return (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>{cat?.icon} {item.note || cat?.name}</span>
                      <span className="font-semibold text-indigo-700">¥{item.amount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">最近记录</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {recentExpenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">暂无记录，开始记一笔吧</div>
          ) : (
            recentExpenses.map(exp => {
              const cat = state.categories.find(c => c.id === exp.categoryId);
              return (
                <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{exp.note || cat?.name}</p>
                      <p className="text-xs text-slate-400">
                        {cat?.name} · {exp.expenseDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">-¥{exp.amount}</span>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
