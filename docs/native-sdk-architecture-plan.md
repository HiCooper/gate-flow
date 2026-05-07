# GateFlow Native SDK Architecture Plan

## Superwall SDK 综合分析

### 规模
- **iOS**: 420 Swift files, ~25+ 模块目录
- **Android**: 365 Kotlin files
- 两者架构高度对称，核心模块一一对应

### 核心架构模式（跨平台通用）

#### 1. 入口模式
- **iOS**: `@objcMembers public class Superwall: ObservableObject` + `shared` 单例 + 静态 `configure()` 工厂方法
- **Android**: `class Superwall` companion object + `instance` 单例 + 静态 `configure()` 方法
- **共性**: 单例入口，静态 configure 初始化，实例方法调用

#### 2. 依赖注入 (DI)
- **DependencyContainer**: 组合所有子模块实例（IdentityManager, ConfigManager, Network, Storage, Logger, PaywallManager 等）
- **Factory 协议**: 通过协议抽象对象创建，支持 mock 测试
- **iOS 特有**: 大量使用 `unowned let` 避免 retain cycle
- **Android 特有**: 构造函数参数注入 + `SdkContext` 全局上下文

#### 3. 状态管理
- **iOS**: Combine 框架 — `@Published` 属性 + `CurrentValueSubject` + `AnyPublisher`
- **Android**: kotlinx.coroutines Flow — `StateFlow` + `SharedFlow`
- **关键状态**: `configState`, `identitySubject`, `subscriptionStatus`, `customerInfo`

#### 4. Identity 系统
- 匿名用户：自动生成 `aliasId` (UUID) + `seed` (随机整数，用于 bucketing)
- 已登录用户：`appUserId` 由开发者传入
- `userId = appUserId ?? aliasId`
- `DispatchGroup` (iOS) / `StateActor` (Android) 管理身份解析的异步完成
- 用户属性持久化 + 合并策略
- identify 时可能触发 reset（换用户）

#### 5. Config 系统
- 远程 fetch + 本地 cache（UserDefaults/DataStore）
- 首次启动：同步等待 config 返回（有超时）
- 已订阅用户：先用 cache，后台异步刷新
- Config 包含：triggers、paywalls、experiments、feature flags、products
- `getAssignments()` 从服务端获取实验分组
- `choosePaywallVariants()` 基于 seed 选择变体
- 支持 config refresh（增量更新）

#### 6. Storage 抽象
- **iOS**: UserDefaults（简单值）+ CoreData（复杂模型）
- **Android**: SharedPreferences（简单值）+ DataStore/Room（复杂模型）
- 统一接口：`read<T>(storable)`, `write(storable, data)`, `delete`, `clean`
- 存储内容：config cache, assignments, identity, user attributes, enrichment, subscription status

#### 7. 事件系统 (Analytics)
- **Internal Tracking**: SDK 内部事件追踪（config fetch, paywall present, purchase 等）
- **Attribution**: 归因追踪（ASId, IDFV, ATT 等）
- **SuperwallEvent**: 60+ 种事件类型
- **Event Queue**: 离线缓冲 + 批量发送
- **PlacementsQueue**: placement 触发队列

#### 8. Delegate 模式
- `SuperwallDelegate` 协议 + 默认空实现 extension
- 生命周期回调：paywall present/dismiss, subscription change, custom action, deep link, log
- **iOS 额外**: `SuperwallDelegateAdapter` 处理多 delegate
- **Android 额外**: 通过 `superwallEventBridge` 转发到 Expo/React Native

#### 9. Serial Task Management
- **Android**: `SerialTaskManager` — Channel 驱动的串行任务队列
- **iOS**: `DispatchQueue` + `DispatchGroup` 模式
- 用途：保证异步操作的顺序性（如 identify → getAssignments → ready）

#### 10. Logger
- 分级：debug, info, warn, error
- 分 scope：superwallCore, configManager, identityManager, network, paywallManager 等
- 可delegate 到外部

---

## Superwall 模块全清单（GateFlow 映射）

| Superwall 模块 | iOS 目录 | Android 包 | GateFlow 需要? | 说明 |
|---|---|---|---|---|
| **Superwall (入口)** | Superwall.swift | Superwall.kt | **是** | 单例入口，configure/reset/identify |
| **DependencyContainer** | Dependencies/ | dependencies/ | **是** | DI 容器 |
| **IdentityManager** | Identity/ | identity/ | **是** | 用户身份 + 匿名 + 属性 |
| **ConfigManager** | Config/ | config/ | **是** | 配置获取 + 缓存 + 实验分组 |
| **Network/API** | Network/ | network/ | **是** | HTTP 客户端 |
| **Storage** | Storage/ | storage/ | **是** | 本地持久化 |
| **Logger** | Logger/ | logger/ | **是** | 日志系统 |
| **Analytics/Tracking** | Analytics/ | analytics/ | **是** (简化) | 事件上报，移除 purchase 相关 |
| **Attribution** | Analytics/Attribution | - | **简化** | 简化设备信息收集 |
| **Delegate** | Delegate/ | delegate/ | **是** | 生命周期回调 |
| **Misc/Utilities** | Misc/ | misc/ | **是** | 工具类 |
| **Models** | Models/ | models/ | **是** (改造) | 实验/变体/事件模型 |
| **Permissions** | Permissions/ | permissions/ | **否** | 权限请求（Superwall 特有） |
| **Paywall** | Paywall/ | paywall/ | **否** | 付费墙渲染（未来可能） |
| **StoreKit/Billing** | StoreKit/ | store/ | **否** | 应用内购（未来可能） |
| **TestMode** | TestMode/ | store/testmode/ | **简化** | 简化为调试模式 |
| **Debug** | Debug/ | - | **可选** | 调试 UI（iOS 特有） |
| **DeepLinkRouter** | DeepLinkRouter.swift | deeplinks/ | **否** | 深链路由（Superwall 特有） |
| **GameController** | Game Controller/ | game/ | **否** | 游戏控制器（可选） |
| **Web/Entitlements** | Web/ | web/ | **否** | Web 支付相关 |
| **Graveyard** | Graveyard/ | - | **否** | 废弃代码 |

---

## GateFlow iOS SDK 架构设计

### 文件结构

```
GateFlowSDK/
├── GateFlow.xcodeproj
├── Package.swift                    # Swift Package Manager
├── Sources/
│   └── GateFlowKit/
│       ├── GateFlow.swift           # 主入口：单例 + configure
│       ├── Dependencies/
│       │   ├── DependencyContainer.swift
│       │   └── FactoryProtocols.swift
│       ├── Identity/
│       │   ├── IdentityManager.swift
│       │   ├── IdentityLogic.swift
│       │   ├── IdentityInfo.swift
│       │   └── PublicIdentity.swift
│       ├── Config/
│       │   ├── ConfigManager.swift
│       │   ├── ConfigLogic.swift
│       │   └── ConfigurationStatus.swift
│       ├── Network/
│       │   ├── API.swift
│       │   ├── Network.swift
│       │   └── Endpoint.swift
│       ├── Storage/
│       │   ├── Storage.swift
│       │   └── Cache/
│       │       └── UserDefaultsStorage.swift
│       ├── Logger/
│       │   ├── Logger.swift
│       │   ├── LogLevel.swift
│       │   └── LogScope.swift
│       ├── Analytics/
│       │   ├── EventTracker.swift
│       │   ├── EventQueue.swift
│       │   └── Events/
│       │       └── GateFlowEvent.swift
│       ├── Experiment/
│       │   ├── ExperimentManager.swift
│       │   ├── ExperimentInfo.swift
│       │   ├── ExperimentResult.swift
│       │   └── BucketEngine.swift   # 复用 backend victor-bucketing 逻辑
│       ├── Delegate/
│       │   ├── GateFlowDelegate.swift
│       │   └── GateFlowDelegateAdapter.swift
│       └── Misc/
│           ├── Constants.swift
│           ├── JSONToDict.swift
│           └── DeviceHelper.swift
└── Tests/
    └── GateFlowKitTests/
        ├── BucketEngineTests.swift
        ├── IdentityManagerTests.swift
        └── ConfigManagerTests.swift
```

### 核心设计

**GateFlow.swift — 主入口**
```swift
@objcMembers public class GateFlow: ObservableObject {
    public static var shared: GateFlow { ... }
    public static func configure(apiUrl: String, apiKey: String, options: GateFlowOptions) async

    @Published public private(set) var isConfigured = false
    @Published public private(set) var isLoading = false
    @Published public private(set) var configurationError: Error?
    @Published public private(set) var identity: PublicIdentity?
    @Published public private(set) var activeExperiments: [String: Experiment]

    public func identify(_ userId: String, attributes: [String: Any]?) async throws
    public func reset()
    public func evaluate(placementKey: String, params: [String: Any]?) async -> ExperimentResult
    public func track(event: GateFlowEvent) async
    public func setUserAttributes(_ attributes: [String: Any])
    public func getUserAttributes() -> [String: Any]
    public func getExperiment(key: String) -> Experiment?
    public func getAllExperiments() -> [Experiment]
    public func preloadExperiments(placementKeys: [String]) async
}
```

**关键差异 vs Superwall iOS**:
1. 无 `@objc public var delegate` 的复杂 adapter（GateFlow 用更简单的 closure 或 async stream）
2. 无 `@Published var subscriptionStatus` / `customerInfo`
3. 无 paywall presentation / purchase handling / StoreKit
4. `ExperimentResult` 替代 `PaywallResult`
5. 新增 `eventBatchSize` / `eventFlushInterval` 事件批处理
6. BucketEngine 直接复用 backend `victor-bucketing` 的 Swift 移植（纯 Java → 纯 Swift）

---

## GateFlow Android SDK 架构设计

### 文件结构

```
gateflow-sdk/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── gateflow/
    ├── build.gradle.kts
    └── src/main/java/com/gateflow/sdk/
        ├── GateFlow.kt                # 主入口：companion object + instance
        ├── SdkContext.kt              # 全局上下文
        ├── Dependencies/
        │   ├── DependencyContainer.kt
        │   └── FactoryProtocols.kt
        ├── Identity/
        │   ├── IdentityManager.kt
        │   ├── IdentityLogic.kt
        │   ├── IdentityContext.kt
        │   ├── IdentityState.kt       # StateActor 状态机
        │   └── PublicIdentity.kt
        ├── Config/
        │   ├── ConfigManager.kt
        │   ├── ConfigLogic.kt
        │   ├── ConfigContext.kt
        │   └── ConfigState.kt         # StateActor 状态机
        ├── Network/
        │   ├── API.kt
        │   ├── Network.kt
        │   ├── RequestExecutor.kt
        │   └── Endpoint.kt
        ├── Storage/
        │   ├── Storage.kt
        │   ├── LocalStorage.kt
        │   ├── Cache.kt
        │   └── CacheKeys.kt
        ├── Logger/
        │   ├── Logger.kt
        │   ├── LogLevel.kt
        │   └── LogScope.kt
        ├── Analytics/
        │   ├── EventTracker.kt
        │   ├── EventQueue.kt
        │   └── Events/
        │       └── GateFlowEvent.kt
        ├── Experiment/
        │   ├── ExperimentManager.kt
        │   ├── ExperimentInfo.kt
        │   ├── ExperimentResult.kt
        │   └── BucketEngine.kt        # 复用 backend victor-bucketing 逻辑
        ├── Delegate/
        │   ├── GateFlowDelegate.kt
        │   └── GateFlowDelegateBridge.kt  # 用于 RN 桥接
        └── Misc/
            ├── SerialTaskManager.kt
            ├── Constants.kt
            ├── DeviceHelper.kt
            └── Extensions.kt
```

### 核心设计

**GateFlow.kt — 主入口**
```kotlin
class GateFlow private constructor() {
    companion object {
        val instance: GateFlow = GateFlow()
        val initialized: Boolean get() = ...

        suspend fun configure(
            context: Context,
            apiUrl: String,
            apiKey: String,
            options: GateFlowOptions = GateFlowOptions()
        )
    }

    var isConfigured: Boolean by lazy { ... }
    val placements: SharedFlow<PlacementEvent> = ...
    val customerInfo: StateFlow<CustomerInfo?> = ...  // 预留，暂不使用

    suspend fun identify(userId: String, attributes: Map<String, Any>? = null)
    fun reset()
    suspend fun evaluate(placementKey: String, params: Map<String, Any>? = null): ExperimentResult
    suspend fun track(event: GateFlowEvent)
    fun setUserAttributes(attributes: Map<String, Any>)
    fun getUserAttributes(): Map<String, Any>
    fun getExperiment(key: String): Experiment?
    fun getAllExperiments(): List<Experiment>
    suspend fun preloadExperiments(placementKeys: List<String>)
}
```

**关键差异 vs Superwall Android**:
1. 无 `billingClient` / `StoreManager` / Google Play 集成
2. 无 `PaywallViewEventCallback` / paywall presentation
3. `StateActor` 模式保留（Android SDK 的核心状态机模式）
4. `SerialTaskManager` 保留（保证操作顺序）
5. 移除 subscription/entitlement/billing 相关模块

---

## 两平台共通设计决策

### 1. BucketEngine 移植
- Backend `victor-bucketing` 是纯 Java，无 Spring 依赖
- 可 1:1 翻译为 Swift (iOS) 和 Kotlin (Android)
- `computeBucket(userId, layerId, salt)` → MurmurHash3
- `findVariant(bucket, variantSpecs)` → bucket 映射到 variant

### 2. 事件系统（简化版）
| 事件 | 说明 |
|---|---|
| `onConfigSuccess` | 配置加载成功 |
| `onConfigFail` | 配置加载失败 |
| `onConfigRefresh` | 配置刷新 |
| `onUserIdentified` | 用户识别完成 |
| `onUserReset` | 用户重置 |
| `onExperimentEvaluated` | 实验评估完成 |
| `onEventTracked` | 事件上报 |
| `onUserAttributesUpdated` | 用户属性更新 |

### 3. 事件批处理
- 本地队列缓冲事件
- 达到 `eventBatchSize` 或 `eventFlushInterval` 时批量发送
- 离线持久化，网络恢复后重发

### 4. 配置缓存策略
- 首次启动：同步等待（超时 1-3s），失败则报错
- 后续启动：先用本地缓存，后台异步刷新
- 缓存 TTL 可配置（默认 5 分钟）

### 5. Test/Debug 模式
- 简化版：通过特定 userId 或 API key 前缀激活
- 激活后：返回预设实验配置，log level 设为 debug
- 移除 Superwall 的 test mode purchase drawer 等复杂 UI

### 6. RN Bridge 接口
- iOS: Expo Modules Core — `@ExposedModule` + `@Function`
- Android: Expo Modules Core — `ExpoModule` + `@Function`
- 事件下发: `sendEvent(eventName, payload)`
- 与 expo-gateflow TypeScript 层的方法签名 1:1 对应

---

## 实施阶段

### Phase 1: 核心基础设施（可独立使用，无需 RN）
1. **BucketEngine** — 从 victor-bucketing 翻译 Swift + Kotlin
2. **Storage** — 本地持久化层
3. **Logger** — 分级日志
4. **Network/API** — HTTP 客户端 + 端点定义
5. **Models** — 实验、变体、事件等核心模型

### Phase 2: 身份 + 配置
1. **IdentityManager** — 匿名/登录用户 + 属性管理
2. **ConfigManager** — 配置获取 + 缓存 + 实验分组
3. **DependencyContainer** — DI 组装

### Phase 3: 实验 + 事件
1. **ExperimentManager** — 评估实验 + 结果返回
2. **EventTracker + EventQueue** — 事件上报 + 批处理
3. **Delegate** — 生命周期回调

### Phase 4: RN Bridge
1. **iOS Expo Module** — Swift → TS 桥接
2. **Android Expo Module** — Kotlin → TS 桥接
3. **Event Bridge** — 原生事件 → JS 事件分发

### Phase 5: 测试 + 文档
1. 单元测试（BucketEngine, IdentityManager, ConfigManager）
2. 集成测试（mock server）
3. API 文档 + 使用示例

---

## 与 Superwall 的关键区别总结

| 维度 | Superwall | GateFlow |
|---|---|---|
| 核心功能 | 付费墙 + 实验 | 纯 A/B 实验 |
| SDK 规模 | 420/365 文件 | 预计 60-80 文件/平台 |
| 复杂度 | 高（StoreKit, Paywall, Billing） | 中（Identity, Config, Bucketing, Events） |
| UI 组件 | PaywallViewController, TestModeDrawer | 无（纯 SDK） |
| 支付集成 | StoreKit 1/2 + Google Play Billing | 无 |
| 深链路由 | 完整实现 | 无 |
| 第三方归因 | ASId, IDFA, ATT 等 | 简化设备信息 |
| 状态管理 | Combine (iOS) / Flow (Android) | 同上 |
| DI 模式 | DependencyContainer + Factory | 同上 |
| 可移植 bucketing | Java (victor-bucketing) | Swift + Kotlin 移植 |
