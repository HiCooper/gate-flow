# AB实验系统技术方案

> **版本**: v1.0  
> **日期**: 2026-04-27  
> **目标规模**: 百万DAU · 50+并行实验  
> **分桶延迟**: < 5ms  

---

## 一、系统概述

### 1.1 背景与目标

本系统面向百万级DAU产品，支持50+实验并行运行，提供从实验创建、分流、数据采集、统计分析到决策归档的全链路AB实验能力。核心目标包括：

- **高并发分流**: 支持百万级用户秒级分桶，延迟 < 5ms
- **多层正交**: 域-层正交模型，实现实验互不干扰的并行运行
- **实时+离线双链路**: 分钟级实时指标监控 + T+1离线深度分析
- **科学统计**: 集成CUPED方差缩减、mSPRT序贯检验等先进统计方法
- **全生命周期管理**: 覆盖实验从草稿到归档的完整流程

### 1.2 核心架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        实验管理平台 (Web Console)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 实验创建 │ │ 配置管理 │ │ 报表看板 │ │ 权限控制 │ │  知识库  │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   分流服务    │───▶│ 数据采集管道  │───▶│  数据存储层   │───▶│ 统计分析引擎  │
│   Bucketing  │    │ Data Pipeline│    │ Data Storage │    │ Stats Engine │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 二、分流服务 (Bucketing Service)

### 2.1 哈希分桶算法

采用 **MurmurHash3** 高性能哈希算法，确保分桶的均匀性和性能：

```python
# 分桶公式
bucket = MurmurHash3(user_id + layer_id) % 10000

# 参数说明
# - 桶总数: 10000 → 粒度 0.1% (最小实验流量单位)
# - 拼接 layer_id → 实现层间正交
# - 同一用户 → 同一桶号 (用户粘性，保证用户体验一致性)
```

### 2.2 域-层正交分流模型

#### 2.2.1 架构设计

| 概念 | 说明 | 特性 |
|------|------|------|
| **域 (Domain)** | 流量的顶层划分 | 域间互斥，域内可多层正交 |
| **层 (Layer)** | 域内的实验层 | 层间正交，同层互斥 |
| **桶 (Bucket)** | 最小流量单元 | 10000桶，粒度0.1% |

#### 2.2.2 流量划分示例

**默认域 (90%流量，层间正交)**：

```
推荐层:  [ EXP-A 50% | EXP-B 30% | CTRL 20% ]
            ↕ 正交
UI层:    [ EXP-C 30% | CTRL 30% | 未使用 40% ]
            ↕ 正交
定价层:   [ CTRL 40% | 未使用 60% ]
```

**独占域 (10%流量，域内互斥)**：

```
独占域D: [ D 10% | 预留 90% ]
```

#### 2.2.3 正交性保证

- **层间正交**: 不同层使用 `layer_id` 作为哈希盐值，确保同一用户在不同层被分到不同桶
- **域内互斥**: 同一域内实验流量不重叠，避免实验间干扰
- **用户粘性**: 同一用户在同一层始终获得相同实验版本，保证用户体验一致性

### 2.3 客户端SDK

| 端 | 技术方案 | 特点 |
|----|---------|------|
| iOS | Objective-C/Swift SDK | 本地缓存配置，纯本地计算 |
| Android | Java/Kotlin SDK | 本地缓存配置，纯本地计算 |
| Web | JavaScript SDK | 本地缓存配置，纯本地计算 |

**核心机制**:
- 配置中心增量下发，实时更新实验配置
- 本地缓存 + 纯本地计算，无需网络请求即可分桶
- 埋点自动注入实验标签，确保数据归因准确

---

## 三、数据采集管道 (Data Pipeline)


### 2.4 分流SDK详细设计

#### 2.4.1 SDK架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                      分流SDK (Bucketing SDK)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  配置管理模块  │  │  分桶计算模块  │  │  埋点注入模块  │             │
│  │ ConfigMgr   │  │  BucketEng  │  │  TrackInject │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                    │
│         ▼                ▼                ▼                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              本地缓存层 (Local Cache)                  │       │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │       │
│  │   │ 实验配置缓存 │  │ 用户分桶结果 │  │  兜底配置   │         │       │
│  │   │  (LRU)   │  │  (持久化)  │  │ (Default) │         │       │
│  │   └──────────┘  └──────────┘  └──────────┘         │       │
│  └─────────────────────────────────────────────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              网络通信层 (Network Layer)                │       │
│  │   配置拉取 · 增量更新 · 心跳上报 · 异常降级            │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.4.2 核心模块设计

**① 配置管理模块 (ConfigManager)**

| 功能 | 说明 | 实现要点 |
|------|------|---------|
| **配置拉取** | 从配置中心获取实验配置 | 启动时全量拉取，运行时增量更新 |
| **配置解析** | 解析JSON配置为内存结构 | 验证配置合法性，处理版本兼容 |
| **配置缓存** | 本地持久化实验配置 | SQLite/iOS Keychain/LocalStorage，防配置丢失 |
| **增量同步** | 仅拉取变更的配置 | 基于版本号ETag，减少网络开销 |
| **兜底策略** | 网络失败时使用本地缓存 | 缓存过期时间7天，超期使用硬编码默认配置 |

配置数据结构：
```json
{
  "version": "20260505-143000",
  "etag": "33a64df5",
  "domains": [
    {
      "domain_id": "default",
      "traffic_ratio": 0.9,
      "layers": [
        {
          "layer_id": "recommend",
          "salt": "rec_2024",
          "experiments": [
            {
              "exp_id": "exp_001",
              "name": "推荐算法V2",
              "buckets": [0, 4999],
              "variant": "A",
              "params": {"algo": "v2", "threshold": 0.8}
            },
            {
              "exp_id": "exp_002", 
              "name": "推荐算法V3",
              "buckets": [5000, 7999],
              "variant": "B",
              "params": {"algo": "v3", "threshold": 0.75}
            },
            {
              "exp_id": "",
              "name": "对照组",
              "buckets": [8000, 9999],
              "variant": "CTRL",
              "params": {}
            }
          ]
        }
      ]
    }
  ]
}
```

**② 分桶计算模块 (BucketEngine)**

| 功能 | 说明 | 性能指标 |
|------|------|---------|
| **哈希计算** | MurmurHash3(user_id + layer_id) | < 1ms |
| **桶号映射** | hash % 10000 | < 0.1ms |
| **实验匹配** | 根据桶号查找所属实验 | < 0.5ms |
| **参数下发** | 返回实验参数给业务层 | < 0.1ms |

分桶计算流程：
```
输入: user_id, layer_id
  │
  ▼
拼接: hash_input = user_id + "#" + layer_id + "#" + salt
  │
  ▼
哈希: hash = MurmurHash3_32(hash_input)
  │
  ▼
取模: bucket = hash % 10000
  │
  ▼
查表: 遍历该层实验配置，找到 bucket 所在区间
  │
  ▼
输出: {exp_id, variant, params}
```

**关键设计决策**：
- **纯本地计算**：所有分桶逻辑在客户端完成，不依赖网络，确保 < 5ms 延迟
- **用户粘性**：同一用户在同一层始终得到相同桶号，保证体验一致性
- **层间正交**：不同层使用不同 `layer_id` 作为哈希盐值，确保正交性
- **盐值机制**：每层配置包含独立 salt，支持动态调整而不影响历史分桶

**③ 埋点注入模块 (TrackInjector)**

| 功能 | 说明 | 实现方式 |
|------|------|---------|
| **自动注入** | 在埋点事件中自动附加实验标签 | 拦截SDK埋点发送方法 |
| **标签格式** | 标准化实验标识 | `exp_id:variant:layer_id` |
| **全量归因** | 确保所有事件都携带当前实验状态 | 在事件队列出口统一注入 |

注入示例：
```json
// 原始埋点事件
{
  "event": "page_view",
  "page_id": "home",
  "timestamp": 1714900000
}

// 注入实验标签后
{
  "event": "page_view", 
  "page_id": "home",
  "timestamp": 1714900000,
  "ab_tags": [
    {"exp_id": "exp_001", "variant": "A", "layer": "recommend"},
    {"exp_id": "exp_003", "variant": "CTRL", "layer": "ui"}
  ]
}
```

#### 2.4.3 三端SDK差异设计

| 维度 | iOS SDK | Android SDK | Web SDK |
|------|---------|-------------|---------|
| **开发语言** | Swift / Objective-C | Kotlin / Java | TypeScript / JavaScript |
| **配置缓存** | Keychain + UserDefaults | SharedPreferences + SQLite | localStorage + IndexedDB |
| **持久化安全** | Keychain加密存储 | EncryptedSharedPreferences | 无（依赖浏览器隔离） |
| **线程模型** | 主线程计算，后台同步 | 主线程计算，WorkManager同步 | 主线程计算，Web Worker同步 |
| **包体积** | < 80KB | < 100KB | < 30KB (gzip) |
| **初始化时机** | AppDelegate.didFinishLaunching | Application.onCreate | DOMContentLoaded |
| **用户ID来源** | IDFV / 自定义设备ID | Android ID / 自定义设备ID | Cookie / localStorage UID |
| **特殊处理** | App Extension共享配置 | 多进程配置同步 | 跨域配置同步 (postMessage) |

#### 2.4.4 配置同步机制

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   客户端SDK   │     │   配置中心    │     │    实验管理平台    │
│             │     │  (ConfigHub) │     │   (Web Console)  │
└──────┬──────┘     └──────┬──────┘     └────────┬────────┘
       │                   │                      │
       │ ① 启动拉取        │                      │
       │ GET /config?version=xxx                 │
       │─────────────────▶│                      │
       │                   │                      │
       │ ② 返回增量配置    │                      │
       │◀─────────────────│                      │
       │                   │                      │
       │ ③ 本地合并        │                      │
       │ (全量替换/增量patch)                      │
       │                   │                      │
       │ ④ 长轮询/心跳     │                      │
       │ WebSocket/SSE     │                      │
       │─────────────────▶│                      │
       │                   │                      │
       │ ⑤ 配置变更推送    │◀─────────────────────│
       │◀─────────────────│ (管理员发布实验)       │
       │                   │                      │
       │ ⑥ 实时生效        │                      │
       │ (内存热更新，无重启)                     │
```

**同步策略**：

| 场景 | 策略 | 延迟 |
|------|------|------|
| App冷启动 | 读取本地缓存 → 异步拉取最新配置 | 立即生效(缓存) / < 3s(更新) |
| 配置中心发布 | WebSocket推送 → SDK增量更新 | < 3min 全局生效 |
| 网络异常 | 使用本地缓存，指数退避重试 | 缓存7天有效 |
| 紧急回滚 | 特殊标记强制刷新，绕过缓存 | < 30s |

#### 2.4.5 性能与稳定性保障

| 指标 | 目标 | 保障措施 |
|------|------|---------|
| **分桶延迟** | P99 < 5ms | 纯本地计算，无网络IO |
| **初始化耗时** | < 50ms | 异步加载配置，懒初始化分桶 |
| **内存占用** | < 5MB | LRU缓存实验配置，定期清理 |
| **CPU占用** | 峰值 < 1% | MurmurHash3为轻量级哈希 |
| **可用性** | 99.99% | 多层降级：内存 → 磁盘 → 硬编码 |
| **崩溃率** | < 0.001% | 配置解析异常捕获，空值保护 |

**降级策略**：
```
L1: 内存缓存命中 → 直接返回 (0ms)
L2: 磁盘缓存读取 → 解析返回 (< 10ms)  
L3: 硬编码默认配置 → 所有用户进对照组 (< 1ms)
L4: 完全异常 → 关闭实验功能，业务走默认逻辑
```

#### 2.4.6 核心接口设计

**设计原则**：接口极简，业务方零成本接入；所有计算纯本地完成，无网络IO。

---

**① 单实验查询接口**

```java
// Java (Android)
// 获取用户在某个实验中的分组
String variant = ABClient.getVariant(String userId, String experimentKey);

// 返回值说明：
// "control"      -> 命中对照组
// "treatment_a"  -> 命中实验组A
// "treatment_b"  -> 命中实验组B
// null           -> 未命中（不在实验流量范围内）
```

```swift
// Swift (iOS)
let variant = ABClient.getVariant(userId: "user_123", experimentKey: "exp_recommend_v2")

// 返回值：Optional<String>
// .some("treatment_a")  -> 命中实验组A
// .some("control")       -> 命中对照组
// .none                 -> 未命中
```

```typescript
// TypeScript (Web)
const variant = ABClient.getVariant("user_123", "exp_button_color");

// 返回值：string | null
// "treatment_a" | "treatment_b" | "control" | null
```

**使用示例**：
```java
// 业务方根据分组执行不同逻辑
String variant = ABClient.getVariant(userId, "exp_recommend_v2");

if ("treatment_a".equals(variant)) {
    // 实验组A逻辑：使用新推荐算法
    showNewRecommendAlgorithm();
} else if ("treatment_b".equals(variant)) {
    // 实验组B逻辑：使用备选推荐算法
    showAlternativeAlgorithm();
} else if ("control".equals(variant)) {
    // 对照组逻辑：保持原有推荐算法
    showDefaultAlgorithm();
} else {
    // null -> 未命中实验，走默认逻辑（与control一致）
    showDefaultAlgorithm();
}
```

---

**② 批量查询接口**

```java
// 批量获取用户当前命中的所有实验分组
Map<String, String> assignments = ABClient.getAllVariants(String userId);

// 返回值示例：
// {
//     "exp_recommend_v2": "treatment_a",
//     "exp_button_color": "control",
//     "exp_price_strategy": null,
//     "exp_ui_layout": "treatment_b"
// }
```

```swift
// Swift
let assignments = ABClient.getAllVariants(userId: "user_123")

// 返回值：[String: String?]
// [
//     "exp_recommend_v2": "treatment_a",
//     "exp_button_color": "control",
//     "exp_price_strategy": nil,
//     "exp_ui_layout": "treatment_b"
// ]
```

```typescript
// Web
const assignments = ABClient.getAllVariants("user_123");

// 返回值：Record<string, string | null>
// {
//     "exp_recommend_v2": "treatment_a",
//     "exp_button_color": "control",
//     "exp_price_strategy": null,
//     "exp_ui_layout": "treatment_b"
// }
```

**使用场景**：
- **埋点上报前**：获取全部实验标签，一次性注入到埋点事件中
- **实验看板**：展示用户当前命中的所有实验
- **冲突检测**：检查用户是否同时命中互斥实验（异常情况告警）

---

**③ 实验参数获取接口**

```java
// 获取实验分组对应的业务参数（支持类型安全）
<T> T ABClient.getParam(String userId, String experimentKey, String paramKey, T defaultValue);

// 使用示例：
boolean enableNewFeature = ABClient.getParam(
    "user_123", 
    "exp_recommend_v2", 
    "enable_new_feature", 
    false  // 默认值
);

int threshold = ABClient.getParam(
    "user_123",
    "exp_recommend_v2",
    "threshold",
    80  // 默认值
);
```

---

**④ 埋点标签获取接口**

```java
// 获取当前用户命中的所有实验标签（用于埋点自动注入）
List<ExperimentTag> ABClient.getExperimentTags(String userId);

// 返回值示例：
// [
//     ExperimentTag{expId="exp_recommend_v2", variant="treatment_a", layer="recommend"},
//     ExperimentTag{expId="exp_button_color", variant="control", layer="ui"}
// ]
```

---

#### 2.4.7 SDK内部执行逻辑

**核心流程：纯本地计算，无网络IO**

```
输入: userId, experimentKey
  │
  ▼
┌─────────────────────────────────────────┐
│  Step 1: 读取本地缓存的实验配置            │
│  • 内存缓存 (LRU, 热数据)                │
│  • 磁盘缓存 (SQLite/Keychain, 冷启动)    │
│  • 兜底配置 (硬编码, 极端异常)           │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│  Step 2: 查找目标实验配置                  │
│  • 根据 experimentKey 匹配实验配置        │
│  • 检查实验状态: 运行中? 暂停? 已结束?    │
│  • 状态异常 → 返回 null                  │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│  Step 3: 判断用户是否在实验流量范围内       │
│  • 获取实验流量区间 [start_bucket, end_bucket]
│  • 计算用户桶号: MurmurHash3(userId + layerId + salt) % 10000
│  • 判断: start_bucket ≤ bucket ≤ end_bucket?
│  • 不在范围内 → 返回 null                │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│  Step 4: 确定用户分组                     │
│  • 根据桶号映射到具体分组                  │
│  • 例: bucket 0-4999 → "treatment_a"      │
│  •     bucket 5000-9999 → "control"       │
└─────────────────────────────────────────┘
  │
  ▼
输出: "control" / "treatment_a" / "treatment_b" / null
```

**批量查询内部优化**：

```java
// getAllVariants 内部实现优化
public Map<String, String> getAllVariants(String userId) {
    Map<String, String> result = new HashMap<>();

    // 1. 一次性读取全部本地配置（单次IO）
    List<ExperimentConfig> allExperiments = configManager.getAllActiveExperiments();

    // 2. 预计算用户在各层的桶号（避免重复哈希）
    // 同一层多个实验共享桶号，只需计算一次哈希
    Map<String, Integer> layerBucketCache = new HashMap<>();

    for (ExperimentConfig exp : allExperiments) {
        String layerId = exp.getLayerId();

        // 复用已计算的桶号
        int bucket = layerBucketCache.computeIfAbsent(layerId, 
            lid -> murmurHash3(userId + lid + exp.getSalt()) % 10000
        );

        // 判断是否在流量范围内并映射分组
        String variant = exp.getVariantByBucket(bucket);
        result.put(exp.getExperimentKey(), variant);  // variant可能为null
    }

    return result;
}
```

**性能关键点**：

| 优化点 | 说明 | 效果 |
|--------|------|------|
| **配置本地缓存** | 实验配置存储在本地，不依赖网络 | 消除网络延迟 |
| **桶号预计算** | 同层实验共享桶号，哈希只算一次 | 减少重复计算 |
| **LRU内存缓存** | 热点实验配置常驻内存 | 避免磁盘IO |
| **懒加载初始化** | 首次调用时才加载配置 | 不影响App启动速度 |
| **批量接口优化** | 单次遍历所有实验，而非多次调用 | 减少循环开销 |

---

**⑤ Web SDK 特殊接口**

```typescript
// React Hook（声明式接入）
function useExperiment(experimentKey: string): {
    variant: string | null;
    isLoading: boolean;
    isReady: boolean;
} {
    const [variant, setVariant] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 等待SDK初始化完成
        ABClient.onReady(() => {
            const userId = getCurrentUserId();
            const v = ABClient.getVariant(userId, experimentKey);
            setVariant(v);
            setIsReady(true);
        });
    }, [experimentKey]);

    return { variant, isLoading: !isReady, isReady };
}

// 使用示例
function RecommendComponent() {
    const { variant, isReady } = useExperiment("exp_recommend_v2");

    if (!isReady) return <Skeleton />;
    if (variant === "treatment_a") return <NewRecommend />;
    return <DefaultRecommend />;
}
```

---

**⑥ 完整接口汇总表**

| 接口 | 参数 | 返回值 | 用途 | 计算位置 |
|------|------|--------|------|---------|
| `getVariant` | userId, experimentKey | `control`/`treatment`/`null` | 单实验分组查询 | 纯本地 |
| `getAllVariants` | userId | `Map<key, variant>` | 批量查询所有实验 | 纯本地 |
| `getParam` | userId, expKey, paramKey, default | 业务参数值 | 获取实验参数 | 纯本地 |
| `getExperimentTags` | userId | `List<ExperimentTag>` | 埋点自动注入 | 纯本地 |
| `initialize` | SDKConfig | void | SDK初始化 | 异步网络 |
| `forceRefresh` | — | Promise | 强制刷新配置 | 同步网络 |
| `onReady` | callback | — | 监听初始化完成 | — |
| `onConfigUpdate` | callback | — | 监听配置变更 | — |

#### 2.4.7 安全与防篡改

| 风险 | 防护措施 |
|------|---------|
| **配置篡改** | 配置签名验证 (RSA-SHA256)，拒绝非法配置 |
| **用户伪造** | user_id由服务端生成并加密，客户端不可修改 |
| **桶号预测** | MurmurHash3为不可逆哈希，无法从桶号反推用户 |
| **实验泄露** | 实验参数加密传输，仅下发当前用户所需参数 |
| **刷量攻击** | 同一设备ID频繁切换实验版本，触发风控标记 |


### 3.1 架构设计

采用 **Lambda架构**，同时支持实时流和离线批处理：

```
实时流链路:
客户端/服务端 SDK ──▶ 日志接收网关(Nginx/Go) ──▶ Kafka ──▶ Flink(分钟级聚合) ──▶ ClickHouse(实时指标表)
                                                                                          │
离线流链路:                                                                              │
客户端/服务端 SDK ──▶ Kafka ──▶ Spark(T+1全量计算) ──▶ ClickHouse(离线指标表) ◀──────────┘
```

### 3.2 实时流 (Real-time)

| 组件 | 技术选型 | 作用 |
|------|---------|------|
| 日志接收网关 | Nginx / Go | 高并发日志接入，流量削峰 |
| 消息队列 | Kafka | 事件流缓冲，解耦生产消费 |
| 实时计算 | Flink | 分钟级窗口聚合，实时指标计算 |
| 实时存储 | ClickHouse | 实时指标表，支持秒级查询 |

**延迟目标**: 端到端延迟 < 3分钟

### 3.3 离线流 (Batch)

| 组件 | 技术选型 | 作用 |
|------|---------|------|
| 消息队列 | Kafka | 原始事件持久化 |
| 离线计算 | Spark | T+1全量计算，精确去重校验 |
| 离线存储 | ClickHouse | 离线指标表，T+1深度分析 |

**处理内容**:
- 统一事件Schema标准化
- 全局去重、异常校验、时间校准
- 复杂指标计算（留存、LTV等）

### 3.4 数据质量保证

- **自动注入实验标签**: SDK自动在埋点中注入用户所在实验版本信息
- **统一事件Schema**: 标准化事件结构，确保跨端数据一致性
- **去重机制**: 基于唯一事件ID去重，防止重复计算
- **时间校准**: 客户端时间与服务端时间对齐，处理时钟偏移
- **异常检测**: 自动识别并过滤异常流量和脏数据

---

## 四、数据存储层 (Data Storage)

### 4.1 存储架构

| 存储类型 | 技术选型 | 用途 | 性能特征 |
|---------|---------|------|---------|
| 关系型数据库 | MySQL | 实验配置库 | 事务支持，配置持久化 |
| 消息队列 | Kafka | 事件消息队列 | 高吞吐，事件流缓冲 |
| OLAP数据库 | ClickHouse | 指标分析表 | 列式存储，秒级聚合查询 |
| 缓存 | Redis | 配置缓存 | < 3min延迟，高频读取 |

### 4.2 数据模型

**实验配置表 (MySQL)**:
```sql
CREATE TABLE experiment_config (
    id BIGINT PRIMARY KEY,
    name VARCHAR(128),
    status ENUM('draft','running','paused','finished'),
    domain_id INT,
    layer_id INT,
    buckets VARCHAR(256),      -- 占用的桶范围
    traffic_ratio DECIMAL(4,4), -- 流量比例
    variants JSON,             -- 实验版本配置
    metrics JSON,              -- 关联指标
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**实时指标表 (ClickHouse)**:
```sql
CREATE TABLE realtime_metrics (
    event_date Date,
    experiment_id BIGINT,
    variant_id VARCHAR(32),
    user_id BIGINT,
    metric_name VARCHAR(64),
    metric_value Float64,
    timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (event_date, experiment_id, variant_id, metric_name);
```

---

## 五、统计分析引擎 (Stats Engine)

### 5.1 统计检验流程

```
STEP 01: SRM检验 ──▶ STEP 02: 主指标检验 ──▶ STEP 03: 辅助指标校正 ──▶ STEP 04: 护栏指标检查
              │                    │                      │                      │
              ▼                    ▼                      ▼                      ▼
        验证分流比例          CUPED方差缩减           BH-FDR控制            mSPRT序贯检验
        (卡方检验)            (Welch t/z检验)         (多重比较校正)         (持续监测)
```

### 5.2 Step 01: SRM 检验 (Sample Ratio Mismatch)

**目的**: 验证实际分流比例是否符合预期配置，检测分流系统是否存在bug

**方法**: 卡方检验 (Chi-square test)

```
H0: 实际分流比例 = 预期分流比例
H1: 实际分流比例 ≠ 预期分流比例

如果 p < 0.01，拒绝H0，触发SRM告警，实验数据不可信
```

**应用场景**:
- 实验启动后自动执行
- 运行期间定期校验
- 发现SRM立即暂停实验，排查分流逻辑

### 5.3 Step 02: 主指标检验 (Primary Metric Testing)

**核心方法**: Welch's t-test / z-test

**CUPED 方差缩减技术**:

> **CUPED** (Controlled-experiment Using Pre-Experiment Data) 利用实验前的协变量（如用户历史GMV）来降低指标方差，从而缩短实验周期20%-50%。

```python
# CUPED 核心公式
Y_CUPED = Y - θ * (X - E[X])

# 其中:
# Y: 实验期间的观测指标
# X: 实验前的协变量（如历史同期指标）
# θ: 最优系数 = Cov(X,Y) / Var(X)
# E[X]: 协变量的期望值

# 方差缩减效果:
# Var(Y_CUPED) = Var(Y) * (1 - ρ²)
# ρ: X与Y的相关系数，通常 ρ ∈ [0.5, 0.9]
```

**输出**: 
- **Lift**: 实验组相对对照组的提升幅度
- **p值**: 统计显著性 (通常以 p < 0.05 为显著)
- **置信区间 (CI)**: 95%置信区间，评估效应量稳定性

### 5.4 Step 03: 辅助指标校正 (Secondary Metrics Correction)

**问题**: 同时检验多个指标时，族错误率(FWER)会膨胀

**解决方案**: Benjamini-Hochberg FDR控制

```
1. 对所有辅助指标的p值进行排序: p(1) ≤ p(2) ≤ ... ≤ p(m)
2. 找到最大的k，使得 p(k) ≤ (k/m) * α
3. 拒绝所有 i ≤ k 的假设

其中 α = 0.05 (期望FDR水平)
```

**特点**: 控制**假发现率(FDR)**而非**族错误率(FWER)**，在探索性分析中更具统计功效

### 5.5 Step 04: 护栏指标检查 (Guardrail Metrics)

**目的**: 保护核心用户体验，防止实验引入负面效应

**指标类型**:
- 性能类: 页面加载P90延迟、API响应时间
- 稳定性类: 崩溃率、错误率
- 业务类: 核心流程转化率（不可恶化）

**检验方法**:
- **单侧检验**: 仅检测是否显著恶化（不检测改善，避免过度敏感）
- **mSPRT 序贯检验**: 支持实验运行期间持续监测，无需预设样本量

**mSPRT (mixture Sequential Probability Ratio Test)**:

```
优势:
1. 支持早停决策: 当护栏指标显著恶化时，立即停止实验
2. 控制整体假阳性率: 在多次观察中保持Type I错误率
3. 无需预设样本量: 动态确定实验所需样本量

停止规则:
- 如果检验统计量超过上界阈值 → 触发恶化告警，停止实验
- 如果检验统计量低于下界阈值 → 确认安全，继续运行
```

### 5.6 实验报告输出

| 输出项 | 说明 | 用途 |
|-------|------|------|
| **Lift** | 相对提升幅度 | 量化实验效果 |
| **CI (置信区间)** | 95%置信区间 | 评估结果稳定性 |
| **p值** | 统计显著性 | 判断结果是否可信 |
| **时间趋势** | 按天/小时的效果曲线 | 观察效果持续性 |
| **人群拆分** | 按用户属性的细分分析 | 识别异质性效应 |

---

## 六、指标体系 (Metrics Framework)


### 5.7 完整计算示例：如何判断差异是否真实

> **场景**: 你跑了一个实验，对照组点击率5.0%，实验组点击率5.3%。看起来实验组好了0.3个百分点。但这个0.3%到底是你的改动带来的真实提升，还是仅仅因为随机波动？

#### 第一步：建立假设

统计检验的框架是这样的——你先假设"实验没有效果"（这叫**零假设 H₀**），然后用数据去尝试推翻这个假设。

- **H₀（零假设）**：实验组和对照组的真实指标没有差异，观察到的差距只是随机波动
- **H₁（备择假设）**：两组之间存在真实差异

#### 第二步：计算检验统计量

对于最常见的"两组均值比较"场景，用的是**双样本t检验**（或在大样本下近似为**z检验**）。计算过程的核心逻辑是：

> **观察到的差异有多大？ / 这个差异的随机波动有多大？ = 信噪比**

**具体公式：**

```
t = (X_treatment - X_control) / SE

其中 SE（标准误）= √(S²_treatment/N_treatment + S²_control/N_control)
```

**代入具体数字：**

| 参数 | 对照组 | 实验组 |
|------|--------|--------|
| 样本量 N | 10,000 | 10,000 |
| 点击率 p | 5.0% | 5.3% |
| 方差 S² = p(1-p) | 0.0475 | 0.0502 |

计算过程：

```
SE = √(0.0502/10000 + 0.0475/10000)
   = √(0.00000502 + 0.00000475)
   = √0.00000977
   = 0.00313

t = (0.053 - 0.050) / 0.00313
  = 0.003 / 0.00313
  ≈ 0.96
```

**直观理解**：分子是"你观察到的效果大小"，分母是"这个效果大小的不确定性"。**t值越大，说明信号相对于噪音越强，差异越可信。**

#### 第三步：得到p值，做出判断

t值算出来之后，对照t分布（或正态分布），可以算出**p值**。p值的含义是：

> **"如果实验真的没有效果（H₀为真），我观察到当前这么大（甚至更大）差异的概率是多少？"**

如果p值很小（通常阈值设为0.05），说明"在没有效果的前提下，出现这种差异的概率太低了，不太合理"，于是我们**拒绝零假设**，认为实验有效果。

**本例计算：**

```
t ≈ 0.96
p值 ≈ 0.34  (双尾检验)
```

**结论：**

| 指标 | 数值 | 判断 |
|------|------|------|
| 观察差异 | 0.3% | — |
| t值 | 0.96 | 信噪比 < 1，信号弱于噪音 |
| p值 | 0.34 | 远大于 0.05 |
| 统计结论 | **不显著** | 不能拒绝H₀ |

> **最终结论：这0.3%的差异不显著，可能只是随机波动。你不能据此说实验有效。**

#### 为什么0.3%不显著？——样本量与功效分析

这个例子揭示了一个关键认知：**小差异需要大样本才能检测**。

| 分析维度 | 数值 | 解读 |
|---------|------|------|
| 效应量 (Cohen's h) | 0.014 | 极小效应 |
| 当前统计功效 | ~16% | 极低，大概率犯Type II错误 |
| 所需样本量 (80%功效) | 每组85,196人 | 是当前8.5倍 |
| 信噪比 | 0.96 | 信号 ≈ 噪音，无法区分 |

**实践启示**：
1. **不要凭肉眼判断**：0.3%的差异在10,000人样本下完全可能是随机波动
2. **实验前算功效**：开实验前用样本量计算器，确保有足够流量检测预期效应
3. **关注置信区间**：即使p < 0.05，也要看95% CI是否包含0，以及CI宽度是否可接受
4. **业务显著 ≠ 统计显著**：0.3%的提升即使真实存在，是否值得上线还需ROI评估


### 6.1 四层指标分类

```
┌─────────────────────────────────────────────────────────────┐
│  NORTH STAR 北极星指标                                       │
│  • 人均GMV  • 人均时长                                        │
│  【所有实验默认观察，反映产品核心健康度】                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY 实验主指标                                          │
│  • 每个实验仅定义一个核心指标                                  │
│  • 用于实验最终决策 (如: 购买转化率)                            │
│  【实验成功/失败的唯一评判标准】                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SECONDARY 辅助指标                                          │
│  • 加购率  • 浏览深度                                         │
│  【需BH多重校正，用于理解实验影响机制】                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GUARDRAIL 护栏指标                                          │
│  • 加载P90  • 崩溃率                                          │
│  【单侧检验，不可恶化，保护用户体验底线】                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 指标设计原则

1. **唯一主指标**: 每个实验必须有且仅有一个主指标，避免多重比较问题
2. **护栏先行**: 实验启动前必须定义护栏指标，确保用户安全
3. **可计算性**: 所有指标必须能够通过现有数据链路计算
4. **敏感性**: 指标应对实验变动足够敏感，避免统计功效不足

---

## 七、实验生命周期管理


### 6.3 核心指标计算口径

> **原则**: 所有指标计算必须基于**实验组/对照组的用户粒度**进行聚合，确保统计检验的独立性。

#### 6.3.1 点击率 (CTR)

| 项目 | 定义 |
|------|------|
| **分子** | 点击目标元素的用户数（去重） |
| **分母** | 曝光目标元素的用户数（去重） |
| **公式** | `CTR = 点击用户数 / 曝光用户数 × 100%` |
| **去重维度** | 用户ID（user_id） |
| **时间窗口** | 实验运行期间 |
| **注意事项** | ① 同一用户多次点击只算1次；② 曝光必须发生在实验生效后；③ 排除机器人流量 |

**计算示例**：
```sql
-- 实验组点击率计算
SELECT 
    COUNT(DISTINCT CASE WHEN event_name = 'click' THEN user_id END) 
        / COUNT(DISTINCT CASE WHEN event_name = 'expose' THEN user_id END) AS ctr
FROM event_log
WHERE experiment_id = 'exp_001' 
  AND variant = 'A'
  AND event_name IN ('click', 'expose')
  AND timestamp BETWEEN experiment_start AND experiment_end;
```

#### 6.3.2 转化率 (CVR / Conversion Rate)

| 项目 | 定义 |
|------|------|
| **分子** | 完成目标行为的用户数（去重） |
| **分母** | 进入转化漏斗的用户数（去重） |
| **公式** | `CVR = 转化用户数 / 漏斗入口用户数 × 100%` |
| **常见场景** | 购买转化率、注册转化率、下单转化率 |
| **去重维度** | 用户ID |
| **时间窗口** | 实验运行期间（或实验期间首次进入漏斗后N天） |

**分层转化率**：
| 层级 | 定义 | 示例 |
|------|------|------|
| **曝光→点击** | 点击UV / 曝光UV | 商品曝光→商品点击 |
| **点击→详情** | 详情页UV / 点击UV | 商品点击→详情页 |
| **详情→下单** | 下单UV / 详情页UV | 详情页→提交订单 |
| **下单→支付** | 支付UV / 下单UV | 提交订单→完成支付 |

**计算示例**（购买转化率）：
```sql
-- 购买转化率 = 支付成功UV / 商品曝光UV
SELECT 
    COUNT(DISTINCT CASE WHEN event_name = 'pay_success' THEN user_id END) 
        / COUNT(DISTINCT CASE WHEN event_name = 'item_expose' THEN user_id END) AS cvr
FROM event_log
WHERE experiment_id = 'exp_001' 
  AND variant = 'A'
  AND event_name IN ('item_expose', 'pay_success');
```

#### 6.3.3 人均点击次数 (Click Per User / CPU)

| 项目 | 定义 |
|------|------|
| **分子** | 总点击次数（不去重） |
| **分母** | 点击过的用户数（去重） |
| **公式** | `人均点击次数 = 总点击次数 / 点击用户数` |
| **与CTR区别** | CTR衡量"有多少人点击"，CPU衡量"每个人点多少次" |
| **应用场景** | 评估内容吸引力深度 |

**计算示例**：
```sql
SELECT 
    COUNT(CASE WHEN event_name = 'click' THEN 1 END) 
        / COUNT(DISTINCT CASE WHEN event_name = 'click' THEN user_id END) AS cpu
FROM event_log
WHERE experiment_id = 'exp_001' AND variant = 'A';
```

#### 6.3.4 人均GMV (GMV Per User)

| 项目 | 定义 |
|------|------|
| **分子** | 实验组用户产生的总GMV（实际支付金额，含退款需扣除） |
| **分母** | 实验组总用户数（去重） |
| **公式** | `人均GMV = 总GMV / 实验组用户数` |
| **GMV口径** | ① 实付金额（扣除优惠券、红包）；② 退款订单在退款发生日扣除；③ 仅统计实验期间下单 |
| **去重维度** | 分母为实验组全部曝光/访问用户（不仅限购买用户） |

**计算示例**：
```sql
SELECT 
    SUM(CASE WHEN order_status = 'paid' THEN actual_pay_amount 
             WHEN order_status = 'refunded' THEN -refund_amount END) 
        / COUNT(DISTINCT user_id) AS gmv_per_user
FROM (
    -- 关联实验用户与订单
    SELECT e.user_id, o.order_id, o.actual_pay_amount, o.order_status, o.refund_amount
    FROM experiment_users e
    LEFT JOIN orders o ON e.user_id = o.user_id 
        AND o.order_time BETWEEN e.enter_experiment_time AND experiment_end
    WHERE e.experiment_id = 'exp_001' AND e.variant = 'A'
) t;
```

**关键注意**：
- **分母是全部实验用户**，不是仅购买用户（否则分母缩小会虚高人均）
- **退款处理**：退款发生时在当日扣除，不追溯历史
- **跨天订单**：以实验期间首次进入实验为锚点，追踪后续N天（通常7天或14天）

#### 6.3.5 页面停留时长 (Page Dwell Time)

| 项目 | 定义 |
|------|------|
| **单页时长** | `页面离开时间 - 页面进入时间` |
| **人均停留时长** | `总停留时长 / 访问用户数` |
| **中位数停留时长** | 所有用户停留时长的中位数（推荐，抗异常值） |
| **P90停留时长** | 90%用户的停留时长 ≤ 该值（用于护栏指标） |
| **计算方式** | ① 页面切换事件计算；② 心跳包（每5s上报）累加 |

**心跳包计算法**（推荐）：
```
用户进入页面 → 启动心跳定时器（每5秒上报一次）
用户离开页面 → 发送leave事件，停止心跳

总停留时长 = 最后心跳时间 - 首次进入时间 + 5s
           或 = 心跳次数 × 5s
```

**计算示例**：
```sql
-- 人均停留时长（心跳包法）
SELECT 
    AVG(dwell_time) AS avg_dwell_time,
    approx_quantile(dwell_time, 0.5) AS median_dwell_time,
    approx_quantile(dwell_time, 0.9) AS p90_dwell_time
FROM (
    SELECT 
        user_id,
        COUNT(*) * 5 AS dwell_time  -- 心跳间隔5s
    FROM heartbeat_log
    WHERE page_id = 'home'
      AND experiment_id = 'exp_001'
      AND variant = 'A'
    GROUP BY user_id
) t;
```

**异常处理**：
- 后台切换：App进入后台超过30s，停止计时，回来后重新计时
- 页面崩溃：取最后心跳时间作为离开时间
- 单页停留上限：超过30分钟强制截断（防后台挂机）

#### 6.3.6 次日留存率 (Day 1 Retention)

| 项目 | 定义 |
|------|------|
| **分子** | 实验当天活跃且次日仍活跃的用户数 |
| **分母** | 实验当天活跃的用户数 |
| **公式** | `次日留存率 = 次日活跃用户数 / 当日活跃用户数 × 100%` |
| **活跃定义** | 产生任意埋点事件（或自定义核心事件，如页面访问） |
| **时间对齐** | 以用户**首次进入实验当天**为D0，次日为D1 |

**计算示例**：
```sql
-- 次日留存率
WITH d0_users AS (
    -- D0: 实验当天首次进入实验的用户
    SELECT DISTINCT user_id, DATE(enter_time) AS d0_date
    FROM experiment_enter_log
    WHERE experiment_id = 'exp_001' AND variant = 'A'
),
d1_active AS (
    -- D1: 次日活跃的用户
    SELECT DISTINCT user_id, DATE(event_time) AS active_date
    FROM event_log
    WHERE event_time BETWEEN d0_date + INTERVAL 1 DAY AND d0_date + INTERVAL 2 DAY
)
SELECT 
    COUNT(DISTINCT d1.user_id) / COUNT(DISTINCT d0.user_id) AS d1_retention
FROM d0_users d0
LEFT JOIN d1_active d1 ON d0.user_id = d1.user_id 
    AND d1.active_date = d0.d0_date + INTERVAL 1 DAY;
```

**留存体系扩展**：
| 指标 | 定义 | 用途 |
|------|------|------|
| **次日留存 (D1)** | D0进入且D1活跃 | 短期粘性评估 |
| **7日留存 (D7)** | D0进入且D7活跃 | 一周粘性评估 |
| **30日留存 (D30)** | D0进入且D30活跃 | 月度粘性评估 |
| **流失率** | 1 - 留存率 | 负面指标监控 |

**关键注意**：
- **锚点统一**: 必须以"首次进入实验"为D0，而非自然日，否则实验组和对照组的D0定义不一致
- **跨实验干扰**: 用户同时参与多个实验时，留存归因到哪个实验需预先约定（通常归因到首次进入的实验）
- **新用户vs全量**: 新用户留存率通常远低于全量用户，实验设计时需明确是新用户实验还是全量用户实验

---

### 6.4 指标计算通用规范

#### 6.4.1 用户去重规则

| 场景 | 去重方式 | 说明 |
|------|---------|------|
| **分母去重** | 实验期间该用户只要出现过1次即计入 | 防止分母波动 |
| **分子去重** | 实验期间该用户只要完成过1次目标行为即计入 | 如转化率 |
| **不去重指标** | 总次数 / 去重用户数 | 如人均点击次数 |
| **跨天去重** | 按自然日或实验日分别去重 | 留存类指标 |

#### 6.4.2 实验用户集合定义

```sql
-- 标准实验用户集合（所有指标计算的基础）
SELECT DISTINCT user_id
FROM experiment_exposure_log  -- 用户进入实验的记录
WHERE experiment_id = 'exp_001'
  AND variant IN ('A', 'B', 'CTRL')  -- 仅统计实际被分桶的用户
  AND timestamp BETWEEN experiment_start AND experiment_end;
```

**关键规则**：
1. **只统计被正确分桶的用户**：SRM检验失败时，需排除异常流量
2. **排除内部用户**：员工账号、测试账号、白名单用户不计入
3. **排除机器人**：基于设备指纹、行为模式识别过滤
4. **最小曝光阈值**：用户必须在实验组曝光至少1次才计入（防止分桶后未触达）

#### 6.4.3 指标对齐检查清单

在实验报告输出前，必须验证：

- [ ] **分母一致**: 实验组和对照组的分母计算逻辑完全相同
- [ ] **时间窗口一致**: 两组使用相同的起始/结束时间
- [ ] **去重维度一致**: 两组使用相同的用户ID去重
- [ ] **事件定义一致**: 如"点击"的定义在两端完全一致
- [ ] **过滤条件一致**: 机器人排除、内部用户排除等规则相同
- [ ] **归因窗口一致**: 如GMV追踪7天，两组都用7天窗口


### 7.1 生命周期状态机

```
[草稿 DRAFT] ──▶ [审批 REVIEW] ──▶ [灰度 RAMP 1%-10%] ──▶ [运行中 RUNNING] 
                                                                    │
                                                                    ▼
[归档 ARCHIVE] ◀── [决策 DECISION] ◀── [分析 ANALYZING] ◀───────────┘
        │
        └── 全量发布 / 迭代优化 / 回滚下线
```

### 7.2 各阶段说明

| 阶段 | 状态 | 操作 | 权限 |
|------|------|------|------|
| **草稿** | DRAFT | 实验设计、指标配置、流量划分 | 实验Owner |
| **审批** | REVIEW | 方案评审、风险评估、统计功效校验 | 管理员/统计师 |
| **灰度** | RAMP | 1%-10%小流量验证，观察护栏指标 | 实验Owner |
| **运行中** | RUNNING | 全量运行，持续监控 | 系统自动 |
| **分析** | ANALYZING | 数据统计、效果评估、报告生成 | 分析师 |
| **决策** | DECISION | 全量发布 / 迭代优化 / 回滚下线 | 管理层 |
| **归档** | ARCHIVE | 数据保留、经验沉淀、知识库更新 | 系统自动 |

### 7.3 灰度发布机制

```
灰度阶段流量控制:
├─ 1% 流量: 验证分流正确性、SDK稳定性
├─ 5% 流量: 观察护栏指标、检测明显异常
└─ 10% 流量: 初步评估主指标趋势

准入条件:
1. SRM检验通过 (p > 0.01)
2. 护栏指标无恶化告警
3. 样本量达到最小统计功效要求
```

---

## 八、架构规格与性能指标

### 8.1 核心KPI

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **DAU支持** | 1,000,000 | 日活跃用户 |
| **并行实验** | 50+ | 同时运行实验数 |
| **分桶延迟** | < 5ms | P99分桶计算时间 |
| **实时延迟** | < 3min | 端到端实时指标延迟 |
| **离线时效** | T+1 | 离线精确分析产出时间 |
| **分桶粒度** | 0.1% | 最小流量划分单位 |

### 8.2 技术栈总结

| 层级 | 技术组件 | 选型理由 |
|------|---------|---------|
| 分流计算 | MurmurHash3 | 高性能、低碰撞率、分布均匀 |
| 配置管理 | MySQL + Redis | 事务一致性 + 高频读取缓存 |
| 消息队列 | Kafka | 高吞吐、持久化、可回放 |
| 实时计算 | Flink | 精确一次处理、低延迟、窗口丰富 |
| 离线计算 | Spark | 批处理能力强、生态丰富 |
| OLAP分析 | ClickHouse | 列式存储、向量化执行、秒级查询 |
| 统计引擎 | Python/R | 成熟的统计检验库 (scipy, statsmodels) |

---

## 九、安全与合规

### 9.1 数据安全

- **数据脱敏**: 用户ID哈希化，PII字段加密存储
- **权限控制**: RBAC模型，实验数据按需授权
- **审计日志**: 所有配置变更、数据访问记录审计

### 9.2 实验伦理

- **用户知情**: 重大实验需在产品协议中说明
- **最小影响**: 灰度机制确保问题影响范围可控
- **回滚能力**: 配置中心秒级回滚，紧急情况下立即停止实验

---

## 十、演进规划

### 10.1 当前版本 (v1.0)
- 基础分流与数据采集
- 核心统计检验 (t-test, CUPED)
- 实验全生命周期管理

### 10.2 未来演进
- **智能分流**: 基于上下文的动态分流策略
- **多目标优化**: 多指标帕累托最优决策
- **自动分析**: AI辅助实验解读与建议
- **联邦实验**: 跨产品线的实验协同与流量共享

---

> **文档维护**: 本方案由数据科学团队与工程团队共同维护，建议每季度评审更新。
