import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#64748b',
];

export default function Statistics() {
  const { state, monthlyExpenses } = useApp();
  const currentMonth = '2026-06';

  // Category pie data
  const categoryPieData = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth))
      .forEach(e => {
        map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
      });
    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = state.categories.find(c => c.id === catId);
        return { name: cat?.name || '未知', value: amount, icon: cat?.icon };
      })
      .sort((a, b) => b.value - a.value);
  }, [state.expenses, state.categories, currentMonth]);

  // Daily expense line data
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 1; i <= 12; i++) {
      days[`06-${String(i).padStart(2, '0')}`] = 0;
    }
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth))
      .forEach(e => {
        const day = e.expenseDate.slice(5);
        days[day] = (days[day] || 0) + e.amount;
      });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [state.expenses, currentMonth]);

  // Fixed vs Flexible
  const fixedCategories = ['cat_rent'];
  const fixedExpenses = useMemo(() =>
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth) && fixedCategories.includes(e.categoryId))
      .reduce((s, e) => s + e.amount, 0),
    [state.expenses, currentMonth]
  );
  const flexibleExpenses = monthlyExpenses - fixedExpenses;

  // Necessity classification
  const necessityCategories = ['cat_rent', 'cat_food', 'cat_transport', 'cat_medical'];
  const necessityExpenses = useMemo(() =>
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth) && necessityCategories.includes(e.categoryId))
      .reduce((s, e) => s + e.amount, 0),
    [state.expenses, currentMonth]
  );
  const nonNecessityExpenses = monthlyExpenses - necessityExpenses;

  // Month comparison data
  const comparisonData = useMemo(() => {
    const thisByCat = new Map<string, number>();
    state.expenses
      .filter(e => e.expenseDate.startsWith(currentMonth))
      .forEach(e => thisByCat.set(e.categoryId, (thisByCat.get(e.categoryId) || 0) + e.amount));

    const lastByCat = new Map<string, number>();
    state.expensesLastMonth
      .forEach(e => lastByCat.set(e.categoryId, (lastByCat.get(e.categoryId) || 0) + e.amount));

    const allCats = new Set([...thisByCat.keys(), ...lastByCat.keys()]);
    return Array.from(allCats).map(catId => {
      const cat = state.categories.find(c => c.id === catId);
      return {
        name: cat?.name || '未知',
        icon: cat?.icon || '📦',
        本月: thisByCat.get(catId) || 0,
        上月: lastByCat.get(catId) || 0,
      };
    }).filter(c => c.本月 > 0 || c.上月 > 0);
  }, [state.expenses, state.expensesLastMonth, state.categories, currentMonth]);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">统计分析</h2>
        <span className="text-sm text-slate-400">
          本月支出 ¥{monthlyExpenses.toLocaleString()}
        </span>
      </div>

      {/* Category Pie Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-3">分类支出占比</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `¥${Number(value).toLocaleString()}`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {categoryPieData.slice(0, 6).map((item, i) => (
            <div key={item.name} className="flex items-center gap-1 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-slate-600">{item.icon} {item.name}</span>
              <span className="text-slate-400">¥{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Expense Line Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-3">每日支出趋势</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(value) => [`¥${Number(value)}`, '支出']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fixed vs Flexible + Necessity vs Non-Necessity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">固定 vs 弹性</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">固定支出</span>
                <span className="font-medium">¥{fixedExpenses.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${monthlyExpenses > 0 ? (fixedExpenses / monthlyExpenses) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">弹性支出</span>
                <span className="font-medium">¥{flexibleExpenses.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${monthlyExpenses > 0 ? (flexibleExpenses / monthlyExpenses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">必要 vs 非必要</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">必要支出</span>
                <span className="font-medium">¥{necessityExpenses.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${monthlyExpenses > 0 ? (necessityExpenses / monthlyExpenses) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">非必要支出</span>
                <span className="font-medium">¥{nonNecessityExpenses.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${monthlyExpenses > 0 ? (nonNecessityExpenses / monthlyExpenses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Comparison */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-3">月度对比</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(value) => [`¥${Number(value)}`, '']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="本月" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="上月" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-1">日均支出</p>
          <p className="text-lg font-bold text-slate-800">
            ¥{Math.round(monthlyExpenses / Math.max(1, new Date().getDate()))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-1">最高单日</p>
          <p className="text-lg font-bold text-slate-800">
            ¥{Math.max(...dailyData.map(d => d.amount), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-1">笔数</p>
          <p className="text-lg font-bold text-slate-800">
            {state.expenses.filter(e => e.expenseDate.startsWith(currentMonth)).length}
          </p>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
