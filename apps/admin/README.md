# GateFlow Admin

一个现代化的 A/B 测试和付费墙管理平台，用于优化应用变现策略。

## 📋 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [API 代理配置](#api-代理配置)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目简介

GateFlow Admin 是一个功能强大的管理后台系统，专为移动应用和网站的变现优化而设计。它提供了完整的 A/B 测试工作流、付费墙管理、数据分析和受众细分功能，帮助产品团队做出数据驱动的决策。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **样式**: Tailwind CSS v4
- **图表**: Recharts
- **拖拽**: @dnd-kit
- **图标**: Lucide React

## 功能特性

### 📊 仪表盘
- 实时数据概览
- 转化率追踪
- 月度经常性收入 (MRR) 监控
- 转化漏斗分析
- 实时事件流
- 热门付费墙排行

### 🧪 A/B 实验
- 创建和管理 A/B 测试实验
- 多变量测试支持
- 实验状态管理（草稿、运行中、暂停、已完成等）
- 统计显著性分析
- 流量分配控制
- 实验结果可视化

### 💳 付费墙管理
- 可视化付费墙编辑器
- 模板库管理
- 拖拽式布局设计
- 实时预览

### 👥 受众细分
- 用户群体管理
- 定向规则配置
- 受众分析

### ⚙️ 设置
- 系统配置
- 集成管理
- 权限控制

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9 或 yarn >= 1.22

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd admin

# 安装依赖
npm install
# 或
yarn install
```

### 开发

```bash
# 启动开发服务器
npm run dev
# 或
yarn dev

# 访问 http://localhost:3001
```

### 构建

```bash
# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
admin/
├── src/
│   ├── api/                    # API 接口层
│   │   ├── diagnosisApi.ts    # 诊断相关 API
│   │   └── experimentApi.ts   # 实验相关 API
│   ├── components/            # 可复用组件
│   │   ├── dashboard/         # 仪表盘组件
│   │   ├── experiments/       # 实验相关组件
│   │   │   ├── charts/        # 图表组件
│   │   │   ├── forms/         # 表单组件
│   │   │   ├── indicators/    # 指标组件
│   │   │   ├── tables/        # 表格组件
│   │   │   └── tabs/          # 标签页组件
│   │   └── shared/            # 通用组件
│   ├── layouts/               # 布局组件
│   │   ├── AdminLayout.tsx    # 主布局
│   │   ├── Sidebar.tsx        # 侧边栏
│   │   └── TopBar.tsx         # 顶部导航
│   ├── mocks/                 # Mock 数据
│   ├── pages/                 # 页面组件
│   │   ├── DashboardPage.tsx          # 仪表盘
│   │   ├── ExperimentsPage.tsx        # 实验列表
│   │   ├── ExperimentDetailPage.tsx   # 实验详情
│   │   ├── PaywallsPage.tsx           # 付费墙列表
│   │   ├── PaywallEditorPage.tsx      # 付费墙编辑器
│   │   ├── TemplatesPage.tsx          # 模板管理
│   │   ├── AudiencePage.tsx           # 受众管理
│   │   ├── SettingsPage.tsx           # 设置
│   │   └── QuickstartPage.tsx         # 快速开始
│   ├── stores/                # Zustand 状态管理
│   │   ├── analyticsStore.ts  # 分析数据状态
│   │   ├── experimentStore.ts # 实验状态
│   │   ├── paywallStore.ts    # 付费墙状态
│   │   ├── audienceStore.ts   # 受众状态
│   │   ├── settingsStore.ts   # 设置状态
│   │   └── templateStore.ts   # 模板状态
│   ├── App.tsx                # 应用根组件
│   ├── main.tsx               # 入口文件
│   └── index.css              # 全局样式
├── .env.development           # 开发环境变量
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
└── README.md                  # 项目文档
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 如需状态管理，在 `src/stores/` 中创建对应的 store

### 添加新组件

1. 根据组件类型在 `src/components/` 对应子目录中创建
2. 通用组件放在 `src/components/shared/`
3. 导出组件以便在其他地方使用

### 状态管理

项目使用 Zustand 进行状态管理。每个主要功能模块都有独立的 store：

```typescript
import { useExperimentStore } from '../stores/experimentStore';

function MyComponent() {
  const { experiments, fetchExperiments } = useExperimentStore();
  
  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);
  
  return <div>{/* 使用 experiments 数据 */}</div>;
}
```

### 样式规范

- 使用 Tailwind CSS 实用类
- 遵循项目的设计系统令牌
- 保持响应式设计

## API 代理配置

开发环境下，Vite 配置了 API 代理：

- 前端地址: `http://localhost:3001`
- 后端 API: `http://localhost:8081`

所有 `/api` 开头的请求会被代理到后端服务器。如需修改，编辑 `vite.config.ts` 中的 proxy 配置。

## 环境变量

复制 `.env.development` 并根据需要配置：

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请提交 Issue 或联系维护团队。

---

**注意**: 这是一个内部管理系统，请确保在受控环境中部署和使用。
