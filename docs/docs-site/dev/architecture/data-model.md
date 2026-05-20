# 数据模型

本文档详细介绍 GateFlow 的数据库表结构设计。

## 实体关系图

```mermaid
erDiagram
    victor_domain ||--o{ victor_layer : contains
    victor_layer ||--o{ victor_experiment : contains
    victor_experiment ||--o{ victor_variant : contains
    victor_experiment ||--o{ victor_experiment_whitelist : has
    victor_experiment ||--o{ victor_config_version : tracked_by
```

## 核心表结构

### 1. victor_domain - 域配置表

流量分域，用于隔离不同业务线的实验流量。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| domain_id | VARCHAR(64) | 业务ID，用于API调用，唯一 |
| name | VARCHAR(128) | 域名称 |
| traffic_ratio | DECIMAL(5,4) | 流量占比，0-1之间 |
| is_exclusive | BOOLEAN | 是否独占域（独占域内实验互斥） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**Java 实体**: `com.gateflow.victor.domain.entity.Domain`

### 2. victor_layer - 层配置表

正交分层，确保不同层级的实验流量互不干扰。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| layer_id | VARCHAR(64) | 业务ID |
| domain_id | BIGINT | 引用 victor_domain.id |
| name | VARCHAR(128) | 层名称 |
| salt | VARCHAR(64) | 盐值，用于层间哈希正交 |
| sort_order | INT | 排序顺序 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**约束**: 唯一索引 `uk_layer_domain(layer_id, domain_id)`

**Java 实体**: `com.gateflow.victor.domain.entity.Layer`

### 3. victor_experiment - 实验配置表

核心实验表，记录实验的基本信息和配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| exp_id | VARCHAR(64) | 业务ID，唯一，用于API调用 |
| name | VARCHAR(128) | 实验名称 |
| description | TEXT | 实验描述 |
| layer_id | BIGINT | 引用 victor_layer.id |
| status | ENUM | 实验状态：draft, review, ramp, running, paused, analyzing, decision, archive |
| targeting_rules | JSON | 定向规则 |
| primary_metric | VARCHAR(64) | 主指标 |
| secondary_metrics | JSON | 次指标列表 |
| guardrail_metrics | JSON | 护栏指标列表 |
| start_time | TIMESTAMP | 开始时间 |
| end_time | TIMESTAMP | 结束时间 |
| created_by | VARCHAR(64) | 创建人 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引**:
- `idx_exp_id` - 实验业务ID
- `idx_status` - 实验状态
- `idx_layer` - 所属层级

**Java 实体**: `com.gateflow.victor.domain.entity.Experiment`

### 4. victor_variant - 变体配置表

实验变体表，记录实验的版本和流量分配。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| exp_id | BIGINT | 引用 victor_experiment.id |
| version | VARCHAR(32) | 版本号，时间戳格式如 20260506143000 |
| bucket_id | VARCHAR(64) | 分桶ID（如 control, treatment） |
| name | VARCHAR(128) | 版本名称 |
| bucket_start | INT | 桶起始位置（包含） |
| bucket_end | INT | 桶结束位置（包含） |
| params | VARCHAR(64) | 版本参数，支持任意字符串格式 |
| is_active | BOOLEAN | 是否为当前活跃版本 |
| created_at | TIMESTAMP | 创建时间 |

**约束**: 唯一索引 `uk_exp_version_variant(exp_id, version, bucket_id)`

**流量分配示例**:
```
control:     bucket_start=0,     bucket_end=4999   → 50%
treatment_a: bucket_start=5000,  bucket_end=7499   → 25%
treatment_b: bucket_start=7500,  bucket_end=9999   → 25%
```

**Java 实体**: `com.gateflow.victor.domain.entity.Variant`

### 5. victor_config_version - 配置版本表

配置变更追踪，支持SDK配置的ETag和增量更新。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| version | VARCHAR(32) | 版本号，唯一 |
| etag | VARCHAR(16) | 配置摘要（ETag） |
| config_json | LONGTEXT | 完整配置JSON快照 |
| change_type | ENUM | 变更类型：full, incremental |
| changed_experiments | JSON | 变更的实验ID列表 |
| created_at | TIMESTAMP | 创建时间 |

**Java 实体**: `com.gateflow.victor.domain.entity.ConfigVersion`

### 6. victor_experiment_whitelist - 实验白名单表

用于强制指定用户进入特定分桶，跳过常规hash分桶逻辑。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| exp_id | VARCHAR(64) | 实验业务ID |
| bucket_id | VARCHAR(64) | 分桶ID |
| user_ids | TEXT | 用户ID列表，逗号分隔 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引**:
- `idx_exp_id(exp_id)`
- `idx_exp_bucket(exp_id, bucket_id)`

**Java 实体**: `com.gateflow.victor.domain.entity.ExperimentWhitelist`

## 实验状态机

```mermaid
stateDiagram-v2
    [*] --> draft: 创建实验
    draft --> review: 提交审核
    review --> ramp: 审核通过
    review --> draft: 驳回修改
    ramp --> running: 逐步放量
    running --> paused: 暂停
    paused --> running: 恢复
    running --> analyzing: 手动结束
    running --> decision: 自动判定
    analyzing --> decision: 分析完成
    decision --> archive: 归档
    archive --> [*]
```

| 状态 | 说明 |
|------|------|
| draft | 草稿 |
| review | 审核中 |
| ramp | 逐步放量 |
| running | 运行中 |
| paused | 已暂停 |
| analyzing | 分析中 |
| decision | 决策中 |
| archive | 已归档 |

## 分桶算法

GateFlow 使用 MurmurHash3 进行用户分桶：

```
bucket = MurmurHash3(userId + "#" + layerId + "#" + salt) % 10000
```

- **输入**: 用户ID、层级ID、盐值
- **输出**: 0-9999 的整数（共10000个桶）
- **特点**: 确定性、均匀分布、跨平台一致

详见 [分桶引擎](./bucketing-engine.md)

## 索引设计说明

| 表名 | 索引类型 | 用途 |
|------|---------|------|
| victor_domain | uk_domain_id | 业务ID唯一查询 |
| victor_layer | uk_layer_domain | 域内层唯一性 |
| victor_layer | idx_layer_id | 层业务ID查询 |
| victor_experiment | idx_exp_id | 实验业务ID查询 |
| victor_experiment | idx_status | 状态筛选 |
| victor_experiment | idx_layer | 同层实验查询 |
| victor_variant | uk_exp_version_variant | 版本唯一性 |
| victor_variant | idx_exp_version | 实验版本查询 |
| victor_variant | idx_exp_active | 活跃变体查询 |
| victor_config_version | idx_version | 版本查询 |

## Flyway 迁移

数据库迁移文件位于 `victor-infrastructure/src/main/resources/db/migration/`:

| 版本 | 文件 | 说明 |
|------|------|------|
| V1 | init_schema.sql | 初始化核心表 |
| V2 | add_experiment_whitelist.sql | 新增白名单表 |

迁移自动执行于应用启动时。

## 表使用场景

### 创建实验

```mermaid
sequenceDiagram
    participant U as 用户
    participant API as ExperimentController
    participant S as ExperimentService
    participant LM as LayerMapper
    participant EM as ExperimentMapper
    participant VM as VariantMapper
    participant VMS as VariantVersionService
    participant DB as MySQL

    U->>API: 创建实验 (name, layerId, variants)
    API->>S: createExperiment()
    S->>LM: selectById(layerId) 验证层存在
    LM-->>S: Layer
    S->>S: 计算变体桶边界
    S->>S: validateVariantBucketRanges()
    S->>S: 生成 expId
    S->>EM: insert(experiment)
    EM-->>DB: INSERT victor_experiment
    S->>VMS: generateVersion()
    S->>VM: insert(variant) × N
    VM-->>DB: INSERT victor_variant
    S-->>API: Experiment
    API-->>U: 返回实验信息
```

### 启动实验

```mermaid
sequenceDiagram
    participant U as 用户
    participant API as ExperimentController
    participant S as ExperimentService
    participant EM as ExperimentMapper
    participant VM as VariantMapper
    participant LS as ExperimentLifecycleService
    participant DB as MySQL

    U->>API: 启动实验 (expId)
    API->>S: startExperiment()
    S->>EM: selectById(expId)
    EM-->>S: Experiment
    S->>VM: selectActiveVariants(expId)
    VM-->>S: Variants
    S->>S: 验证状态转换
    S->>EM: updateById(experiment)
    EM-->>DB: UPDATE victor_experiment<br/>status='running'
    S->>LS: logTransition()
    S-->>API: Experiment
    API-->>U: 实验已启动
```

### SDK 拉取配置

```mermaid
sequenceDiagram
    participant SDK as 客户端SDK
    participant API as ConfigController
    participant S as ConfigService
    participant EM as ExperimentMapper
    participant LM as LayerMapper
    participant VM as VariantMapper
    participant CV as ConfigVersionMapper
    participant Redis as Redis
    participant DB as MySQL

    SDK->>API: GET /config/version?version=xxx
    API->>S: getLatestVersion()
    S->>Redis: GET victor:config:latest
    alt 缓存命中
        Redis-->>S: version
    else 缓存未命中
        S->>CV: selectLatestVersion()
        CV-->>DB: SELECT victor_config_version
        DB-->>CV: ConfigVersion
        CV-->>S: version
        S->>Redis: SET victor:config:latest
    end
    S-->>API: VersionInfo
    alt 版本相同
        API-->>SDK: 304 Not Modified
    else 版本不同
        API-->>SDK: {version, timestamp}
        SDK->>API: GET /config/fetch?fromVersion=xxx
        API->>S: getIncrementalConfig(fromVersion)
        S->>CV: selectChangesAfterVersion()
        CV-->>DB: SELECT victor_config_version<br/>WHERE version > fromVersion
        S->>EM: selectRunningExperiments()
        EM-->>DB: SELECT victor_experiment<br/>WHERE status='running'
        S->>LM: selectById(layerId)
        S->>VM: selectByExpId(expId)
        S-->>API: ConfigResponse
        API-->>SDK: 配置JSON
    end
```

### 表使用频率汇总

| 操作 | victor_domain | victor_layer | victor_experiment | victor_variant | victor_config_version | victor_experiment_whitelist |
|------|:------------:|:------------:|:-----------------:|:--------------:|:---------------------:|:---------------------------:|
| 创建实验 | - | 验证 | 写入 | 写入 | - | - |
| 更新实验 | - | - | 更新 | 新版本写入 | - | - |
| 启动实验 | - | - | 更新状态 | - | - | - |
| 渐进放量 | - | - | 更新状态 | 更新桶边界 | - | - |
| 暂停/归档 | - | - | 更新状态 | - | - | - |
| SDK配置拉取 | - | 读取 | 读取 | 读取 | 读取(版本比对) | - |
| 白名单用户 | - | - | - | - | - | 读取 |

### victor_config_version 表说明

该表为增量更新预留，当前实现中尚未写入数据。设计意图：

1. **版本追踪**: 当实验配置变更时（如启动、停止、修改变体），自动记录一条 ConfigVersion
2. **增量拉取**: SDK 比对本地版本与服务器版本，只拉取变更部分
3. **配置快照**: `config_json` 字段存储完整配置，支持全量回溯

目前 SDK 采用全量拉取模式，待功能完善后可开启增量更新以降低网络开销。