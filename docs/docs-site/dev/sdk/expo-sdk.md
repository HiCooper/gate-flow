# Expo SDK

本文档介绍如何在 React Native / Expo 应用中集成 GateFlow SDK。

::: warning 待完善
本文档正在编写中。
:::

## 安装

```bash
pnpm add @gate-flow/expo
```

## 快速开始

```tsx
import { GateFlowProvider, useGateFlow } from '@gate-flow/expo';

function App() {
  return (
    <GateFlowProvider apiKey="your-api-key">
      <YourApp />
    </GateFlowProvider>
  );
}
```
