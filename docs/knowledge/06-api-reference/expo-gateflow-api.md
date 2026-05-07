# Expo Gateflow API 参考

**类型：** 参考
**范围：** React Native / Expo
**前置依赖：** 无
**最后更新：** 2026-05-07

## 摘要（TL;DR）

`@gate-flow/expo` 是 GateFlow 的 Expo SDK，提供 `GateFlowProvider`（初始化）、`useGateFlow`（核心 Hook）、`useExperiment`（实验评估）和 `useGateFlowEvents`（事件订阅）。通过 Zustand Store 管理状态，通过 Expo Modules Core 桥接原生 iOS/Android SDK。

## 背景

RN 应用需要集成 GateFlow A/B 实验功能，通过 expo-gateflow 模块调用原生 SDK。

## 详情

### 安装

```json
{
  "dependencies": {
    "@gate-flow/expo": "file:../packages/expo-gateflow"
  }
}
```

### 初始化

```tsx
import { GateFlowProvider } from "@gate-flow/expo"

function App() {
  return (
    <GateFlowProvider apiUrl="http://localhost:8080" apiKey="your-key">
      <MainApp />
    </GateFlowProvider>
  )
}
```

### 核心 API

| 导出 | 类型 | 说明 |
|------|------|------|
| `GateFlowProvider` | Component | SDK 初始化，必须 |
| `useGateFlow(selector)` | Hook | 获取 SDK 状态/方法 |
| `useExperiment(callbacks)` | Hook | 评估实验，返回 `{evaluate, state}` |
| `useGateFlowEvents(callbacks)` | Hook | 订阅原生事件 |
| `GateFlowContext` | Context | Provider 守卫 |
| `useGateFlowStore` | Hook | 原始 Zustand store |
| `GateFlowExpoModule` | NativeModule | 原生模块引用 |
| `DefaultGateFlowOptions` | Object | 默认配置 |

### 类型

| 类型 | 说明 |
|------|------|
| `Experiment` | 实验信息 `{id, key, layerId, variant}` |
| `Variant` | 变体 `{key, type, params}` |
| `VariantType` | `"CONTROL" \| "TREATMENT"` |
| `ExperimentResult` | 评估结果 (matched/holdout/noMatch/notFound/error) |
| `ExperimentState` | 实验状态 (idle/matched/holdout/noMatch/error) |
| `GateFlowEvent` | 事件 `{eventType, userId?, experimentId?, variantKey?, properties?}` |
| `GateFlowOptions` | 配置选项 |
| `PartialGateFlowOptions` | 部分配置覆盖 |

### Store 方法

通过 `useGateFlow` 可调用：
- `configure(apiUrl, apiKey, options?)` — 初始化 SDK
- `identify(userId, attrs?)` — 识别用户
- `reset()` — 重置为匿名用户
- `evaluateExperiment(placementKey, params?, handlerId?)` — 评估实验
- `trackEvent(event)` — 上报事件
- `setUserAttributes(attrs)` / `getUserAttributes()` — 用户属性
- `getExperiment(key)` / `getAllExperiments()` — 获取实验

### 原生事件

通过 `useGateFlowEvents` 订阅：
- `onConfigSuccess(apiKey)` — 配置成功
- `onConfigFail(error)` — 配置失败
- `onConfigRefresh` — 配置刷新
- `onUserIdentified(userId, attributes)` — 用户识别
- `onUserReset` — 用户重置
- `onExperimentEvaluated(placementKey, result)` — 实验评估
- `onExperimentMatched(experiment)` — 实验匹配
- `onExperimentHoldout(experiment)` — 对照组
- `onExperimentNoMatch()` — 未匹配
- `onExperimentError(error)` — 评估错误
- `onEventTracked(eventType, properties)` — 事件上报
- `onUserAttributesUpdated(attributes)` — 属性更新

## 可执行规则

- **应该：** 所有使用 SDK 的组件必须在 `GateFlowProvider` 内部
- **应该：** 使用 `useExperiment` 而非直接调用 `evaluateExperiment`（前者自动管理事件订阅）
- **禁止：** 在未 `configure` 的情况下调用其他 SDK 方法
- **禁止：** 手动修改 `useGateFlowStore` 的状态，所有变更通过 SDK 方法触发

## 关联文档

- `01-project-overview/native-sdk-architecture.md` — Native SDK 架构
- `packages/expo-gateflow/src/` — TypeScript 实现
