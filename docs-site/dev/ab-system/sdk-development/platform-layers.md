# 平台层

本文档介绍各平台 SDK 的适配层设计，实现跨平台一致性。

## 架构分层

```
┌─────────────────────────────────────────┐
│           业务层 (Business)              │
│    根据 variant 做业务逻辑 (UI/功能)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           事件追踪层 (Tracking)          │
│      曝光/点击/转化事件上报               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           配置管理层 (Config)            │
│     配置拉取、缓存、版本比对              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           分桶核心 (Bucket Engine)       │
│      MurmurHash3 + 变体匹配 (纯算法)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           网络层 (HTTP Client)           │
│         OkHttp / URLSession / etc        │
└─────────────────────────────────────────┘
```

## 平台实现

### Java (服务端 SDK)

- 网络: OkHttp
- 缓存: Caffeine
- 特点: 支持 Spring Boot 集成

### Kotlin (Android SDK)

- 网络: OkHttp (Android)
- 缓存: SharedPreferences + Memory
- 特点: Kotlin 协程支持

### Swift (iOS SDK)

- 网络: URLSession
- 缓存: UserDefaults + Memory
- 特点: SwiftUI/UIKit 兼容

### TypeScript (Web/RN SDK)

- 网络: Fetch API
- 缓存: localStorage + Memory
- 特点: 通用 JavaScript 环境

## 一致性保证

### 配置格式

各平台使用相同的配置 JSON 结构：

```json
{
  "version": "20240501-120000",
  "experiments": [{
    "expId": "exp_001",
    "layerId": "layer_001",
    "salt": "v1",
    "variants": [{
      "bucketId": "control",
      "bucketStart": 0,
      "bucketEnd": 4999,
      "params": {"color": "blue"}
    }]
  }]
}
```

### 事件格式

统一的事件 Schema：

```json
{
  "eventType": "exposure",
  "expId": "exp_001",
  "variantKey": "treatment",
  "userId": "user_123",
  "timestamp": 1704067200000,
  "properties": {}
}
```