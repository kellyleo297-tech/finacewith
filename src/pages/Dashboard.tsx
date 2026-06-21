import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, Sparkles, ChevronRight, X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const {
    state, monthlyIncome, monthlyExpenses, remainingBudget,
    todaySuggested, savingProgress, categoryBudgetUsage, markAlertRead,
    addIncome, updateUserProfile,
  } = useApp();
  const navigate = useNavigate();

  const [showIncomeEditor, setShowIncomeEditor] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editSource, setEditSource] = useState(state.user.incomeSource || '工资');

  const unreadAlerts = state.alerts.filter(a => !a.read);
  const dangerAlerts = unreadAlerts.filter(a => a.type === 'danger');
  const warningAlerts = unreadAlerts.filter(a => a.type === 'warning');
  const savingGoal = state.savingGoals.find(g => g.status === 'active');

  const handleSaveIncome = async () => {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) return;

    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await addIncome({
      amount,
      source: editSource,
      incomeDate: new Date().toISOString().slice(0, 10),
      month,
      isRecurring: true,
      note: `${month} ${editSource}`,
    });
    await updateUserProfile({ monthlyIncome: amount, incomeSource: editSource });
    setShowIncomeEditor(false);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-xl font-bold text-slate-800">你好，{state.user.name} 👋</h2>
        </div>
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI 助手
        </button>
      </div>

      {/* Income Editor Modal */}
      {showIncomeEditor && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" onClick={() => setShowIncomeEditor(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">设置本月收入</h3>
              <button onClick={() => setShowIncomeEditor(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    placeholder="8000"
                    className="w-full pl-8 pr-3 py-2.5 text-lg font-bold bg-slate-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">来源</label>
                <div className="flex flex-wrap gap-2">
                  {['工资', '生活费', '兼职', '奖学金', '理财', '其他'].map(src => (
                    <button
                      key={src}
                      onClick={() => setEditSource(src)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${editSource === src ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSaveIncome}
                disabled={!editAmount || parseFloat(editAmount) <= 0}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Core Financial Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Income — clickable */}
        <button
          onClick={() => { setEditAmount(monthlyIncome.toString()); setShowIncomeEditor(true); }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-slate-500">本月收入</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">¥{monthlyIncome.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{state.user.incomeSource || '点击设置'}</p>
        </button>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs text-slate-500">已支出</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">¥{monthlyExpenses.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">
            占比 {monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0}%
          </p>
        </div>

        {/* Remaining Budget */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border ${remainingBudget < 0 ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${remainingBudget < 0 ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Wallet className={`w-4 h-4 ${remainingBudget < 0 ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <span className="text-xs text-slate-500">剩余预算</span>
          </div>
          <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-slate-800'}`}>
            ¥{remainingBudget.toLocaleString()}
          </p>
        </div>

        {/* Today's Suggested */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs text-slate-500">今日建议可花</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">¥{todaySuggested.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">剩余 {Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())} 天</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { setEditAmount(''); setShowIncomeEditor(true); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> 记收入
        </button>
        <button
          onClick={() => navigate('/budget')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
        >
          <Wallet className="w-4 h-4" /> 管预算
        </button>
      </div>

      {/* Saving Goal Progress */}
      {savingGoal && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              🎯 储蓄目标
            </h3>
            <span className="text-sm text-indigo-600 font-medium">{savingProgress}%</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">{savingGoal.name}</span>
              <span className="text-slate-400">
                ¥{savingGoal.currentAmount.toLocaleString()} / ¥{savingGoal.targetAmount.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, savingProgress)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            截止日期：{new Date(savingGoal.deadline).toLocaleDateString('zh-CN')}
          </p>
        </div>
      )}

      {/* Alerts Section */}
      {(dangerAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            预算提醒
          </h3>
          {dangerAlerts.map(alert => (
            <div key={alert.id} onClick={() => markAlertRead(alert.id)} className="bg-red-50 border border-red-200 rounded-xl p-3 cursor-pointer animate-shake">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">超支警告</p>
                  <p className="text-xs text-red-600 mt-0.5">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
          {warningAlerts.map(alert => (
            <div key={alert.id} onClick={() => markAlertRead(alert.id)} className="bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-lg">⚡</span>
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">预算预警</p>
                  <p className="text-xs text-amber-600 mt-0.5">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Budget Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">分类预算</h3>
          <button onClick={() => navigate('/budget')} className="text-xs text-indigo-600 flex items-center gap-1">
            管理 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          {categoryBudgetUsage.slice(0, 6).map(cat => (
            <div key={cat.categoryId}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-700">
                  {CAT_ICONS[cat.categoryId] || '📦'} {cat.name}
                </span>
                <span className={`text-xs font-medium ${cat.usage >= 100 ? 'text-red-600' : cat.usage >= 70 ? 'text-amber-600' : 'text-slate-400'}`}>
                  ¥{cat.spent} / ¥{cat.budget}
                  {cat.usage >= 70 && ` (${cat.usage}%)`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cat.usage >= 100 ? 'bg-red-500' : cat.usage >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, cat.usage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestion Card */}
      <div onClick={() => navigate('/ai')} className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white cursor-pointer hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI 建议</h3>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">
          {generateAISuggestion(categoryBudgetUsage)}
        </p>
        <p className="text-xs text-white/70 mt-2">点击与 AI 助手深度分析 →</p>
      </div>

      <div className="h-4" />
    </div>
  );
}

const CAT_ICONS: Record<string, string> = {
  cat_food: '🍽️', cat_transport: '🚗', cat_entertainment: '🎮',
  cat_shopping: '🛍️', cat_learning: '📚', cat_rent: '🏠',
  cat_medical: '💊', cat_social: '🎁', cat_investment: '📈', cat_other: '📦',
};

function generateAISuggestion(usage: { name: string; usage: number; categoryId: string }[]): string {
  const maxUsage = usage[0];
  if (!maxUsage) return '你的财务状态看起来不错，继续保持！';
  if (maxUsage.usage >= 100) {
    return `你的${maxUsage.name}预算已超支！建议立即调整其他分类预算，或在下月减少该分类支出。点击获取详细优化方案。`;
  }
  if (maxUsage.usage >= 80) {
    return `你的${maxUsage.name}预算已使用 ${maxUsage.usage}%，建议未来几天控制该分类支出，以免影响储蓄目标。`;
  }
  if (maxUsage.usage >= 60) {
    return `你的${maxUsage.name}支出占比偏高，按当前节奏本月预算可能偏紧。建议提前规划。`;
  }
  return '你的财务状态良好！各项支出都在预算范围内，继续保持良好的消费习惯。';
}
