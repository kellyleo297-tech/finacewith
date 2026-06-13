# 💰 MoneyMate AI — 青年 AI 财务助手

> 不是记账工具，而是你的个人财务管理 Agent。

**MoneyMate AI** 是一款面向学生和年轻白领的 AI 财务管理助手，帮助用户从月收入/生活费规划开始，完成日常支出记录、分类预算管理、超支提醒、消费复盘、储蓄目标拆解和基础理财分析。

🔗 **在线体验**：[finacewith.vercel.app](https://finacewith.vercel.app)

---

## 🎯 产品理念

> 记录收入 → 记录支出 → 预算提醒 → 消费分析 → 储蓄规划 → 理财教育

核心不是单纯记账，而是帮助用户建立一套**轻量、可持续、可反馈**的个人财务管理闭环。用 AI 把财务数据转化成**可理解、可执行、可坚持**的个人财务建议。

---

## ✨ 核心功能

### 🏠 首页财务看板
- 本月收入 / 支出 / 剩余预算 / 今日建议可花
- 储蓄目标进度追踪
- 分类预算进度条（带超支预警）
- AI 智能建议卡片
- 消息中心（超支提醒、预算预警）

### 📝 智能记账
- 手动快速记账（金额 → 分类 → 备注 → 保存）
- **自然语言记账**：输入 "午饭花了35，奶茶18" 自动解析
- 语音记账入口 / 截图识别入口
- 最近记录列表（支持删除）

### 💰 预算管理
- 月度总预算概览
- 10 个分类独立预算设置
- 可自定义提醒阈值（默认 70%）
- 实时预算使用进度条
- AI 预算优化建议（超支调拨、预算重分配）

### 📊 统计分析
- 分类支出饼图
- 每日支出趋势折线图
- 月度对比柱状图（本月 vs 上月）
- 固定支出 vs 弹性支出分析
- 必要支出 vs 非必要支出分析
- 日均支出 / 最高单日 / 记账笔数

### 🤖 AI 多 Agent 助手
7 个专业 Agent 协作，前台只感知一个 AI 助手：

```
用户输入问题
    ↓
Supervisor Agent（识别意图 + 路由调度）
    ↓
┌───────┬───────┬───────┬───────┬───────┬───────┐
│ 记账   │ 消费   │ 预算   │ 储蓄   │ 理财   │ 决策   │
│ Agent  │分析    │规划    │目标    │教育    │分析    │
│       │ Agent  │ Agent  │ Agent  │ Agent  │ Agent  │
└───────┴───────┴───────┴───────┴───────┴───────┘
    ↓
风控合规 Agent（理财场景安全审查）
    ↓
返回用户
```

**Agent 能力**：
- 📝 **记账 Agent**：自然语言 → 结构化 {金额, 分类, 备注, 日期}
- 📊 **消费分析 Agent**：基于真实数据的消费结构分析
- 💡 **预算规划 Agent**：个性化预算优化方案
- 🎯 **储蓄目标 Agent**：目标拆解为 月/周/日 计划
- 📖 **理财教育 Agent**：基础理财知识 + 风险提示
- 🛡️ **风控合规 Agent**：拦截荐股、收益承诺、高风险建议

---

## 🏗 技术架构

```
┌─────────────────────────────────────────┐
│              前端 (Vite + React)          │
│  Dashboard / Record / Budget / Stats / AI │
│         Tailwind CSS / Recharts           │
└─────────────────┬───────────────────────┘
                  │ /api/chat
                  ▼
┌─────────────────────────────────────────┐
│         Vercel Serverless Function       │
│              api/chat.ts                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       Supervisor Agent (意图识别)         │
│              DeepSeek LLM                │
└─────────────────┬───────────────────────┘
                  │
    ┌─────┬───────┬───────┬───────┬──────┐
    ▼     ▼       ▼       ▼       ▼      ▼
  记账  分析     预算     储蓄    理财   决策
 Agent Agent   Agent   Agent  Agent  Agent
                  │
                  ▼
┌─────────────────────────────────────────┐
│        风控合规 Agent (安全审查)           │
│              DeepSeek LLM                │
└─────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 图表 | Recharts |
| 路由 | React Router 7 |
| 图标 | Lucide React |
| AI 引擎 | DeepSeek API (OpenAI 兼容) |
| 后端部署 | Vercel Serverless Functions |
| 静态托管 | GitHub Pages |

### 设计原则

> 🔢 **代码负责算账，Agent 负责解释**
> ⚡ **代码负责触发，Agent 负责建议**
> 🔒 **代码负责权限，Agent 负责交互**

- 金额计算全部由前端/后端代码完成，Agent 不直接算账
- Agent 只能引用工具返回的真实数据，不编造财务数据
- 理财回答必须包含风险提示，不推荐具体股票/基金代码
- 风控合规 Agent 对所有理财回答做安全审查

---

## 📱 页面结构

| 页面 | 路由 | 说明 |
|------|------|------|
| 🚀 引导页 | `/onboarding` | 5步初始化：身份 → 收入 → 固定支出 → 储蓄目标 → 预算模式 |
| 🏠 首页 | `/` | 财务概览、预算进度、超支提醒、AI 建议 |
| 📝 记账 | `/record` | 手动记账 + 自然语言记账 + 最近记录 |
| 💰 预算 | `/budget` | 分类预算管理 + AI 优化建议 |
| 📊 统计 | `/stats` | 饼图/折线图/柱状图 + 多维度分析 |
| 🤖 AI 助手 | `/ai` | 7 Agent 协作对话 + 快捷问题 |

---

## 🚀 本地运行

```bash
# 1. 克隆项目
git clone https://github.com/kellyleo297-tech/finacewith.git
cd finacewith

# 2. 安装依赖
npm install

# 3. 设置环境变量
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key

# 4. 一键启动（前端 + Agent 后端）
npm run dev

# 前端 → http://localhost:5173
# Agent 后端 → http://localhost:3001
```

---

## 📦 部署

### Vercel（推荐，前端 + AI 全功能）

1. [vercel.com](https://vercel.com) → Import `kellyleo297-tech/finacewith`
2. 添加环境变量 `DEEPSEEK_API_KEY`
3. Deploy → 自动 HTTPS + 全球 CDN

### GitHub Pages（静态页面）

```bash
npm run deploy   # 自动构建 + 部署到 gh-pages 分支
# 注意：GitHub Pages 为纯静态，AI 助手不可用
```

---

## 📂 项目结构

```
finacewith/
├── api/                          # Vercel Serverless Functions
│   ├── chat.ts                   # 主 AI 对话接口
│   └── health.ts                 # 健康检查
├── server/                       # Agent 后端
│   ├── index.ts                  # Express 服务器入口
│   ├── config.ts                 # DeepSeek API 客户端
│   ├── types.ts                  # 类型定义
│   └── agents/
│       ├── supervisor.ts         # 意图识别 + 路由调度
│       ├── recorder.ts           # 自然语言记账解析
│       ├── analyzer.ts           # 消费结构分析
│       ├── budgeter.ts           # 预算规划与优化
│       ├── saver.ts              # 储蓄目标拆解
│       ├── educator.ts           # 理财知识教育
│       └── compliance.ts         # 风控合规审查
├── src/                          # 前端源码
│   ├── components/
│   │   └── Layout.tsx            # 布局 + 底部导航 + 消息中心
│   ├── context/
│   │   └── AppContext.tsx        # 全局状态管理
│   ├── data/
│   │   └── mockData.ts           # Mock 数据
│   ├── pages/
│   │   ├── Onboarding.tsx        # 引导初始化
│   │   ├── Dashboard.tsx         # 首页看板
│   │   ├── ExpenseRecord.tsx     # 记账页
│   │   ├── Budget.tsx            # 预算管理
│   │   ├── Statistics.tsx        # 统计分析
│   │   └── AIAssistant.tsx       # AI 对话助手
│   └── types/
│       └── index.ts              # TypeScript 类型
├── vercel.json                   # Vercel 配置
├── vite.config.ts                # Vite 配置
└── package.json
```

---

## 🤖 Agent 评测

| Agent | 评测指标 |
|-------|---------|
| Supervisor Agent | 意图识别准确率、路由准确率 |
| 记账 Agent | 金额/分类/时间/备注提取准确率 |
| 消费分析 Agent | 分析合理性、数据引用准确率 |
| 预算规划 Agent | 预算计算准确率、建议可执行性 |
| 储蓄目标 Agent | 目标拆解合理性、计划可执行性 |
| 理财教育 Agent | 概念解释准确率、风险提示完整率 |
| 风控合规 Agent | 高风险建议拦截率、收益承诺拦截率 |

---

## 🛡 安全与隐私

- API Key 通过环境变量注入，不提交到代码仓库
- 用户财务数据仅在前端 mock 数据中，不持久化
- 风控合规 Agent 对所有理财回答做安全审查
- 不推荐具体股票/基金代码，不承诺收益
- 所有理财回答必须包含风险提示

---

## 📋 产品路线图

- [x] **MVP** — 首页看板、记账、预算、统计、AI 助手
- [x] **Agent 系统** — 7 Agent 协作架构 + LLM 集成
- [x] **Vercel 部署** — 前端 + AI 全功能上线
- [ ] **V1** — 语音记账、月度 AI 报告、储蓄目标管理、理财知识库
- [ ] **V2** — 账单导入、截图识别、多账户管理、主动型消费异常提醒

---

## 📄 License

MIT

---

<p align="center">
  <b>Made with ❤️ by Kellyleo & Claude</b><br>
  <sub>从 PRD 到上线，一行代码一行 Agent 搭建</sub>
</p>
