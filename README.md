# 💰 MoneyMate AI — 青年 AI 财务助手

> 不是记账工具，而是你的个人财务管理 Agent。

**MoneyMate AI** 是一款面向学生和年轻白领的 AI 财务管理助手，帮助用户完成日常支出记录、分类预算管理、超支提醒、消费复盘、储蓄目标拆解和 AI 智能分析。

🔗 **在线体验**：[finacewith.vercel.app](https://finacewith.vercel.app)

---

## 🎯 产品理念

> 记录收入 → 记录支出 → 预算提醒 → 消费分析 → 储蓄规划 → 理财教育

核心不是单纯记账，而是通过 **7 个 AI Agent 协作**，把用户财务数据转化成**可理解、可执行、可坚持**的个人财务建议。

---

## ✨ 核心功能

### 🔐 用户系统
- 邮箱 + 密码注册登录（Supabase Auth）
- 右上角用户菜单，支持退出登录
- 用户数据云端持久化，换设备登录数据同步

### 🏠 首页财务看板
- 本月收入（点击卡片可编辑） / 本月支出 / 剩余预算 / 今日建议可花
- 快捷按钮：**记收入** / **管预算**
- 储蓄目标进度追踪
- 分类预算进度条（带超支颜色预警）
- AI 智能建议卡片
- 消息中心（超支提醒、预算预警）

### 📝 智能记账
- 手动快速记账（金额 → 分类 → 备注 → 支付方式）
- **自然语言记账**：输入 "午饭花了35，奶茶18" → AI 自动提取并弹确认卡片
- 一键确认写入数据库
- 最近记录列表（支持删除）

### 💰 预算管理
- 月度总预算概览（已用 / 剩余 / 天数）
- 8 个分类独立预算设置（注册自动创建默认预算）
- 可自定义提醒阈值（50%-100%）
- 实时预算使用进度条（绿→蓝→黄→红）
- AI 预算优化建议

### 📊 统计分析
- 分类支出饼图（Recharts）
- 每日支出趋势折线图
- 固定支出 vs 弹性支出分析
- 必要支出 vs 非必要支出分析
- 日均支出 / 最高单日 / 记账笔数

### 🤖 AI 多 Agent 助手
**7 个专业 Agent 协作**，用户侧只感知一个 AI 助手：

```
用户输入 "午饭花了35，奶茶18"
    ↓
Supervisor Agent（意图识别 + 路由 → 规则层优先，命中率 ~70%）
    ↓
记账 Agent（结构化提取：{金额, 分类, 备注, 日期}）
    ↓
前端弹出确认卡片 → 用户点确认 → 写入数据库
```

```
用户输入 "帮我分析这个月为什么没攒下钱"
    ↓
Supervisor Agent → 消费分析 Agent（读取 Supabase 真实数据）
    ↓
风控合规 Agent（安全审查）
    ↓
流式输出分析报告（逐字出现）
```

**7 个 Agent 分工**：

| Agent | 职责 | 典型输出 |
|-------|------|---------|
| Supervisor | 意图识别 + 路由调度 | record / analyze / budget / saving / finance_edu |
| 记账 Agent | 自然语言 → 结构化数据 | `[{amount: 35, categoryId: "cat_food", note: "午饭"}]` |
| 消费分析 Agent | 消费结构 + 超支原因分析 | "购物超支 ¥410，主要在..." |
| 预算规划 Agent | 个性化预算方案 | "饮食预算建议从 ¥1800 调到 ¥1500" |
| 储蓄目标 Agent | 目标拆解为月/周/日计划 | "半年攒1万：月存 ¥1,667，日存 ¥56" |
| 理财教育 Agent | 基础理财知识 | "先建应急备用金 → 再考虑定投..." |
| 风控合规 Agent | 理财回答安全审查 | 拦截荐股、收益承诺、高风险诱导 |

**对话体验**：
- 🚀 **SSE 流式输出**：AI 回复逐字出现，感知延迟 <1 秒
- 📜 **对话历史**：左侧面板查看历史对话，支持清除
- 🧠 **上下文记忆**：连续对话 AI 记住之前聊了什么
- 📝 **记账确认卡片**：AI 提取消费后弹确认，一键写入

---

## 🏗 技术架构

```
┌──────────────────────────────────────────────────┐
│                  前端 (Vite + React 19)            │
│    Dashboard / Record / Budget / Stats / AI Chat  │
│    Tailwind CSS 4 / Recharts / Lucide Icons      │
└────────────────────┬─────────────────────────────┘
                     │ /api/chat (SSE streaming)
                     ▼
┌──────────────────────────────────────────────────┐
│           Vercel Serverless Function              │
│                 api/chat.ts                       │
│    Supervisor Agent (规则层 → LLM 兜底)            │
│    → 6 Specialist Agents                         │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Supabase    │ │ DeepSeek │ │  Compliance  │
│  PostgreSQL  │ │   API    │ │    Agent     │
│  + Auth      │ │ (OpenAI  │ │  (安全审查)   │
│              │ │ compat.) │ │              │
└──────────────┘ └──────────┘ └──────────────┘
```

### 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端框架 | React 19 + TypeScript | Hooks + Context |
| 构建工具 | Vite 8 | 极速 HMR |
| 样式 | Tailwind CSS 4 | 移动端优先响应式 |
| 图表 | Recharts | 饼图/折线图/柱状图 |
| 路由 | React Router 7 | SPA + Protected Routes |
| 图标 | Lucide React | 轻量图标库 |
| 数据库 | Supabase (PostgreSQL) | 用户/收入/支出/预算/对话 |
| 认证 | Supabase Auth | 邮箱密码登录 |
| AI 引擎 | DeepSeek API | OpenAI SDK 兼容 |
| 部署 | Vercel | Serverless + CDN + HTTPS |
| Agent 架构 | 7-Agent 协作 | Supervisor → Specialist → Compliance |

### 核心设计原则

> 🔢 **代码负责算账，Agent 负责解释**
> ⚡ **代码负责触发，Agent 负责建议**
> 🔒 **代码负责权限，Agent 负责交互**

- 金额计算全部由代码完成，Agent 不直接算账
- Agent 只能引用 Supabase 查询注入的真实数据
- 理财回答必须包含风险提示
- 风控 Agent 对所有理财输出做二次审查
- Supervisor 规则层命中 ~70%，省延迟省 token

---

## 📱 页面结构

| 页面 | 路由 | 功能亮点 |
|------|------|---------|
| 🔐 登录注册 | `/auth` | 邮箱密码登录，新用户自动创建预算 |
| 🚀 引导页 | `/onboarding` | 5步设置收入/支出/储蓄/预算模式 |
| 🏠 首页 | `/` | 收入可点击编辑，快捷记收入/管预算 |
| 📝 记账 | `/record` | 手动记账 + 自然语言记账 + 确认卡片 |
| 💰 预算 | `/budget` | 8 分类编辑，自动创建默认预算 |
| 📊 统计 | `/stats` | 饼图/折线图/柱状图 + 多维度 |
| 🤖 AI 助手 | `/ai` | 流式对话 + 历史面板 + 上下文记忆 |

---

## 🚀 本地运行

```bash
# 1. 克隆项目
git clone https://github.com/kellyleo297-tech/finacewith.git
cd finacewith

# 2. 安装依赖
npm install

# 3. 配置环境变量 (.env)
# DEEPSEEK_API_KEY=sk-xxx
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=sb_publishable_xxx
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=sb_publishable_xxx

# 4. 在 Supabase SQL Editor 执行 supabase/migration.sql 建表

# 5. 一键启动（前端 + Agent 后端）
npm run dev

# 前端 → http://localhost:5173
# Agent 后端 → http://localhost:3001
```

---

## 📦 部署

### Vercel（推荐）

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. 添加环境变量：`DEEPSEEK_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
3. Deploy → 自动 HTTPS + 全球 CDN + Serverless AI

### GitHub Pages（静态页面）

```bash
npm run deploy   # AI 助手不可用（纯静态无法运行后端）
```

---

## 📂 项目结构

```
finacewith/
├── api/                            # Vercel Serverless Functions
│   ├── chat.ts                     # 主 AI 对话（SSE 流式 + 非流式）
│   ├── debug.ts                    # 诊断端点
│   └── health.ts                   # 健康检查
├── server/                         # Agent 后端（本地开发）
│   ├── index.ts                    # Express 服务器
│   ├── config.ts                   # DeepSeek 客户端 + 流式 API
│   ├── types.ts                    # Agent 类型定义
│   └── agents/
│       ├── supervisor.ts           # 意图识别（规则层 + LLM 兜底）
│       ├── recorder.ts             # 自然语言记账解析
│       ├── analyzer.ts             # 消费结构分析
│       ├── budgeter.ts             # 预算规划优化
│       ├── saver.ts                # 储蓄目标拆解
│       ├── educator.ts             # 理财知识教育
│       └── compliance.ts           # 风控合规审查
├── src/                            # 前端源码
│   ├── components/
│   │   └── Layout.tsx              # 布局 + 底部导航 + 用户菜单 + 消息中心
│   ├── context/
│   │   ├── AuthContext.tsx          # 认证状态管理
│   │   └── AppContext.tsx           # 全局数据状态（Supabase CRUD）
│   ├── lib/
│   │   └── supabase.ts             # Supabase 客户端
│   ├── data/
│   │   └── mockData.ts             # 快捷问题等静态数据
│   ├── pages/
│   │   ├── Auth.tsx                 # 登录/注册页
│   │   ├── Onboarding.tsx           # 引导初始化
│   │   ├── Dashboard.tsx            # 首页看板（含收入编辑）
│   │   ├── ExpenseRecord.tsx        # 记账页（含自然语言记账）
│   │   ├── Budget.tsx               # 预算管理
│   │   ├── Statistics.tsx           # 统计分析图表
│   │   └── AIAssistant.tsx          # AI 对话（流式 + 历史 + 记账确认）
│   └── types/
│       └── index.ts                 # TypeScript 类型定义
├── supabase/
│   └── migration.sql                # 数据库建表 SQL
├── vercel.json                      # Vercel 部署配置
├── vite.config.ts                   # Vite 配置
└── package.json
```

---

## 🛡 安全与合规

- 用户密码经过 Supabase Auth 哈希存储
- 用户数据通过 RLS（Row Level Security）隔离
- DeepSeek API Key 仅在服务端使用，不暴露到前端
- 理财教育 Agent 不推荐具体股票/基金代码
- 风控合规 Agent 拦截高风险内容
- 所有理财回答必须包含风险提示

---

## 📋 产品路线图

- [x] **MVP** — 首页看板、记账、预算、统计、AI 助手
- [x] **数据库** — Supabase PostgreSQL，数据持久化
- [x] **用户系统** — 邮箱登录注册、数据隔离
- [x] **Agent 系统** — 7 Agent 协作 + 流式输出 + 上下文记忆
- [x] **记账智能化** — 自然语言提取 + 确认卡片 + 一键写入
- [x] **收入管理** — 首页点击编辑、快捷记收入
- [x] **预算自动创建** — 新用户注册默认 8 个分类预算
- [x] **Vercel 部署** — 前端 + AI 全功能上线
- [ ] **小程序** — Taro 跨端，微信生态
- [ ] **月度 AI 报告** — 自动生成月度财务复盘
- [ ] **语音记账** — 语音输入转文字 → Agent 解析
- [ ] **账单导入** — 截图 OCR / 支付账单导入

---

## 📄 License

MIT

---

<p align="center">
  <b>Made with ❤️ by Kellyleo & Claude</b><br>
  <sub>从 PRD 到全栈上线，一行代码一行 Agent 搭建</sub>
</p>
