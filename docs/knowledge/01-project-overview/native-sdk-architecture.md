# Native SDK 架构设计

**类型：** 决策
**范围：** iOS SDK + Android SDK
**前置依赖：** 无
**最后更新：** 2026-05-07

## 摘要（TL;DR）

GateFlow 原生 SDK 采用分层架构：底层是纯计算引擎（BucketEngine + MurmurHash3），中层是业务组件（Identity/Config/Analytics/Network），上层通过 Bridge Adapter 桥接到 Expo RN 模块。iOS 使用 SPM 分发，Android 使用 Gradle AAR 分发。

## 背景

用户分析了 expo-superwall 项目后，认为现有 victor-sdk 不是面向端的设计。需要参考 expo-superwall 的架构模式，为 GateFlow 设计原生 iOS 和 Android SDK，并通过 expo-gateflow 桥接到 React Native。

## 详情

### 分层设计

```
┌─────────────────────────────────────────────────┐
│  React Native (Hooks + Provider + Context)      │
│  GateFlowProvider, useExperiment, useGateFlow   │
├─────────────────────────────────────────────────┤
│  Bridge Adapter Layer                           │
│  GateFlowBridgeAdapter (Swift/Kotlin)           │
├─────────────────────────────────────────────────┤
│  Native SDK Business Layer                      │
│  GateFlow (singleton) / DependencyContainer     │
│  IdentityManager, ConfigManager, EventTracker   │
├─────────────────────────────────────────────────┤
│  Native SDK Core Layer                          │
│  MurmurHash3, BucketEngine (pure computation)   │
│  Storage (UserDefaults / SharedPreferences)     │
│  Network (URLSession / OkHttp)                  │
│  Logger (print / Android Log)                   │
└─────────────────────────────────────────────────┘
```

### 关键设计决策

1. **BucketEngine 纯 Java/纯计算** — 与后端 `victor-bucketing` 模块保持 1:1 逻辑映射，确保分流一致性
2. **MurmurHash3 跨平台一致性** — iOS(Swift)、Android(Kotlin)、Java 后端必须产生相同的 hash 值
3. **10000 buckets** — 支持 0.1% 流量分配粒度
4. **Layer-based orthogonal traffic** — 不同层使用不同 salt，实验互不干扰
5. **Event batching** — 可配置的 batchSize 和 flushInterval，减少网络请求
6. **Identity management** — 匿名 aliasId → 登录后 appUserId 切换，thread-safe

### 文件结构

```
packages/
├── ios-sdk/                          # GateFlowKit (SPM)
│   ├── Sources/GateFlowKit/
│   │   ├── Experiment/               # MurmurHash3, BucketEngine
│   │   ├── Identity/                 # IdentityManager, IdentityLogic
│   │   ├── Config/                   # ConfigManager
│   │   ├── Analytics/                # EventTracker
│   │   ├── Network/                  # Network, Endpoint
│   │   ├── Storage/                  # Storage protocol, UserDefaultsStorage
│   │   ├── Logger/                   # LogLevel, LogScope, Logger
│   │   ├── Dependencies/             # DependencyContainer
│   │   ├── Delegate/                 # GateFlowDelegate
│   │   └── GateFlow.swift            # 主入口
│   └── Package.swift
├── android-sdk/                      # com.gateflow.sdk (Gradle)
│   └── gateflow/src/main/java/com/gateflow/sdk/
│       ├── experiment/               # MurmurHash3, BucketEngine
│       ├── identity/                 # IdentityManager, IdentityLogic
│       ├── config/                   # ConfigManager
│       ├── analytics/                # EventTracker
│       ├── network/                  # Network, Endpoint
│       ├── storage/                  # Storage, LocalStorage
│       ├── logger/                   # LogLevel, LogScope, Logger
│       ├── dependencies/             # DependencyContainer
│       ├── delegate/                 # GateFlowDelegate
│       └── GateFlow.kt               # 主入口
└── expo-gateflow/                    # Expo RN Bridge
    ├── src/                          # TypeScript (Provider, Hooks, Zustand)
    ├── ios/                          # Swift Bridge → import GateFlowKit
    └── android/                      # Kotlin Bridge → import com.gateflow.sdk
```

## 可执行规则

- **应该：** iOS SDK 通过 SPM 引用 (`packages/ios-sdk`)，Android SDK 通过 Gradle project 引用 (`packages/android-sdk`)
- **应该：** Bridge Adapter 中直接使用原生 SDK 的 public API，不要重复实现逻辑
- **应该：** MurmurHash3 的三个平台实现（Java/Swift/Kotlin）必须产生相同的 hash 值
- **禁止：** 在 Bridge 层直接调用网络或存储，所有业务逻辑委托给原生 SDK
- **禁止：** 修改 BucketEngine 逻辑而不同步更新三个平台实现

## 后果

如果三个平台的 BucketEngine 不一致，同一用户在不同平台会得到不同的实验分组，导致数据污染和实验结果不可信。

## 关联文档

- `05-historical-lessons/2026-05-07_swift-macos-runtime-crash.md` — macOS 上 Swift 单元测试运行时崩溃
- `packages/ios-sdk/Sources/GateFlowKit/` — iOS SDK 实现
- `packages/android-sdk/gateflow/src/main/java/com/gateflow/sdk/` — Android SDK 实现
- `packages/expo-gateflow/` — Expo RN Bridge 实现
- `backend/victor-service/victor-bucketing/` — 后端 BucketEngine（参考源）
