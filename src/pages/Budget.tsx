import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Edit3, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Budget() {
  const { state, totalBudget, monthlyExpenses, categoryBudgetUsage, updateBudget, remainingBudget } = useApp();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editThreshold, setEditThreshold] = useState(70);

  const totalUsage = totalBudget > 0 ? Math.round((monthlyExpenses / totalBudget) * 100) : 0;
  const daysInMonth = 30;
  const daysPassed = new Date().getDate();
  const daysRemaining = Math.max(1, daysInMonth - daysPassed);

  const startEdit = (categoryId: string, currentAmount: number, currentThreshold: number) => {
    setEditingId(categoryId);
    setEditAmount(currentAmount.toString());
    setEditThreshold(currentThreshold);
  };

  const saveEdit = () => {
    if (editingId && editAmount) {
      updateBudget(editingId, parseFloat(editAmount), editThreshold);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // AI suggestions
  const aiSuggestions = generateBudgetSuggestions(categoryBudgetUsage);

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">预算管理</h2>

      {/* Total Budget Overview */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white/70">月度总预算</p>
            <p className="text-3xl font-bold">¥{totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">已使用</p>
            <p className="text-3xl font-bold">{totalUsage}%</p>
          </div>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, totalUsage)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/70">
          <span>已支出 ¥{monthlyExpenses.toLocaleString()}</span>
          <span>剩余 ¥{remainingBudget.toLocaleString()}</span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-white/70">
          <span>本月已过 {daysPassed} 天</span>
          <span>剩余 {daysRemaining} 天</span>
        </div>
      </div>

      {/* Category Budgets */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">分类预算</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {categoryBudgetUsage.map(cat => {
            const isEditing = editingId === cat.categoryId;
            const catData = state.categories.find(c => c.id === cat.categoryId);
            const budget = state.budgets.find(b => b.categoryId === cat.categoryId);

            return (
              <div key={cat.categoryId} className="px-4 py-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{catData?.icon}</span>
                      <span className="font-medium text-slate-700">{cat.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-400">预算金额</label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-400">提醒阈值 (%)</label>
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={e => setEditThreshold(parseInt(e.target.value) || 70)}
                          min={50}
                          max={100}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-lg text-xs">
                        <Check className="w-3 h-3" /> 保存
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs">
                        <X className="w-3 h-3" /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{catData?.icon}</span>
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => startEdit(cat.categoryId, cat.budget, budget?.alertThreshold || 70)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className={`text-xs font-medium ${
                        cat.usage >= 100 ? 'text-red-600' :
                        cat.usage >= 70 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        ¥{cat.spent.toLocaleString()} / ¥{cat.budget.toLocaleString()}
                      </span>
                      <span className={`text-xs font-bold ${
                        cat.usage >= 100 ? 'text-red-600' :
                        cat.usage >= 70 ? 'text-amber-600' : 'text-indigo-600'
                      }`}>
                        {cat.usage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.usage >= 100 ? 'bg-red-500' :
                          cat.usage >= 70 ? 'bg-amber-500' :
                          cat.usage >= 50 ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, cat.usage)}%` }}
                      />
                    </div>
                    {cat.usage >= 70 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {cat.usage >= 100 ? '⚠️ 已超支！' : `⚠️ 已达预警线 (${budget?.alertThreshold || 70}%)`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Budget Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-indigo-800">AI 预算优化建议</h3>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-indigo-400 text-sm mt-0.5">•</span>
                <p className="text-sm text-indigo-700">{s}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/ai')}
            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
          >
            与 AI 深度分析预算 →
          </button>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}

function generateBudgetSuggestions(
  usage: { name: string; usage: number; spent: number; budget: number }[]
): string[] {
  const suggestions: string[] = [];
  const overBudget = usage.filter(u => u.usage >= 100);
  const nearBudget = usage.filter(u => u.usage >= 70 && u.usage < 100);
  const underBudget = usage.filter(u => u.usage < 40 && u.budget > 0);

  if (overBudget.length > 0) {
    const names = overBudget.map(u => u.name).join('、');
    suggestions.push(`${names}已超支，建议从低使用率分类调拨预算，或减少该分类支出。`);
  }

  if (nearBudget.length > 0) {
    const mostUrgent = nearBudget.sort((a, b) => b.usage - a.usage)[0];
    suggestions.push(`${mostUrgent.name}接近预算上限（${mostUrgent.usage}%），建议未来一周控制在该分类日均 ¥${Math.round((mostUrgent.budget - mostUrgent.spent) / Math.max(1, 30 - new Date().getDate()))} 以内。`);
  }

  if (underBudget.length > 0 && overBudget.length > 0) {
    const from = underBudget[0].name;
    const to = overBudget[0].name;
    const transferAmount = Math.min(
      underBudget[0].budget - underBudget[0].spent,
      overBudget[0].spent - overBudget[0].budget
    );
    if (transferAmount > 0) {
      suggestions.push(`可将${from}的剩余预算调拨 ¥${transferAmount} 到${to}，以抵消超支。`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('各项预算使用情况良好，继续保持！');
  }

  return suggestions;
}
