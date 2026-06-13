import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = ['身份信息', '收入设置', '固定支出', '储蓄目标', '预算模式'];

type FormFixedExpense = { name: string; amount: string };

export default function Onboarding() {
  const { state, updateUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [role, setRole] = useState(state.user.role);
  const [monthlyIncome, setMonthlyIncome] = useState(state.user.monthlyIncome.toString());
  const [incomeSource, setIncomeSource] = useState(state.user.incomeSource);
  const [fixedExpenses, setFixedExpenses] = useState<FormFixedExpense[]>(
    state.user.fixedExpenses.length > 0
      ? state.user.fixedExpenses.map(f => ({ name: f.name, amount: f.amount.toString() }))
      : [{ name: '', amount: '' }]
  );
  const [savingGoal, setSavingGoal] = useState(state.user.savingGoal.toString());
  const [budgetMode, setBudgetMode] = useState(state.user.budgetMode);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Save all data
      updateUser({
        role,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        incomeSource,
        fixedExpenses: fixedExpenses
          .filter(f => f.name && f.amount)
          .map(f => ({ name: f.name, amount: parseFloat(f.amount) || 0 })),
        savingGoal: parseFloat(savingGoal) || 0,
        budgetMode,
        isOnboarded: true,
      });
      navigate('/');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const addFixedExpense = () => {
    setFixedExpenses([...fixedExpenses, { name: '', amount: '' }]);
  };

  const updateFixedExpense = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...fixedExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFixedExpenses(updated);
  };

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!role;
      case 1: return !!monthlyIncome && parseFloat(monthlyIncome) > 0 && !!incomeSource;
      case 3: return true; // optional
      case 4: return !!budgetMode;
      default: return true;
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Progress Bar */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-indigo-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400">
          步骤 {step + 1}/{STEPS.length} · {STEPS[step]}
        </p>
      </div>

      <div className="flex-1 px-4 py-2 max-w-lg mx-auto w-full">
        {/* Step 0: Role */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">欢迎来到 MoneyMate 💰</h2>
            <p className="text-slate-500">先介绍一下你自己，我会帮你更好地规划财务。</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">你的身份</label>
              <div className="space-y-2">
                {[
                  { value: 'student', label: '🎓 学生', desc: '大学生、研究生等' },
                  { value: 'worker', label: '💼 白领', desc: '刚入职1-5年的职场新人' },
                  { value: 'freelancer', label: '🧑‍💻 自由职业', desc: '自由工作者' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value as typeof role)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      role === opt.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Income */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">你的收入情况</h2>
            <p className="text-slate-500">这会影响你的预算和储蓄计划。</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">月收入 / 生活费</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                    placeholder="8000"
                    className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">收入来源</label>
                <div className="flex flex-wrap gap-2">
                  {['工资', '生活费', '兼职', '奖学金', '理财收入', '其他'].map(src => (
                    <button
                      key={src}
                      onClick={() => setIncomeSource(src)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        incomeSource === src
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fixed Expenses */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">固定支出</h2>
            <p className="text-slate-500">填写每月固定支出，帮你更准确计算可支配金额。</p>
            <div className="space-y-3">
              {fixedExpenses.map((exp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={exp.name}
                    onChange={e => updateFixedExpense(i, 'name', e.target.value)}
                    placeholder="例如：房租"
                    className="flex-1 px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                    <input
                      type="number"
                      value={exp.amount}
                      onChange={e => updateFixedExpense(i, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fixedExpenses.length > 1 && (
                    <button
                      onClick={() => removeFixedExpense(i)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addFixedExpense}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                + 添加固定支出
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Saving Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">储蓄目标</h2>
            <p className="text-slate-500">设定每月储蓄目标，我会帮你拆解成可执行的计划。</p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">每月想存多少钱？</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                <input
                  type="number"
                  value={savingGoal}
                  onChange={e => setSavingGoal(e.target.value)}
                  placeholder="1500"
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {monthlyIncome && savingGoal && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-sm text-indigo-700">
                    储蓄率：{Math.round((parseFloat(savingGoal) / parseFloat(monthlyIncome)) * 100)}%
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">
                    {parseFloat(savingGoal) / parseFloat(monthlyIncome) > 0.3
                      ? '储蓄率较高，很棒！但也要确保基本生活质量。'
                      : parseFloat(savingGoal) / parseFloat(monthlyIncome) > 0.15
                      ? '储蓄率适中，可以考虑逐步提高。'
                      : '可以从这个目标开始，养成储蓄习惯后再逐步提高。'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Budget Mode */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">预算模式</h2>
            <p className="text-slate-500">选择适合你的预算风格。</p>
            <div className="space-y-2">
              {[
                {
                  value: 'conservative',
                  label: '🛡️ 保守型',
                  desc: '严格控制支出，优先储蓄。适合想快速攒钱的你。',
                },
                {
                  value: 'balanced',
                  label: '⚖️ 均衡型',
                  desc: '在消费和储蓄之间保持平衡。推荐大多数用户使用。',
                },
                {
                  value: 'custom',
                  label: '🎨 自定义',
                  desc: '自己设置每个分类的预算。适合有明确消费偏好的你。',
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setBudgetMode(opt.value as typeof budgetMode)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    budgetMode === opt.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">预算预览</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">月收入</span>
                  <span className="font-medium">¥{(parseFloat(monthlyIncome) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">固定支出</span>
                  <span className="font-medium">
                    ¥{fixedExpenses.filter(f => f.amount).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">储蓄目标</span>
                  <span className="font-medium">¥{(parseFloat(savingGoal) || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-indigo-600 font-medium">可变消费预算</span>
                  <span className="text-indigo-600 font-bold">
                    ¥{(
                      (parseFloat(monthlyIncome) || 0) -
                      fixedExpenses.filter(f => f.amount).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0) -
                      (parseFloat(savingGoal) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 bg-white border-t border-slate-200">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2.5 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className="flex items-center gap-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            {step === STEPS.length - 1 ? (
              <>开始使用 <Check className="w-4 h-4" /></>
            ) : (
              <>下一步 <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
