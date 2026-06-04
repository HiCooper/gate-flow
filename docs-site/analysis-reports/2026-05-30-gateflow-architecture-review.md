# GateFlow A/B 实验系统（victor-ab）架构审查报告

> **审查日期**：2026-05-30
> **审查范围**：`backend/victor-ab/` 全部五个 Maven 模块
> **审查目标**：逻辑清晰，架构合理，不过度设计，代码规范

---

## 一、整体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块划分 | **C+** | victor-service 严重臃肿，承担了过多职责（业务+数据+管道+统计+分析+调度） |
| 代码规范 | **B** | 整体规范尚可，但存在多处不一致（命名、包结构）和反模式（Controller 直调 Mapper） |
| 数据库设计 | **B-** | 核心关系合理，但 Bucket 命名混淆（应为 Variant）、FK 引用不一致、白名单反范式存储 |
| API 设计 | **B** | RESTful 基本规范，但 18 个控制器过于分散，部分接口返回裸 Map 而非 DTO |
| 过度设计 | **C** | 统计算法大量自实现且重复、Kafka 管道过早引入、配置版本管理过于复杂 |
| 不足设计 | **C+** | 测试几乎空白（仅 5 个测试文件）、缺少限流/分布式锁/审计/多租户等关键能力 |

**总体结论**：系统核心领域模型（域-层-实验-分桶）设计正确。BucketEngine 纯 Java 无依赖实现是好的设计决策。生命周期状态机清晰，V2 迁移将实验状态从 12 个简化为 5 个体现了务实的重构意识。但 service 模块承载过多，统计算法大量自实现且重复，测试严重不足，生产化能力缺失较多。

---

## 二、模块划分审查

### 2.1 现状

| 模块 | 文件数 | 职责 |
|------|--------|------|
| victor-common | 13 | 工具、枚举、异常、BucketEngine |
| victor-domain | 25 | 实体、DTO（17+）、事件模型 |
| victor-service | ~70 | **业务逻辑 + 数据访问 + Kafka管道 + 统计算法 + 分析服务 + 调度作业 + 基础设施配置** |
| victor-sdk | 6 | Java SDK 客户端 |
| victor-starter | ~30 | 18 个 Controller + 安全 + 启动入口 |

### 2.2 核心问题：victor-service 严重臃肿

victor-service 当前包含了完全不相关的几类职责：

| 职责类别 | 包含内容 | 预估文件数 |
|----------|----------|-----------|
| 核心业务逻辑 | Experiment/Layer/Domain/Bucket/Config/Whitelist Service | ~15 |
| 数据访问层 | 18 个 Mapper 接口 | ~18 |
| Kafka 事件管道 | Producer、Consumer、ClickHouseWriter、EventRepository | ~6 |
| 统计分析引擎 | StatsEngine、ZTest、mSPRT、CUPED、BHCorrection、SrmTest、AaValidation、PowerAnalysis | ~10 |
| 统计模型类 | SequentialStatus、Recommendation、ConfidenceInterval、LiftEstimate 等 | ~8 |
| 数据分析服务 | BayesianAnalysis、SubgroupAnalysis、PowerAnalysis（Service层） | ~3 |
| 调度任务 | StatsDailyJob、StatsMonitorJob、RampScheduler | ~3 |
| 基础设施配置 | MybatisPlusConfig、ClickHouseDataSourceConfig、PipelineProperties | ~3 |

**建议拆分方案**：

```
victor-common          (保持)   — 工具、枚举、BucketEngine
victor-domain          (保持)   — 实体、DTO、事件模型
victor-stats-engine    (新建)   — ZTest、mSPRT、CUPED、BH、SRM、PowerAnalysis 等统计算法
victor-pipeline        (建议)   — Kafka Consumer/Producer、ClickHouse Writer、EventRepository
victor-service         (瘦身)   — 仅核心业务 CRUD + BucketingService + ConfigService + RbacService
victor-analysis        (建议)   — BayesianAnalysisService、SubgroupAnalysisService、BanditService
victor-sdk             (保持)   — Java SDK 客户端
victor-starter         (保持)   — Controller + 安全 + 启动入口
```

**额外发现**：父 pom.xml 的 `dependencyManagement` 中已声明 `victor-stats-engine`（第 106 行），但 `modules` 列表中并未包含。说明之前有拆分意图但未执行。

### 2.3 victor-domain 的 DTO 膨胀

当前 17 个 DTO 混在一个包中，部分 DTO 存在字段重叠（`ExperimentUpdateRequest` 与 `ExperimentCreateRequest`）。建议：
- 分为 `dto/request/` 和 `dto/response/` 子包
- 对高度重复的 DTO 使用公共基类

---

## 三、代码规范审查

### 3.1 命名问题

**严重：Bucket 概念三合一混淆**

`Bucket` 在全代码库中被混用于三个不同概念：
1. **哈希桶值**（0-9999）— 由 MurmurHash3 计算得出
2. **实验变体/Variant**（如 "control"、"treatment-v1"）— 即实验的不同组
3. **桶范围分配**（bucket_start / bucket_end）— 变体占据的桶区间

实际上 `victor_bucket` 表存储的是实验**变体**（Variant），但命名导致：
- `BucketService` 实际上是 VariantService
- `BucketController` 实际上是 VariantController
- `bucket_id` 列实际存储的是变体标识符

**建议**：在无法大面积重命名的情况下，至少在实体类 Javadoc 中明确说明语义。新代码使用 `variant` 命名，逐步迁移。

**字段命名不一致**：

| 位置 | 字段名 | 问题 |
|------|--------|------|
| `ExperimentCreateRequest` | `bucketKey` | 与实体 `Bucket.bucketId` 不同 |
| `SdkConfigResponse.BucketConfig` | `bucketKey` | 与 `BucketSpec.bucketId` 不同 |
| DTO `BucketRequest` | `trafficPercentage` | 实体使用 `bucket_start/bucket_end` |

### 3.2 反模式清单

**反模式一：Controller 直接注入 Mapper（多处）**

```java
// DomainController.java — 绕过 Service 层直接操作数据
private final DomainMapper domainMapper;
private final LayerMapper layerMapper;
```

`AuthController` 同样直接注入 `UserMapper`。这违反了分层架构原则。

**建议**：所有 Controller 必须通过 Service 层访问数据。为 Domain 创建 `DomainService`。

**反模式二：重复代码（3 处）**

| 重复方法 | 所在文件 |
|----------|----------|
| `parseGuardrailMetrics()` | `StatisticsService.java` + `ExperimentReportService.java` |
| `normalCDF()` | `PowerAnalysisService.java` + `SubgroupAnalysisService.java` |
| Gamma 分布采样 | `BanditService.java` + `BayesianAnalysisService.java` |

**建议**：提取到 `victor-common` 或 `victor-stats-engine` 作为共享工具。

**反模式三：ExperimentService 的两套桶边界计算**

`calculateBucketBucketBoundaries(List<Bucket>)` 和 `calculateBucketBoundaries(List<BucketRequest>)` 功能相似但实现不同。

**反模式四：静默吞异常**

```java
// ExperimentService.java:603
catch (Exception ignored) {
    // 吞掉所有异常，调用方无法感知
}
```

**反模式五：API 返回裸 Map<String, Object>**

`ExperimentReportController`、`MetricsController`、`AuthController` 等大量使用 `Map<String, Object>` 作为返回值，失去类型安全。应定义明确的响应 DTO。

---

## 四、数据库设计审查

### 4.1 ER 关系

```
victor_domain (1) ----< (N) victor_layer (1) ----< (N) victor_experiment (1) ----< (N) victor_bucket
                                                                   |
                                                                   +----< victor_experiment_whitelist
                                                                   +----< victor_experiment_approval
                                                                   +----< victor_experiment_report
                                                                   +----< victor_cuped_values
                                                                   +----< victor_report_job

victor_user (1) ----< rbac_user_role >---- (1) rbac_role (1) ----< rbac_role_permission
```

### 4.2 问题清单

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | FK 引用不一致 | 中 | `victor_bucket.exp_id` 引用 `victor_experiment.exp_id`（VARCHAR业务ID），而其他所有子表都用数字 PK 引用。无法在 SQL 层面声明 FK 约束 |
| 2 | 白名单反范式存储 | 中 | `victor_experiment_whitelist.user_ids` 存 TEXT 逗号分隔，无法高效查询"某用户是否在白名单中"。应拆为独立关联表 |
| 3 | 缺乏逻辑删除 | 中 | 仅 `rbac_role` 有 `deleted` 字段。实验、层等核心表的物理删除导致数据不可恢复 |
| 4 | 报表表 JSON 膨胀 | 低 | `experiment_report` 中 `daily_trends_json` 等字段随数据量增长会显著增大表体积 |
| 5 | 缺少索引 | 中 | `bucket_id`、`approver_id`、`created_by`、`email`、`start_time/end_time` 均无索引 |
| 6 | 缺少审计表 | 中 | 实验状态转换仅靠 `log.info()` 记录，无持久化审计追踪 |

**建议（汇总）**：
1. `victor_bucket` 增加 `experiment_id BIGINT` FK 列引用 `victor_experiment.id`
2. `victor_experiment_whitelist` 拆分为 `victor_experiment_whitelist_user(user_id, whitelist_id)` 关联表
3. 核心表统一添加 `deleted TINYINT(1) DEFAULT 0` 逻辑删除
4. 补充上述缺失索引
5. 创建审计日志表记录所有实验操作

---

## 五、API 设计审查

### 5.1 控制器清单（18 个）

| 控制器 | 路由前缀 | 端点 | 评价 |
|--------|----------|------|------|
| ExperimentController | `/api/v1/experiments` | 14 | 核心，合理 |
| ExperimentStatisticsController | `/api/v1/experiments` | 6 | **与上共享路由前缀，可能冲突** |
| ExperimentVersionController | `/api/v1/experiments/{expId}/versions` | 6 | 嵌套路由设计良好 |
| ExperimentReportController | `/api/v1/reports` | 6 | 独立路由，但与 experiment 脱节 |
| ExperimentWhitelistController | `/api/v1/whitelist` | 5 | 可合并到 experiment 下 |
| BucketController | `/api/v1/buckets` | 6 | 应合并到 experiment/versions |
| BanditController | `/api/v1/bandit` | 2 | **太薄，仅 2 个端点** |
| BayesianAnalysisController | `/api/v1/analysis` | 1 | **太薄，仅 1 个端点** |
| PowerAnalysisController | `/api/v1/power-analysis` | 2 | **应合并到 analysis** |
| SubgroupAnalysisController | `/api/v1/subgroup-analysis` | 2 | **应合并到 analysis** |
| RampController | `/api/v1/ramp` | 2 | 应嵌套在 experiment 下 |
| 其余 7 个 | 各自路径 | 2-7 | 基本合理 |

### 5.2 核心问题

**1. ExperimentController 与 ExperimentStatisticsController 路由冲突风险**

两个 Controller 都映射到 `/api/v1/experiments`，依赖 Bean 加载顺序决定路由分配。

**建议**：合并为一个 Controller，或将 Statistics 路由改为 `/api/v1/experiments/{id}/statistics/**`。

**2. 分析类控制器碎片化**

Bandit、Bayesian、PowerAnalysis、SubgroupAnalysis 共 4 个 Controller 只有 7 个端点，建议合并为统一的 `AnalysisController`：

```
POST   /api/v1/analysis/bayesian
POST   /api/v1/analysis/power
GET    /api/v1/analysis/subgroup/{id}
POST   /api/v1/analysis/bandit/optimize
GET    /api/v1/analysis/bandit/algorithms
```

**3. RbacController 安全回退漏洞**

```java
// RbacController.java:36
return 1L; // fallback for dev — 生产环境下的安全隐患
```

应移除 fallback，未认证时直接抛出 401。

**4. Whitelist API 使用逗号分隔字符串**

`addUsers(@RequestParam String userIds)` 要求调用方自行拼接逗号分隔字符串。应使用 `List<String>` 类型参数。

---

## 六、过度设计审查

### 6.1 统计算法自实现过多（高优先级）

| 算法 | 自实现内容 | 已引入的替代库 |
|------|-----------|--------------|
| SRM/卡方检验 | Gamma 函数、连分数展开、级数展开（130行） | `commons-math3` 已有 `ChiSquaredDistribution` |
| normalCDF | Abramowitz-Stegun 近似（2处重复） | `commons-math3` 已有 `NormalDistribution` |
| Gamma 采样 | Marsaglia-Tang 算法（2处重复） | `commons-math3` 已有 `GammaDistribution` |
| CUPED | 方差/协方差手动计算 | `commons-math3` 已有 `Covariance` |

Apache Commons Math3 已是项目显式依赖但未被充分利用。自实现带来的代价：
- 维护成本（需自行验证数值精度和边界条件）
- 代码中标记了多处 `TODO: compute proper variance`

**建议**：优先使用 commons-math3 的分布函数，仅当需要特殊定制时才自实现。

### 6.2 Kafka 管道过早引入

当前 Kafka 链路：SDK -> HTTP -> EventController -> KafkaProducer -> Kafka -> EventConsumer -> ClickHouseWriter -> ClickHouse

对于日均事件量小于百万级别的场景，直接 HTTP -> ClickHouse JDBC 批量写入更简单可靠。增加 Kafka 意味着需要维护额外的中间件和 6 个中间环节。

**建议**：保留 Kafka 配置但提供降级开关（通过配置选择直写 ClickHouse），让早期部署可以不依赖 Kafka。

### 6.3 配置版本管理过于复杂

`ConfigService` 同时维护 Redis 缓存版本 + MySQL `config_version` 表 + 版本变更记录 + 增量拉取逻辑。对于 AB 实验平台（配置变更频率一天几次），一个基于 MySQL 时间戳的简单版本号即可。

**建议**：取消增量拉取，简化为"版本号不等 -> 全量拉取"模式。

---

## 七、不足设计审查

### 7.1 测试覆盖率几乎为零（P0）

仅发现 5 个测试文件：
- `MurmurHash3Test.java`
- `ExperimentIdGeneratorTest.java`
- `LayerServiceTest.java`
- `ConfigServiceTest.java`
- `VictorClientTest.java`

以下关键模块**无任何测试**：
- `BucketEngine` — 核心分桶算法
- `ExperimentLifecycleService` — 状态机
- `StatsEngine` — 统计分析
- `ZTest / mSPRT / CUPED / SrmTest` — 统计算法
- 所有 18 个 Controller

**建议**：优先为 BucketEngine、状态机、统计算法编写单元测试。统计算法用 R/Python 计算结果作为期望值进行交叉验证。

### 7.2 生产安全能力缺失（P0/P1）

| 缺失能力 | 影响 | 建议 |
|----------|------|------|
| API 限流 | SDK 高频调用可打垮后端 | Bucketing/Config 接口添加令牌桶限流 |
| 分布式锁 | 多实例下实验状态变更可能竞态 | Redis SETNX 锁保护 start/stop/approve 操作 |
| SDK 认证 | Bucketing/Config 接口无需认证 | 添加 API Key 校验 |
| 审计日志 | 无法追溯谁做了什么操作 | 持久化实验状态变更记录 |
| 数据清理 | ClickHouse/MySQL 无限增长 | 设置 TTL 和报告保留策略 |

### 7.3 ConfidenceTrend 返回假数据

```java
// StatisticsService.java — 始终返回 confidence=0
dataPoints.add(DataPoint.builder()
    .confidence(0)  // TODO: 未实现
    .build());
```

应返回 501 Not Implemented 或清晰标记为开发中，而非返回虚假的零值数据。

### 7.4 护栏指标方差估算粗糙

```java
// StatsEngine.java — 标记了 TODO
ctrlVar = Math.max(ctrlMean * ctrlMean, 0.01);  // 粗略估算
treatVar = Math.max(treatMean * treatMean, 0.01);
```

这会影响 mSPRT 序贯检验的准确性。需从 ClickHouse 计算每个用户的收入方差。

### 7.5 实验版本回滚缺少安全校验

`BucketVersionService.rollbackToVersion()` 未校验：
1. 是否有其他实验共享同一层（回滚可能造成桶冲突）
2. 版本之间的 bucket 范围是否兼容
3. 是否需要审批

### 7.6 缺少可观测性埋点

代码中未发现任何 Micrometer Metrics（Timer/Counter/Gauge）埋点。应添加：
- 分桶请求量/耗时/命中率
- 配置拉取的命中/304 次数
- Kafka 消费延迟
- ClickHouse 查询耗时
- 实验状态变更事件计数

---

## 八、优先级改进路线图

### P0 — 必须在下一迭代完成（~6 人天）

| # | 改进项 | 工作量 |
|---|--------|--------|
| 1 | 为 BucketEngine、ExperimentLifecycleService、统计算法编写单元测试 | 3 人天 |
| 2 | 修复 ConfidenceTrend 返回假数据（标记为未实现或删除端点） | 0.5 人天 |
| 3 | Bucketing/Config SDK 接口添加限流 | 1 人天 |
| 4 | 实验生命周期操作添加 Redis 分布式锁 | 1 人天 |
| 5 | 修复 RbacController 的 fallback userId=1L 安全问题 | 0.5 人天 |

### P1 — 建议在 2 周内完成（~9 人天）

| # | 改进项 | 工作量 |
|---|--------|--------|
| 6 | 将统计算法抽取为独立 `victor-stats-engine` 模块 | 2 人天 |
| 7 | 用 commons-math3 替代自实现的 SrmTest 卡方检验和 normalCDF | 1 人天 |
| 8 | 消除重复代码：guardrail 解析、Gamma 采样、桶边界计算 | 1 人天 |
| 9 | DomainController 和 AuthController 改为通过 Service 层访问 | 1 人天 |
| 10 | victor_experiment_whitelist 拆分为独立关联表 | 2 人天 |
| 11 | 核心表添加 `deleted` 逻辑删除字段 | 1 人天 |

### P2 — 中期优化（1 个月内，~12 人天）

| # | 改进项 | 工作量 |
|---|--------|--------|
| 12 | 合并分析类 Controller 为统一的 AnalysisController | 1 人天 |
| 13 | 统一 API 响应格式（用 DTO 替代 Map<String, Object>） | 2 人天 |
| 14 | victor_bucket 表添加 `experiment_id BIGINT` FK 列 | 1.5 人天 |
| 15 | 简化 ConfigService 版本管理（取消增量拉取） | 1 人天 |
| 16 | 添加 ClickHouse 数据 TTL 和 MySQL 报告清理策略 | 1 人天 |
| 17 | 添加 Micrometer 指标埋点 | 1.5 人天 |
| 18 | 添加审计日志表并持久化实验状态变更 | 2 人天 |
| 19 | 修复 CUPED 护栏指标方差估算的 TODO | 1 人天 |
| 20 | 实验版本回滚添加安全校验 | 1 人天 |

### P3 — 长远规划

| # | 改进项 |
|---|--------|
| 21 | Kafka 管道提供直写 ClickHouse 降级开关 |
| 22 | 统一 Bucket/Variant 命名（需与前端协调） |
| 23 | API 版本化策略（预留 v2 路由空间） |
| 24 | 多租户支持（在 Domain 层面隔离） |
| 25 | OpenTelemetry 全链路追踪 |

---

## 九、总结

GateFlow victor-ab 后端在核心领域模型设计上是正确且内聚的：
- 域-层-实验-分桶的四层流量隔离模型清晰
- BucketingEngine 纯 Java 实现、无 Spring 依赖，可嵌入 SDK 是好的设计决策
- 生命周期状态机（draft -> pending_approval -> running -> stopped -> archive）简洁有效
- V2 迁移将实验状态从 12 个简化为 5 个体现了务实的重构意识

主要短板集中在三个层面：

1. **架构层面**：victor-service 承担太多职责，急需按"统计算法 / 事件管道 / 核心业务 / 数据分析"四方向拆分
2. **质量层面**：测试近乎于零，自实现的统计算法未经充分验证，缺乏分布式保护（锁、限流）
3. **规范层面**：命名混淆（Bucket vs Variant）、Controller 直调 Mapper、API 返回裸 Map、重复代码等问题需要修正

建议按照 **P0 -> P1 -> P2 -> P3** 的优先级逐步推进，先解决安全可靠性问题（测试、限流、分布式锁），再进行架构拆分和规范统一，最后考虑长远的能力建设。
