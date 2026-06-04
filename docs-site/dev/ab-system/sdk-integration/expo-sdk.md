# Expo SDK

本文档介绍如何在 React Native / Expo 应用中集成 GateFlow SDK。

## 安装

```bash
pnpm add @gate-flow/expo
```

## 快速开始

### 1. 初始化 Provider

```tsx
import { GateFlowProvider } from '@gate-flow/expo';

function App() {
  return (
    <GateFlowProvider
      baseUrl="http://localhost:8081"
      apiKey="your-api-key"
    >
      <YourApp />
    </GateFlowProvider>
  );
}
```

### 2. 使用 Hook

```tsx
import { useGateFlow } from '@gate-flow/expo';

function ProductCard() {
  const { getVariant } = useGateFlow();
  const variant = getVariant('user_123', 'exp_001');

  if (variant?.params.buttonColor === 'red') {
    return <RedButton />;
  }
  return <DefaultButton />;
}
```

### 3. 事件追踪

```tsx
import { useGateFlow } from '@gate-flow/expo';

function ExperimentWrapper({ expId, children }) {
  const { trackExposure, trackClick } = useGateFlow();

  useEffect(() => {
    trackExposure('user_123', expId);
  }, [expId]);

  return children;
}
```

## API

### GateFlowProvider

| Prop | 类型 | 说明 |
|------|------|------|
| baseUrl | string | API 基础地址 |
| apiKey | string | API 密钥 |
| refreshInterval | number | 刷新间隔(ms)，默认 60000 |

### useGateFlow

| 方法 | 说明 |
|------|------|
| getVariant(userId, expId) | 获取分桶结果 |
| refresh() | 强制刷新配置 |

## 分桶一致性

Expo SDK 使用 JavaScript 实现的 MurmurHash3，与后端算法一致。