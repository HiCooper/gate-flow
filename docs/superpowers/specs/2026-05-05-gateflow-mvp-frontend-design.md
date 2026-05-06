# GateFlow MVP 前端工程设计文档

> 日期：2026-05-05 | 状态：已确认

## 一、范围与策略

### 子系统

| 子系统 | 范围 | 优先级 |
|--------|------|--------|
| Marketing Website | 落地页 · 文档 · 定价 · Blog · 案例 · 社区 | P0 并行 |
| Admin Console | 仪表盘 · 编辑器 · 模板 · 实验 · 受众 · 设置 | P0 并行 |

### 开发策略

**先纯前端，后对接**：所有数据以 Mock 方式注入，Admin Console 通过 zustand store 模拟 API 调用。Backend API 后续开发就绪后替换 Mock 层。

---

## 二、项目结构（pnpm Workspace Monorepo）

```
gate-flow/
├── apps/
│   ├── marketing/              # GateFlow 官网 (Vite + React)
│   │   ├── src/
│   │   │   ├── pages/          # 各页面路由
│   │   │   ├── components/     # 官网专用组件
│   │   │   ├── data/           # 静态数据常量
│   │   │   ├── layouts/        # 官网布局
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   └── images/         # 从 front/images/ 迁移
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/                  # 管理后台 (Vite + React)
│       ├── src/
│       │   ├── pages/          # 各页面路由
│       │   ├── components/     # 后台专用组件
│       │   ├── mocks/          # Mock 数据
│       │   ├── stores/         # zustand 状态管理
│       │   ├── layouts/        # 后台布局
│       │   └── main.tsx
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                 # 共享设计系统 & 组件库
│       ├── src/
│       │   ├── tokens/         # 设计 Token
│       │   ├── components/     # 通用组件
│       │   ├── hooks/          # 通用 hooks
│       │   └── utils/          # 工具函数
│       ├── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json                # 根脚本
├── tsconfig.base.json
└── .gitignore
```

**包名约定：**
- `@gate-flow/shared` — 共享包
- `@gate-flow/marketing` — 官网
- `@gate-flow/admin` — 管理后台

---

## 三、技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 框架 | React 18 + TypeScript | 生态丰富、Admin Console 复杂交互 |
| 构建 | Vite 5 | 快速 HMR、开箱即用 |
| 路由 | React Router v6 | React 生态标准 |
| CSS | Tailwind CSS v4 | 原子化、与设计 Token 映射 |
| 组件基座 | Headless UI | 无样式锁入、灵活定制 |
| 图表 | Recharts | 轻量、React 原生 |
| 拖拽 | @dnd-kit/core | 最成熟的 React 拖拽库（编辑器刚需） |
| 图标 | Lucide React | 统一图标集 |
| 状态管理 | zustand | 轻量、支持 mock 注入 |
| 文档渲染 | MDX (vite-plugin-mdx) | Markdown 增强渲染 |
| 包管理 | pnpm | Monorepo 原生支持 |

---

## 四、设计系统

同一设计 Token 体系，Marketing 和 Admin 采用不同视觉策略。

### 共享设计 Token（`@gate-flow/shared/tokens/`）

| 分类 | 内容 |
|------|------|
| colors | 品牌色板、语义色（success/warning/danger/info） |
| typography | Inter + Noto Sans SC，字号阶梯 12-48px |
| spacing | 4px 基准：4/8/12/16/20/24/32/40/48/64/80/96 |
| radius | 4/8/12/16/24 |
| shadows | card / dropdown / modal 三层级 |
| breakpoints | sm:640 md:768 lg:1024 xl:1280 |

### Marketing Website 视觉方向

- 深色主题主色调，紫蓝色渐变点缀
- 与现有 `front/index.html` 保持设计语言一致性
- 滚动视差、微交互动效
- 静态内容为主，SEO 友好

### Admin Console 视觉方向

- 专业数据后台，浅色/深色主题可切换
- Linear / Vercel 风格 — 克制、清晰、信息密度高
- 拖拽操作、实时图表、骨架屏加载

---

## 五、Marketing Website 详情

### 路由表

| 路径 | 页面 | 渲染 | 说明 |
|------|------|------|------|
| `/` | 落地页 | 静态 | Hero、能力、对比、CTA |
| `/docs` | 文档首页 | 静态 | 分类导航 |
| `/docs/:slug` | 文档详情 | MDX | 侧边目录 |
| `/pricing` | 定价页 | 静态 | 四档、FAQ |
| `/blog` | Blog 列表 | MDX | 分类/标签 |
| `/blog/:slug` | Blog 详情 | MDX | 文章内容 |
| `/customers` | 案例展示 | 静态 | 案例卡片 |
| `/community` | 社区页 | 静态 | 社群/视频 |
| `/privacy` | 隐私政策 | 静态 | 合规文本 |
| `/terms` | 服务条款 | 静态 | 合规文本 |

### 组件树

```
components/
├── home/          HeroSection, CoreCapabilities, Differentiators,
│                  ArchitectureDiagram, CustomerLogos, CTABanner
├── docs/          DocsSidebar, DocsContent, DocsTOC
├── pricing/       PricingTable, PricingFAQ
├── blog/          BlogCard, BlogList, BlogContent
├── customers/     CaseCard, CaseList
├── community/     CommunityChannels, VideoTutorials
└── shared/        Header, Footer, SectionLabel, GradientText, Container
```

### 数据策略

全部通过常量文件和 `.mdx` 文件静态提供，编译时解析。

---

## 六、Admin Console 详情

### 路由表

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 仪表盘 | 指标卡片、转化漏斗、收入趋势、实时事件 |
| `/paywalls` | 付费墙管理 | 列表、搜索、状态筛选 |
| `/paywalls/:id` | 付费墙编辑器 | 拖拽编辑、预览、版本管理 |
| `/templates` | 模板市场 | 200+ 模板浏览、选用 |
| `/experiments` | 实验管理 | A/B/N 列表、创建 |
| `/experiments/:id` | 实验详情 | 变体对比、结果分析 |
| `/audience` | 受众管理 | 属性、规则、分群 |
| `/settings` | 全局设置 | 品牌、Webhooks、环境 |

### 布局

```
+--------------------------------------------------+
| Sidebar (240px)       | TopBar                    |
|                       +---------------------------+
| - 仪表盘              |                           |
| - 付费墙              |    Content Area            |
| - 模板市场            |                           |
| - 实验管理            |                           |
| - 受众管理            |                           |
| - 设置                |                           |
+------------------------+--------------------------+
```

### 核心组件

```
components/
├── layout/         AdminLayout, Sidebar, TopBar, Breadcrumb
├── dashboard/      StatsCard, ConversionFunnel, RevenueChart,
│                   RealTimeEvents, TopPaywalls
├── paywalls/       PaywallList, PaywallCard, PaywallStatusBadge,
│                   CreatePaywallModal
├── editor/         EditorCanvas, ComponentPanel, PropertyPanel,
│                   PreviewPanel, layers/*, VersionHistory
├── templates/      TemplateGrid, TemplateCard, TemplateFilter,
│                   TemplatePreview
├── experiments/    ExperimentList, ExperimentForm, VariantComparison,
│                   ExperimentResults, TrafficAllocation
├── audience/       AttributeList, BehaviorRuleBuilder, AudienceSegment
├── settings/       BrandSettings, WebhookManager, EnvironmentSelector
└── shared/         DataTable, FilterBar, SearchInput, ConfirmDialog,
                    LoadingSkeleton, StatusBadge
```

### Mock 数据设计

```
mocks/
├── paywalls.ts       # 10+ 条付费墙
├── templates.ts      # 50+ 条模板
├── experiments.ts    # 5+ 条实验
├── analytics.ts      # 仪表盘时序
├── audience.ts       # 受众属性
└── settings.ts       # 品牌配置
```

zustand store 统一注入，模拟 200-500ms 异步延迟。

---

## 七、实施顺序

### 阶段 1：基础设施（共享层）
1. 初始化 pnpm workspace + tsconfig + Tailwind + ESLint
2. 搭建 `@gate-flow/shared` 包（tokens、基础组件、hooks、utils）

### 阶段 2：Marketing Website
3. 路由框架 + Layout 组件
4. 落地页（复用 front/index.html 设计）
5. 文档站（MDX 集成 + 侧边导航）
6. 定价页、Blog、案例、社区
7. 隐私/条款静态页

### 阶段 3：Admin Console
8. 路由框架 + Layout 组件
9. 仪表盘页面
10. 付费墙编辑器（拖拽核心）
11. 模板市场
12. 实验管理 + 受众管理 + 设置

### 阶段 4：质量收尾
13. 两应用间交叉验证，共享组件一致性
14. 响应式适配、性能优化

---

## 八、约束与风险

| 项 | 决策 |
|----|------|
| 响应式 | Marketing 全响应式，Admin 最小支持 1024px |
| 浏览器 | Chrome/Firefox/Safari/Edge 最新两个版本 |
| Mock 可替换性 | 所有数据入口统一为 store，不直接在组件中硬编码 |
| 图片资产 | 从 `front/images/` 迁移，后续新增使用 WebP |
| 国际化 | MVP 仅中文，预留 i18n 扩展点 |
| Git | 不提交 `node_modules`、`dist`、`.env` |

---

<!-- DESIGN_DOC_CHECKLIST -->
<!-- [x] 项目结构已定义 -->
<!-- [x] 技术选型已确定 -->
<!-- [x] 设计系统方向已明确 -->
<!-- [x] Marketing Website 路由和组件已规划 -->
<!-- [x] Admin Console 路由和组件已规划 -->
<!-- [x] Mock 数据策略已确定 -->
<!-- [x] 实施顺序已排列 -->
<!-- [x] 无 TBD 占位符 -->
