# 营销站点

本文档介绍 Marketing Site 的技术栈和开发指南。

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型系统 |
| Vite | 构建工具 |
| Tailwind CSS v4 | 样式 |
| React Router v6 | 路由 |

## 目录结构

```
apps/marketing/
├── src/
│   ├── components/    # 页面组件
│   ├── pages/        # 路由页面
│   │   ├── Home.tsx
│   │   ├── Docs.tsx
│   │   ├── Pricing.tsx
│   │   └── Blog.tsx
│   ├── data/         # 静态数据
│   └── styles/       # 样式文件
├── public/
└── package.json
```

## 开发命令

```bash
cd apps/marketing

# 启动开发服务器 (port 3000)
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build
```

## 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | / | Landing page |
| 文档 | /docs | 文档入口 |
| 定价 | /pricing | 价格方案 |
| 博客 | /blog | 技术博客 |
| 客户案例 | /customers | 客户案例 |

## 静态数据

营销内容使用本地 JSON 文件管理：

```
src/data/
├── features.json     # 功能特性
├── pricing.json      # 定价方案
└── customers.json     # 客户案例
```

## Tailwind CSS

样式使用 Tailwind CSS v4：

```css
/* src/styles/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-sans: system-ui, sans-serif;
}
```