# iOS SDK

本文档介绍如何在 iOS 应用中集成 GateFlow SDK。

## 状态

iOS SDK 目前处于开发阶段，核心架构已完成，分桶引擎已实现。

## 安装

### Swift Package Manager

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/HiCooper/gate-flow-ios.git", from: "1.0.0")
]
```

## 核心组件

| 组件 | 说明 |
|------|------|
| GateFlow | 主入口类 |
| BucketEngine | 分桶引擎（纯算法） |
| ConfigManager | 配置管理 |

## 使用示例

### 初始化

```swift
import GateFlow

GateFlow.initialize(baseURL: "http://localhost:8080", apiKey: "your-key")
```

### 获取变体

```swift
if let variant = GateFlow.shared.getVariant(userId: "user_123", experimentId: "exp_001") {
    let params = variant.params // ["button_color": "red"]
    // 根据 variant 做业务逻辑
}
```

### 事件追踪

```swift
GateFlow.shared.trackExposure(userId: "user_123", experimentId: "exp_001", variant: variant.key)
GateFlow.shared.trackClick(userId: "user_123", experimentId: "exp_001", variant: variant.key)
```

## 分桶一致性

iOS SDK 使用与后端相同的 MurmurHash3 算法，确保分桶结果一致：

```swift
let bucket = BucketEngine.computeBucket(
    userId: "user_123",
    layerId: "layer_001",
    salt: "v1"
)
// bucket: 0-9999
```

## 待实现功能

- [ ] 完整的配置拉取机制
- [ ] 本地缓存策略
- [ ] 自动曝光上报
- [ ] SwiftUI 集成