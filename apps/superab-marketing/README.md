# GateFlow Marketing Website

<div align="center">

**AI 驱动的付费墙增长基础设施 - 官方网站**

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)

</div>

## 📖 项目简介

GateFlow 是面向移动应用与 Web 产品的一站式付费墙基础设施。本项目是 GateFlow 的官方营销网站，展示产品核心功能、定价方案、技术文档、客户案例和博客内容。

## ✨ 核心特性

- **无代码可视化编辑器** - 拖拽式构建付费墙，200+ 模板即用即改
- **高级 A/B 实验** - 多变量测试价格、文案、设计和时机
- **AI 智能优化** - AI 自动生成文案、推荐实验方向、预测获胜变体
- **精准受众定向** - 50+ 自动追踪属性，自定义用户标签
- **订阅管理与权益引擎** - 统一管理多平台订阅
- **实时分析仪表盘** - 秒级更新转化数据，LTV 预测

## 🛠️ 技术栈

- **前端框架**: React 18.3 + TypeScript 5.6
- **构建工具**: Vite 5.4
- **样式方案**: Tailwind CSS 4.0
- **路由管理**: React Router DOM 6.26
- **图标库**: Lucide React 0.441
- **开发语言**: TypeScript

## 📁 项目结构

```
superab-marketing/
├── public/                 # 静态资源
│   └── images/            # 图片资源
├── src/
│   ├── components/        # 可复用组件
│   │   ├── blog/         # 博客相关组件
│   │   ├── community/    # 社区相关组件
│   │   ├── customers/    # 客户案例组件
│   │   ├── docs/         # 文档相关组件
│   │   ├── home/         # 首页组件
│   │   ├── pricing/      # 定价相关组件
│   │   └── shared/       # 通用组件
│   ├── data/             # 静态数据
│   │   ├── blog.ts       # 博客数据
│   │   ├── customers.ts  # 客户数据
│   │   ├── docs.ts       # 文档数据
│   │   ├── features.ts   # 功能特性数据
│   │   └── pricing.ts    # 定价数据
│   ├── layouts/          # 布局组件
│   │   ├── DocsLayout.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── pages/            # 页面组件
│   │   ├── HomePage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── DocsPage.tsx
│   │   ├── DocsDetailPage.tsx
│   │   ├── BlogPage.tsx
│   │   ├── BlogDetailPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── CommunityPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── TermsPage.tsx
│   ├── App.tsx           # 应用主组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
├── index.html            # HTML 模板
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── postcss.config.js     # PostCSS 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x 或 pnpm >= 8.x

### 安装依赖

```bash
npm install
```

或使用 pnpm:

```bash
pnpm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npm run typecheck
```

## 🌐 页面路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/` | 首页 | 产品展示、核心功能介绍 |
| `/pricing` | 定价页 | 价格方案和常见问题 |
| `/docs` | 文档中心 | 产品使用文档 |
| `/docs/:slug` | 文档详情 | 具体文档内容 |
| `/blog` | 博客列表 | 最新文章和资讯 |
| `/blog/:slug` | 博客详情 | 文章详细内容 |
| `/customers` | 客户案例 | 成功案例展示 |
| `/community` | 社区 | 社区渠道和资源 |
| `/privacy` | 隐私政策 | 隐私条款 |
| `/terms` | 服务条款 | 使用条款 |

## 🎨 设计系统

- **配色方案**: 深色主题 (#0a0a0f 背景, #f1f1f7 文字)
- **字体**: Inter (英文), Noto Sans SC (中文)
- **响应式设计**: 完全支持移动端、平板和桌面端
- **动画效果**: 流畅的过渡和交互反馈

## 📦 依赖说明

### 生产依赖

- `@gate-flow/shared`: workspace 共享包
- `lucide-react`: 现代化图标库
- `react`: UI 框架
- `react-dom`: React DOM 渲染器
- `react-router-dom`: 路由管理

### 开发依赖

- `@tailwindcss/vite`: Tailwind CSS Vite 插件
- `@types/react`: React 类型定义
- `@types/react-dom`: React DOM 类型定义
- `@vitejs/plugin-react`: Vite React 插件
- `autoprefixer`: CSS 前缀处理器
- `postcss`: CSS 后处理器
- `tailwindcss`: 实用优先 CSS 框架
- `typescript`: TypeScript 编译器
- `vite`: 下一代前端构建工具

## 🔧 配置说明

### Vite 配置

- 端口: 3000
- 别名: `@` 指向 `src` 目录
- 插件: React, Tailwind CSS

### TypeScript 配置

- 严格模式启用
- JSX 支持
- ESNext 模块系统

## 📝 开发规范

- 使用 TypeScript 编写所有代码
- 组件采用函数式组件 + Hooks
- 遵循 React 最佳实践
- 使用 Tailwind CSS 进行样式开发
- 组件命名采用 PascalCase
- 文件命名与组件名保持一致

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用私有许可证，详见 [LICENSE](LICENSE) 文件。

## 📧 联系方式

如有问题或建议，请通过以下方式联系我们：

- 网站: [GateFlow](https://gateflow.ai)
- Email: support@gateflow.ai

---

<div align="center">

Made with ❤️ by GateFlow Team

</div>
