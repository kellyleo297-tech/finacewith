import type { Category, Budget, SavingGoal, Expense, Income, User, Alert } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: '饮食', type: 'expense', icon: '🍽️', isDefault: true },
  { id: 'cat_transport', name: '交通', type: 'expense', icon: '🚗', isDefault: true },
  { id: 'cat_entertainment', name: '娱乐', type: 'expense', icon: '🎮', isDefault: true },
  { id: 'cat_shopping', name: '购物', type: 'expense', icon: '🛍️', isDefault: true },
  { id: 'cat_learning', name: '学习', type: 'expense', icon: '📚', isDefault: true },
  { id: 'cat_rent', name: '房租', type: 'expense', icon: '🏠', isDefault: true },
  { id: 'cat_medical', name: '医疗', type: 'expense', icon: '💊', isDefault: true },
  { id: 'cat_social', name: '人情社交', type: 'expense', icon: '🎁', isDefault: true },
  { id: 'cat_investment', name: '投资理财', type: 'expense', icon: '📈', isDefault: true },
  { id: 'cat_other', name: '其他', type: 'expense', icon: '📦', isDefault: true },
];

export const DEFAULT_USER: User = {
  id: 'user_1',
  name: '小明',
  role: 'worker',
  currency: 'CNY',
  riskLevel: '',
  monthlyIncome: 8000,
  incomeSource: '工资',
  budgetMode: 'balanced',
  savingGoal: 1500,
  fixedExpenses: [
    { name: '房租', amount: 2000 },
    { name: '通勤', amount: 300 },
    { name: '会员订阅', amount: 100 },
  ],
  createdAt: '2026-05-01',
  isOnboarded: true,
};

export const MOCK_EXPENSES: Expense[] = [
  // 饮食 expenses - high frequency
  { id: 'exp_1', userId: 'user_1', amount: 35, categoryId: 'cat_food', note: '午饭外卖', paymentMethod: 'wechat', expenseDate: '2026-06-01', createdAt: '2026-06-01T12:00:00' },
  { id: 'exp_2', userId: 'user_1', amount: 18, categoryId: 'cat_food', note: '奶茶', paymentMethod: 'wechat', expenseDate: '2026-06-01', createdAt: '2026-06-01T15:00:00' },
  { id: 'exp_3', userId: 'user_1', amount: 42, categoryId: 'cat_transport', note: '打车回家', paymentMethod: 'alipay', expenseDate: '2026-06-01', createdAt: '2026-06-01T20:00:00' },
  { id: 'exp_4', userId: 'user_1', amount: 28, categoryId: 'cat_food', note: '食堂午饭', paymentMethod: 'card', expenseDate: '2026-06-02', createdAt: '2026-06-02T12:00:00' },
  { id: 'exp_5', userId: 'user_1', amount: 15, categoryId: 'cat_food', note: '咖啡', paymentMethod: 'wechat', expenseDate: '2026-06-02', createdAt: '2026-06-02T09:00:00' },
  { id: 'exp_6', userId: 'user_1', amount: 120, categoryId: 'cat_entertainment', note: '电影票', paymentMethod: 'alipay', expenseDate: '2026-06-02', createdAt: '2026-06-02T19:00:00' },
  { id: 'exp_7', userId: 'user_1', amount: 45, categoryId: 'cat_food', note: '晚饭外卖', paymentMethod: 'wechat', expenseDate: '2026-06-03', createdAt: '2026-06-03T19:00:00' },
  { id: 'exp_8', userId: 'user_1', amount: 200, categoryId: 'cat_shopping', note: 'T恤', paymentMethod: 'alipay', expenseDate: '2026-06-03', createdAt: '2026-06-03T14:00:00' },
  { id: 'exp_9', userId: 'user_1', amount: 88, categoryId: 'cat_food', note: '超市零食', paymentMethod: 'wechat', expenseDate: '2026-06-04', createdAt: '2026-06-04T17:00:00' },
  { id: 'exp_10', userId: 'user_1', amount: 6, categoryId: 'cat_transport', note: '地铁', paymentMethod: 'card', expenseDate: '2026-06-04', createdAt: '2026-06-04T08:00:00' },
  { id: 'exp_11', userId: 'user_1', amount: 32, categoryId: 'cat_food', note: '午饭', paymentMethod: 'wechat', expenseDate: '2026-06-05', createdAt: '2026-06-05T12:00:00' },
  { id: 'exp_12', userId: 'user_1', amount: 25, categoryId: 'cat_food', note: '奶茶+点心', paymentMethod: 'wechat', expenseDate: '2026-06-05', createdAt: '2026-06-05T15:30:00' },
  { id: 'exp_13', userId: 'user_1', amount: 150, categoryId: 'cat_social', note: '朋友生日礼物', paymentMethod: 'alipay', expenseDate: '2026-06-05', createdAt: '2026-06-05T18:00:00' },
  { id: 'exp_14', userId: 'user_1', amount: 38, categoryId: 'cat_food', note: '外卖晚饭', paymentMethod: 'wechat', expenseDate: '2026-06-06', createdAt: '2026-06-06T19:00:00' },
  { id: 'exp_15', userId: 'user_1', amount: 20, categoryId: 'cat_food', note: '早餐', paymentMethod: 'wechat', expenseDate: '2026-06-06', createdAt: '2026-06-06T08:00:00' },
  { id: 'exp_16', userId: 'user_1', amount: 55, categoryId: 'cat_transport', note: '打车', paymentMethod: 'alipay', expenseDate: '2026-06-06', createdAt: '2026-06-06T21:00:00' },
  { id: 'exp_17', userId: 'user_1', amount: 299, categoryId: 'cat_shopping', note: '蓝牙耳机', paymentMethod: 'alipay', expenseDate: '2026-06-07', createdAt: '2026-06-07T11:00:00' },
  { id: 'exp_18', userId: 'user_1', amount: 40, categoryId: 'cat_food', note: '午饭', paymentMethod: 'wechat', expenseDate: '2026-06-07', createdAt: '2026-06-07T12:00:00' },
  { id: 'exp_19', userId: 'user_1', amount: 16, categoryId: 'cat_food', note: '奶茶', paymentMethod: 'wechat', expenseDate: '2026-06-07', createdAt: '2026-06-07T15:00:00' },
  { id: 'exp_20', userId: 'user_1', amount: 68, categoryId: 'cat_entertainment', note: '游戏充值', paymentMethod: 'wechat', expenseDate: '2026-06-08', createdAt: '2026-06-08T20:00:00' },
  { id: 'exp_21', userId: 'user_1', amount: 33, categoryId: 'cat_food', note: '午饭', paymentMethod: 'wechat', expenseDate: '2026-06-08', createdAt: '2026-06-08T12:00:00' },
  { id: 'exp_22', userId: 'user_1', amount: 22, categoryId: 'cat_food', note: '咖啡', paymentMethod: 'wechat', expenseDate: '2026-06-08', createdAt: '2026-06-08T09:00:00' },
  { id: 'exp_23', userId: 'user_1', amount: 180, categoryId: 'cat_learning', note: '线上课程', paymentMethod: 'alipay', expenseDate: '2026-06-09', createdAt: '2026-06-09T16:00:00' },
  { id: 'exp_24', userId: 'user_1', amount: 42, categoryId: 'cat_food', note: '外卖', paymentMethod: 'wechat', expenseDate: '2026-06-09', createdAt: '2026-06-09T18:00:00' },
  { id: 'exp_25', userId: 'user_1', amount: 8, categoryId: 'cat_transport', note: '地铁', paymentMethod: 'card', expenseDate: '2026-06-09', createdAt: '2026-06-09T08:00:00' },
  { id: 'exp_26', userId: 'user_1', amount: 95, categoryId: 'cat_food', note: '聚餐', paymentMethod: 'alipay', expenseDate: '2026-06-10', createdAt: '2026-06-10T19:00:00' },
  { id: 'exp_27', userId: 'user_1', amount: 35, categoryId: 'cat_food', note: '午饭', paymentMethod: 'wechat', expenseDate: '2026-06-10', createdAt: '2026-06-10T12:00:00' },
  { id: 'exp_28', userId: 'user_1', amount: 50, categoryId: 'cat_medical', note: '感冒药', paymentMethod: 'alipay', expenseDate: '2026-06-10', createdAt: '2026-06-10T14:00:00' },
  { id: 'exp_29', userId: 'user_1', amount: 36, categoryId: 'cat_food', note: '外卖', paymentMethod: 'wechat', expenseDate: '2026-06-11', createdAt: '2026-06-11T12:00:00' },
  { id: 'exp_30', userId: 'user_1', amount: 19, categoryId: 'cat_food', note: '奶茶', paymentMethod: 'wechat', expenseDate: '2026-06-11', createdAt: '2026-06-11T15:00:00' },
  { id: 'exp_31', userId: 'user_1', amount: 30, categoryId: 'cat_transport', note: '打车', paymentMethod: 'alipay', expenseDate: '2026-06-11', createdAt: '2026-06-11T20:00:00' },
  { id: 'exp_32', userId: 'user_1', amount: 150, categoryId: 'cat_shopping', note: '护肤品', paymentMethod: 'alipay', expenseDate: '2026-06-12', createdAt: '2026-06-12T10:00:00' },
  { id: 'exp_33', userId: 'user_1', amount: 42, categoryId: 'cat_food', note: '午饭外卖', paymentMethod: 'wechat', expenseDate: '2026-06-12', createdAt: '2026-06-12T12:00:00' },
];

// Previous month expenses for comparison
export const MOCK_EXPENSES_LAST_MONTH: Expense[] = [
  { id: 'exp_l1', userId: 'user_1', amount: 38, categoryId: 'cat_food', note: '午饭', paymentMethod: 'wechat', expenseDate: '2026-05-01', createdAt: '2026-05-01T12:00:00' },
  { id: 'exp_l2', userId: 'user_1', amount: 220, categoryId: 'cat_shopping', note: '衣服', paymentMethod: 'alipay', expenseDate: '2026-05-03', createdAt: '2026-05-03T14:00:00' },
  { id: 'exp_l3', userId: 'user_1', amount: 180, categoryId: 'cat_entertainment', note: '演唱会门票', paymentMethod: 'alipay', expenseDate: '2026-05-10', createdAt: '2026-05-10T10:00:00' },
];

export const MOCK_INCOMES: Income[] = [
  { id: 'inc_1', userId: 'user_1', amount: 8000, source: '工资', incomeDate: '2026-06-01', month: '2026-06', isRecurring: true, note: '6月工资' },
];

export const MOCK_BUDGETS: Budget[] = [
  { id: 'bud_1', userId: 'user_1', categoryId: 'cat_food', amount: 1800, month: '2026-06', alertThreshold: 70 },
  { id: 'bud_2', userId: 'user_1', categoryId: 'cat_transport', amount: 500, month: '2026-06', alertThreshold: 80 },
  { id: 'bud_3', userId: 'user_1', categoryId: 'cat_entertainment', amount: 600, month: '2026-06', alertThreshold: 70 },
  { id: 'bud_4', userId: 'user_1', categoryId: 'cat_shopping', amount: 800, month: '2026-06', alertThreshold: 70 },
  { id: 'bud_5', userId: 'user_1', categoryId: 'cat_learning', amount: 500, month: '2026-06', alertThreshold: 80 },
  { id: 'bud_6', userId: 'user_1', categoryId: 'cat_social', amount: 400, month: '2026-06', alertThreshold: 70 },
  { id: 'bud_7', userId: 'user_1', categoryId: 'cat_medical', amount: 300, month: '2026-06', alertThreshold: 80 },
  { id: 'bud_8', userId: 'user_1', categoryId: 'cat_other', amount: 300, month: '2026-06', alertThreshold: 80 },
];

export const MOCK_SAVING_GOALS: SavingGoal[] = [
  { id: 'sg_1', userId: 'user_1', name: '应急备用金', targetAmount: 15000, currentAmount: 9000, deadline: '2026-12-31', status: 'active', createdAt: '2026-01-01' },
  { id: 'sg_2', userId: 'user_1', name: '旅行基金', targetAmount: 5000, currentAmount: 2000, deadline: '2026-09-01', status: 'active', createdAt: '2026-03-01' },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert_1',
    type: 'warning',
    message: '饮食预算已使用 82%，本月还剩 324 元。建议未来几天减少外卖支出。',
    categoryId: 'cat_food',
    threshold: 80,
    currentUsage: 82,
    createdAt: '2026-06-11T20:00:00',
    read: false,
  },
  {
    id: 'alert_2',
    type: 'danger',
    message: '购物预算已超支！本月预算 800 元，已支出 849 元。',
    categoryId: 'cat_shopping',
    threshold: 100,
    currentUsage: 106,
    createdAt: '2026-06-12T10:00:00',
    read: false,
  },
  {
    id: 'alert_3',
    type: 'info',
    message: '按当前支出速度，本月储蓄目标 1500 元可能无法完成。建议减少弹性支出。',
    threshold: 90,
    currentUsage: 90,
    createdAt: '2026-06-10T08:00:00',
    read: true,
  },
];

export const QUICK_QUESTIONS = [
  { text: '我这个月还能花多少钱？', intent: 'analyze' },
  { text: '我这个月哪里花多了？', intent: 'analyze' },
  { text: '帮我制定下月预算', intent: 'budget' },
  { text: '我想6个月攒1万，怎么做？', intent: 'saving' },
  { text: '我每月剩1500，可以如何规划？', intent: 'finance_edu' },
  { text: '我现在可以买一个500元的东西吗？', intent: 'general' },
];

export const PAYMENT_METHODS = [
  { value: 'wechat', label: '微信', icon: '💬' },
  { value: 'alipay', label: '支付宝', icon: '🔵' },
  { value: 'card', label: '银行卡', icon: '💳' },
  { value: 'cash', label: '现金', icon: '💵' },
  { value: 'other', label: '其他', icon: '📱' },
] as const;
