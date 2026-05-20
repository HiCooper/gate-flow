# 共享组件库

本文档介绍 `packages/shared` 共享组件库的设计和使用。

## 概述

`@gate-flow/shared` 是一个源码包（无构建步骤），供所有前端应用共享组件、hooks、工具函数和设计 token。

## 目录结构

```
packages/shared/
├── src/
│   ├── tokens/        # 设计 token
│   ├── hooks/         # 共享 hooks
│   ├── utils/         # 工具函数
│   └── components/    # 共享组件
├── package.json
└── tsconfig.json
```

## 设计 Token

统一的颜色、间距、字体等设计变量：

```typescript
// tokens/colors.ts
export const colors = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// tokens/spacing.ts
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};
```

## 共享 Hooks

```typescript
// hooks/useExperiment.ts
import { useState, useEffect } from 'react';
import { fetchExperiment } from '../utils/api';

export function useExperiment(expId: string) {
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiment(expId).then(setExperiment).finally(() => setLoading(false));
  }, [expId]);

  return { experiment, loading };
}
```

## 使用方式

在应用中导入：

```typescript
import { colors, spacing } from '@gate-flow/shared/tokens';
import { useExperiment } from '@gate-flow/shared/hooks';
import { Button } from '@gate-flow/shared/components';
```

## 注意事项

- 作为 peer dependency，需在宿主应用中安装 react、react-dom
- 无构建步骤，直接使用 TypeScript 源码
- 保持 API 稳定性，避免破坏性变更