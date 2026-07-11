# 💰 MoneyMate AI — 青年 AI 财务助手

> AI 不是功能，是产品本体。面向学生和年轻白领的 AI 财务管理应用。

**MoneyMate AI** 通过 7 个 AI Agent 协作，帮助用户完成智能记账、预算管理、消费分析和理财规划。从 PRD 到前后端分离架构独立完成。

🔗 **在线体验**：[finacewith.vercel.app](https://finacewith.vercel.app)  
📄 **项目展示**：[finacewith.vercel.app/moneymate-showcase.html](https://finacewith.vercel.app/moneymate-showcase.html)

---

## 🏗 系统架构

```
finacewith.vercel.app (Vercel — React 前端)
        │
        │ HTTPS /api/*
        ▼
finacewith-production.up.railway.app (Railway — Express 后端)
        │
        ├──→  uankoulfoscdnchtzcrz.supabase.co (PostgreSQL 数据库)
        └──→  api.deepseek.com (AI LLM)
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 图表 | Recharts |
| 路由 | React Router 7 |
| 后端框架 | Express 5 |
| 认证 | JWT + bcrypt |
| 数据库 | Supabase (PostgreSQL) |
| AI 引擎 | DeepSeek API (OpenAI 兼容) |
| 前端部署 | Vercel |
| 后端部署 | Railway |

### 设计原则

> 🔢 **代码负责算账，Agent 负责解释**  
> ⚡ **代码负责触发，Agent 负责建议**  
> 🔒 **后端负责权限，Agent 负责交互**

- 金额计算全部由代码完成，Agent 不直接算账
- Agent 只能引用从数据库查询注入的真实数据
- 理财回答必须包含风险提示，不推荐具体股票/基金代码
- 风控 Agent 对所有理财输出做二次审查

---

## ✨ 核心功能

### 🔐 用户系统
- 邮箱 + 密码注册登录（JWT 认证）
- Token 30 天有效，本地持久化
- 注册自动创建 8 个默认分类预算
- 右上角用户菜单，支持退出登录

### 🏠 首页财务看板
- 本月收入（点击卡片可编辑）/ 已支出 / 剩余预算 / 今日建议可花
- 快捷按钮：记收入 / 管预算
- 储蓄目标进度追踪
- 分类预算进度条（绿→蓝→黄→红 超支预警）
- AI 智能建议卡片 · 消息中心

### 📝 智能记账
- 手动快速记账（金额 → 分类 → 备注 → 支付方式）
- **自然语言记账**：输入 "午饭花了35，奶茶18" → AI 提取 → 弹确认卡片 → 一键写入
- 批量写入支持 · 最近记录列表（支持删除）

### 💰 预算管理
- 月度总预算概览 · 8 个分类独立预算设置
- 可自定义提醒阈值（50%-100%）
- AI 预算优化建议

### 📊 统计分析
- 分类支出饼图 · 每日支出趋势折线图
- 固定支出 vs 弹性支出 · 必要支出 vs 非必要支出
- 日均支出 / 最高单日 / 记账笔数

### 🤖 AI 多 Agent 助手

7 个专业 Agent 协作，用户侧只感知一个 AI 助手：

```
用户输入 "这个月为什么没攒下钱"
    ↓
Supervisor Agent（规则层 ~70% 命中 → LLM 兜底）
    ↓
消费分析 Agent（读取数据库中真实数据做分析）
    ↓
风控合规 Agent（安全审查）
    ↓
流式输出分析报告
```

| Agent | 职责 |
|-------|------|
| Supervisor Agent | 意图识别 + 路由调度（规则层 + LLM 两层决策） |
| 记账 Agent | 自然语言 → 结构化 {金额, 分类, 备注, 日期} |
| 消费分析 Agent | 基于真实数据的消费结构 + 超支原因分析 |
| 预算规划 Agent | 个性化预算优化方案 |
| 储蓄目标 Agent | 目标拆解为月/周/日执行计划 |
| 理财教育 Agent | 理财知识 + 强制风险提示 |
| 风控合规 Agent | 红线/黄线分级审查，拦截高风险内容 |

**对话体验**：
- Markdown 渲染（标题/加粗/列表/表格）
- 上下文记忆（最近 20 轮对话注入 Agent）
- 对话历史侧边栏

---

## 📱 页面结构

| 页面 | 路由 | 说明 |
|------|------|------|
| 🔐 登录注册 | `/auth` | 邮箱密码 JWT 登录，新用户自动创建预算 |
| 🚀 引导页 | `/onboarding` | 5 步设置收入/支出/储蓄/预算 |
| 🏠 首页 | `/` | 收入点击编辑、快捷记收入/管预算 |
| 📝 记账 | `/record` | 手动 + 自然语言记账 + 确认卡片 |
| 💰 预算 | `/budget` | 8 分类编辑，默认预算自动创建 |
| 📊 统计 | `/stats` | 饼图/折线图/柱状图 + 多维度分析 |
| 🤖 AI 助手 | `/ai` | 流式对话 + 历史面板 + 上下文记忆 |

---

## 🚀 本地运行

```bash
git clone https://github.com/kellyleo297-tech/finacewith.git
cd finacewith
npm install

# 配置 .env
# DEEPSEEK_API_KEY=sk-xxx
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=sb_publishable_xxx
# JWT_SECRET=your-secret-key

# 在 Supabase SQL Editor 执行 supabase/migration.sql 建表

# 启动（前端 + 后端）
npm run dev
# 前端 → http://localhost:5173
# 后端 → http://localhost:3001
```

---

## 📦 部署

| 组件 | 平台 | 地址 |
|------|------|------|
| 前端 | Vercel | finacewith.vercel.app |
| 后端 | Railway | finacewith-production.up.railway.app |
| 数据库 | Supabase | uankoulfoscdnchtzcrz.supabase.co |

后端部署后需在 Railway 设置环境变量：`DEEPSEEK_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`JWT_SECRET`

---

## 📂 项目结构

```
finacewith/
├── backend/                        # Express 后端
│   ├── index.ts                    # 服务器入口
│   ├── db.ts                       # Supabase 服务端客户端
│   ├── middleware/
│   │   └── auth.ts                 # JWT 生成 + 验证中间件
│   └── routes/
│       ├── auth.ts                 # 注册/登录 (bcrypt + JWT)
│       ├── expenses.ts             # 支出 CRUD + 批量创建
│       ├── incomes.ts              # 收入 CRUD
│       ├── budgets.ts              # 预算 CRUD + 自动创建
│       └── ai.ts                   # AI Agent 对话
├── server/                         # Agent 引擎（共享）
│   ├── config.ts                   # DeepSeek 客户端 + 流式 API
│   ├── types.ts                    # Agent 类型定义
│   └── agents/
│       ├── supervisor.ts           # 规则层 + LLM 意图路由
│       ├── recorder.ts             # 自然语言记账解析
│       ├── analyzer.ts             # 消费结构分析
│       ├── budgeter.ts             # 预算规划优化
│       ├── saver.ts                # 储蓄目标拆解
│       ├── educator.ts             # 理财知识教育
│       └── compliance.ts           # 风控合规审查
├── src/                            # 前端
│   ├── components/Layout.tsx       # 布局 + 导航 + 用户菜单
│   ├── context/
│   │   ├── AuthContext.tsx          # JWT 认证状态
│   │   └── AppContext.tsx           # 数据状态（调后端 API）
│   ├── lib/
│   │   ├── api.ts                  # 后端 API 客户端
│   │   └── supabase.ts             # Supabase 客户端（本地用）
│   └── pages/
│       ├── Auth.tsx                 # 登录/注册
│       ├── Onboarding.tsx           # 初始化引导
│       ├── Dashboard.tsx            # 首页看板 + 收入编辑
│       ├── ExpenseRecord.tsx        # 记账 + 自然语言
│       ├── Budget.tsx               # 预算管理
│       ├── Statistics.tsx           # 图表统计
│       └── AIAssistant.tsx          # AI 对话 + 上下文记忆
├── supabase/migration.sql           # 数据库建表 SQL
├── vite.config.ts
└── package.json
```

---

## 🛡 安全与合规

- 用户密码 bcrypt 哈希存储，JWT 30 天过期
- 所有 API 端点通过 `verifyToken` 中间件保护
- 数据库访问全部走后端，前端不直接接触数据库
- RLS 行级安全策略确保用户数据隔离
- 理财 Agent 不推荐股票/基金代码，不承诺收益
- 风控 Agent 红线/黄线分级审查

---

## 📋 产品路线图

- [x] **MVP** — 首页看板、记账、预算、统计、AI 助手
- [x] **数据库** — Supabase PostgreSQL，数据持久化
- [x] **用户系统** — JWT 认证，注册登录
- [x] **Agent 系统** — 7 Agent 协作 + 流式输出 + 上下文记忆
- [x] **后端架构** — Express RESTful API + JWT + Railway 部署
- [x] **前端部署** — Vercel（代码分割优化）
- [ ] **小程序** — Taro 跨端
- [ ] **月度 AI 报告** — 自动生成月度财务复盘
- [ ] **语音记账** — 语音 → 文字 → Agent 解析

---

## 📄 License

MIT

---

<p align="center">
  <b>Made with ❤️ by Kellyleo & Claude</b><br>
  <sub>从 PRD 到前后端分离架构，一行代码一行 Agent 搭建</sub>
</p>
