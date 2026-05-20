# 管理控制台

本文档介绍 Admin Dashboard 的技术栈和开发指南。

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型系统 |
| Vite | 构建工具 |
| Tailwind CSS v4 | 样式 |
| React Router v6 | 路由 |
| Zustand | 状态管理 |
| @dnd-kit | 拖拽功能 |
| Recharts | 图表 |

## 目录结构

```
apps/admin/
├── src/
│   ├── api/           # API 调用
│   ├── components/   # 公共组件
│   ├── pages/         # 页面组件
│   ├── stores/        # Zustand stores
│   ├── hooks/         # 自定义 hooks
│   └── types/         # TypeScript 类型
├── public/            # 静态资源
└── package.json
```

## 开发命令

```bash
cd apps/admin

# 启动开发服务器 (port 3001)
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build
```

## 核心功能模块

| 模块 | 说明 |
|------|------|
| 实验管理 | 创建、编辑、启动、停止实验 |
| 层级配置 | 管理流量分层 |
| 数据分析 | 查看实验指标和统计结果 |
| 白名单管理 | 维护用户白名单 |

## API 集成

前端通过 `/api/v1/*` 调用后端服务：

```typescript
// apps/admin/.env.development
VITE_API_BASE_URL=http://localhost:8080
```

## 状态管理

使用 Zustand 管理全局状态：

```typescript
// stores/experimentStore.ts
import { create } from 'zustand';

interface ExperimentStore {
  experiments: Experiment[];
  fetchExperiments: () => Promise<void>;
}

export const useExperimentStore = create<ExperimentStore>((set) => ({
  experiments: [],
  fetchExperiments: async () => {
    const data = await api.get('/experiments');
    set({ experiments: data });
  },
}));
```

## 路由配置

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="experiments" element={<ExperimentList />} />
    <Route path="experiments/:id" element={<ExperimentDetail />} />
  </Route>
</Routes>
```