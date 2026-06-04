# 2026-05-26 — 生产就绪度全面评估与对标分析

**评估日期**: 2026-05-26
**评估范围**: GateFlow/Victor AB 实验系统全栈（后端 Java Spring Boot、前端 React、SDK、数据管道）
**评估方法**: 代码级审查 + 对标阿里 PAI-ABTest、字节跳动 DataTester、腾讯 TAB、Google/Microsoft 实践

---

## 一、当前开发进展总结

### 1.1 已完成模块概览

| 模块 | 完成度 | 说明 |
|------|:------:|------|
| **分桶引擎** | 95% | MurmurHash3 + 正交分层 + 10000 桶粒度，纯 Java 无 Spring 依赖，可直接嵌入 SDK |
| **统计算法** | 85% | Z-Test、CUPED、mSPRT、BH-FDR、SRM、AA 验证、功效分析、贝叶斯分析均已实现 |
| **实验生命周期** | 85% | 11 种状态的状态机，完整 transition 矩阵，RampScheduler 5 级自动灰度推进 |
| **Java SDK** | 80% | 本地 Caffeine 缓存 + 版本轮询 + BucketEngine 嵌入式分流，增量配置更新 |
| **数据管道** | 70% | HTTP → Kafka → ClickHouse 链路完整，60 秒物化视图聚合 |
| **配置分发** | 85% | 全量/增量配置下发，ETag 版本比对，Redis 缓存 |
| **REST API** | 85% | 18 个 Controller，覆盖实验/变体/层/域/统计/报告/白名单/流量图/RBAC |
| **Admin 前端** | 50% | 实验管理、流量可视化 UI 存在，但多数 stores 使用 mock 数据，未与后端联调 |
| **DS Platform 前端** | 60% | 统计功效计算、贝叶斯分析、监控告警页面存在，部分对接真实 API |
| **文档体系** | 75% | VitePress 文档站 + AI 知识库 + Qoder Wiki + 调研报告 |
| **权限系统** | 50% | RBAC 实体已建表，PermissionInterceptor 已实现，但通过 Header 信任用户 ID，无真实认证 |
| **审批流程** | 40% | ExperimentApproval 表存在，API 有 submit/approve/reject，缺少通知和工作流引擎 |

**整体完成度估计**: 约 60-65%

### 1.2 近期迭代的已关闭能力项

以下能力在 2026-05-09 调研报告中标记为"待实现"，现已落地：

| 能力 | 实现位置 | 状态 |
|------|---------|:--:|
| 贝叶斯统计方法 | `BayesianAnalysisService` — Beta-Bernoulli 共轭模型 + 10万次蒙特卡洛采样 | ✅ |
| 多臂老虎机自动调优 | `BanditService` — Thompson Sampling / Epsilon-Greedy / UCB | ✅ |
| 实验功效计算 | `PowerAnalysisService` + `/api/v1/power-analysis` | ✅ |
| 白名单/定向实验 | `ExperimentWhitelist` 表 + 5 个 API + 前端 WhitelistTab | ✅ |
| 流量可视化地图 | `TrafficMapService` / `TrafficMapController` + 前端 TrafficPage | ✅ |
| 人群拆分分析 | `SubgroupAnalysisService` — 按平台/维度拆分 + Z-test | ✅ |
| 动态灰度推进 | `RampScheduler` — 5 级灰度 (1%/5%/10%/50%/100%) + 门禁检查 | ✅ |
| 配置增量更新机制 | `ConfigService` — 全量/增量配置 + ETag 版本比对 | ✅ |

---

## 二、距离生产级 AB 实验系统的差距

### P0 — 阻断上线（不解决无法生产使用）

#### 1. 身份认证体系缺失

- **现状**: `PermissionInterceptor` 直接信任 HTTP Header `X-User-Id`，无任何验证
- **风险**: 任何人可伪造任意用户身份，无登录、无 Session、无 Token
- **对标**: 阿里 SLR 跨服务权限治理，腾讯 TAB 对接企业 SSO
- **建议**: 接入 OAuth2/OIDC JWT 方案，对接企业统一身份认证（如 LDAP、OIDC Provider）

#### 2. Mock 数据占比较重

关键路径中残留大量假数据，直接影响功能可用性：

| 位置 | 问题 |
|------|------|
| `MetricsService.getDailyMetrics()` | `Random(42)` 假数据 |
| `ExperimentReportService.getReport()` | 硬编码返回值 |
| `MetricsService.getDashboardStats()` | 硬编码返回值 |
| `BanditService` 数据源 | `Math.random()` 模拟 |
| `analyticsStore` | 全部 mock 数据 |
| `templateStore` | 全部 mock 数据 |
| `audienceStore` | 全部 mock 数据 |
| `paywallStore` | 全部 mock 数据 |

仪表盘、实验报告、智能调优三大功能无法真实使用。

#### 3. ClickHouse 双配置源不一致

- Pipeline 模块用 `victor.clickhouse.*`，Stats 模块用 `victor.stats.clickhouse.*`
- 两套 `ClickHouseDataSource` 独立创建，无连接池管理
- 风险：连接泄漏，且两套配置容易不一致导致查询失败

#### 4. mSPRT 顺序检验有状态缺陷

代码中明确标注：当前是**无状态的简化实现**，lambda 公式未按照 Johari et al. 论文的递归公式正确实现。顺序检验要求累积历史观测值，当前每次调用重新计算，**无法真正控制假阳性率**。

- **对标**: 字节的 mSPRT 围绕实验全生命周期做有状态跟踪

#### 5. 缺少端到端集成测试

统计算法单元测试覆盖良好（ZTest、CUPED、BH），但以下关键链路零测试覆盖：

- Kafka → ClickHouse 数据管道
- ClickHouse 查询正确性
- API 契约测试
- SDK 端到端分流验证

### P1 — 严重影响生产可用性

#### 6. SDK 离线容灾未完全实现

Java SDK 有 disk cache 骨架（`~/.victor/victor_sdk_cache.json`），但未完整落地。配置服务宕机 → 所有接入方无法做分流决策。

- **对标**: 字节 SDK 网络异常时自动降级到本地持久化缓存，业务主链路不受影响

#### 7. 实时计算引擎是 Spring Scheduler

RampScheduler 每 5 分钟轮询一次。护栏指标异常到实验自动暂停，最坏 5 分钟延迟可能造成业务损失。

- **对标**: 字节/腾讯使用 Flink 流式计算，分钟级端到端延迟，支持 CEP 复杂事件处理

#### 8. 缺少实验指标管理体系

当前指标以 JSON 字符串存在实验表的 `primaryMetric`、`secondaryMetrics`、`guardrailMetrics` 字段中——不是结构化的指标定义，无类型、无聚合逻辑、无版本管理。

- **对标**: 字节有完整 Metric Governance — SQL 定义、血缘追踪、版本管理、北星指标（OEC）框架
- **影响**: 无法做指标血缘分析、变更影响评估、跨实验指标一致性校验

#### 9. Redis 缓存缺少击穿/雪崩/穿透防护

`ConfigService` 用 Redis 缓存配置版本，但无互斥锁、无 TTL 精细化策略、无缓存预热。高并发下缓存失效可能打爆数据库。

#### 10. 缺少可观测性体系

- 健康检查只覆盖 MySQL + Redis（不覆盖 ClickHouse / Kafka）
- Zipkin 配置存在但默认关闭
- 无 Prometheus metrics 暴露
- 无告警规则和 SLI/SLO 定义

- **对标**: 大厂实验平台有完整监控大盘 — 分流成功率、配置下发延迟、事件丢失率、统计任务耗时

### P2 — 功能完整性差距

#### 11. 实验模板体系缺失

Admin 前端有 TemplatesPage 界面，但后端无对应 API，模板数据为 mock。

- **对标**: 字节实验模板市场 — 预置 UI 优化、推荐算法、广告投放等常见实验类型

#### 12. 移动端 SDK 缺失

iOS/Android SDK 仅有架构设计文档和逆向分析报告，无可用代码。Expo SDK 在开发中。

- **对标**: 大厂覆盖 Java/Go/Python/iOS/Android/JS/React Native 全端

#### 13. 通知与协作系统缺失

实验状态变更无站内通知/邮件/Slack/企业微信通知。无 @提及、评论、协作审批流。

#### 14. 缺少因果推断方法

当前只有经典假设检验，缺少 DID（双重差分）、RDD（断点回归）、IV（工具变量）等方法。无法分析长期效应、处理策略叠加、做因果归因。

#### 15. 实验交互/冲突检测不足

`TrafficMapService` 只检测同层桶冲突，缺少跨层实验参数覆盖关系、共享用户池冲突、指标蚕食检测。

- **对标**: 腾讯 TAB 有完整实验冲突矩阵

#### 16. CI/CD 集成缺失

无「实验配置即代码」(Experiment as Code) — 实验配置无法通过 Git 管理，无自动化流水线集成。

### P3 — 性能与规模

#### 17. 未做规模化验证

- 单 MySQL 实例，无分库分表方案
- ClickHouse 单节点，无集群配置
- 无压测数据和性能基线

- **对标**: 字节日均数百并发实验、数十亿用户分流

#### 18. 审批与治理落地不够

表结构有，API 有，但审批流是线性的（单人审批），缺少多级审批链和企业 IM 集成。

---

## 三、对标大厂 — 可借鉴的设计

### 3.1 字节跳动 DataTester / 火山引擎

| 设计 | 说明 | 借鉴建议 |
|------|------|---------|
| **Flink 实时指标计算** | 分钟级端到端延迟，支持 CEP 复杂事件 | 短期：增强 ClickHouse MV + 缩短调度到 30s；中长期：引入 Flink |
| **参数化实验** | 实验参数与代码解耦，远程配置热更新 | `Variant.params` 已有基础，需增加 SDK 侧实时监听变更（当前轮询 30s） |
| **自动调优 (MAB)** | 运行中自动分配更多流量给优胜组 | BanditService 算法已有，需对接真实指标数据替代 Math.random() |
| **实验知识图谱** | 记录历史每个实验结论/指标影响/复盘 | GateFlow 知识库体系的差异化机会 |

### 3.2 阿里巴巴 PAI-ABTest

| 设计 | 说明 | 借鉴建议 |
|------|------|---------|
| **上下文感知路由** | 根据用户特征（设备/地域/会员等级）动态分流 | `Experiment.targetingRules` 已有基础，需增加规则引擎（Aviator/QLExpress） |
| **MaxCompute + Hologres 双引擎** | 离线批处理 + 实时 OLAP 各司其职 | ClickHouse 已承担 OLAP，但缺少离线数仓层做 T+1 深度分析 |
| **参数化 Rollout** | 灰度比例通过配置中心实时下发，无需重启 | 当前 Variant 更新需创建新版本，流程较重 |

### 3.3 腾讯 TAB

| 设计 | 说明 | 借鉴建议 |
|------|------|---------|
| **流量染色与可视化** | 树状结构展示层-桶-参数覆盖关系 | TrafficPage 已有基础，应增加**参数冲突热力图** |
| **双端埋点对账** | 服务端路由日志 + 客户端 ACM 追踪串关联 | 当前只有服务端上报，缺少客户端对账 |
| **域+层嵌套架构** | 递归嵌套解决复杂组织架构下的流量隔离 | 当前域-层是扁平关系，不支持递归嵌套 |

### 3.4 Google / Microsoft 通用实践

| 实践 | 说明 | 借鉴建议 |
|------|------|---------|
| **OEC 框架** | 每个实验必须有唯一北星指标 + 护栏指标组合 | 需构建 OEC 框架 — 定义指标方向性及可接受护栏恶化阈值 |
| **Experiment Scorecard** | 标准化实验报告 — SRM / Guardrails / Primary / Secondary 四层结果 | `StatsEngine.analyzeExperiment()` 已有雏形 |
| **Trustworthy Experimentation** | 微软可信实验框架 — AA 验证 / SRM 门禁 / 护栏 / Staged Rollout | 已具备 3/4，缺少的自动化执行而非人工触发 |
| **Overlapping Experiments** | Google 正交分层论文 — 同一用户同时参与多实验 | 已实现核心机制，缺少**实验饱和度指标** |

---

## 四、建议实施路线图

### Phase 1 — 可上线（预计 4-6 周）

1. 接入真实认证 — OAuth2/JWT 替换 Header 信任
2. 消除所有 Mock 数据 — 仪表盘/报告/调优对接真实 ClickHouse
3. 补齐 mSPRT 有状态实现 — 按 Johari et al. 论文递归公式
4. ClickHouse 连接池统一 — HikariCP + 单配置源
5. Redis 缓存防护 — 布隆过滤器 + 互斥锁 + TTL 策略
6. 核心链路集成测试 — Kafka → ClickHouse e2e 测试

### Phase 2 — 生产可用（预计 6-8 周）

7. SDK 离线容灾落地 — 本地持久化缓存 + 降级策略
8. 可观测性体系 — Prometheus + Grafana + 告警规则
9. 通知系统 — 企业微信/Slack 实验状态通知
10. 指标管理平台 — 指标定义、血缘、OEC 框架
11. 移动端 SDK 开发 — iOS/Android
12. 实验模板体系后端 API

### Phase 3 — 竞争力建设（预计 3-6 月）

13. Flink 实时计算引入 — 护栏指标实时监控
14. 因果推断方法 — DID/RDD 处理策略叠加场景
15. 实验冲突矩阵 — 参数覆盖热力图 + 指标蚕食检测
16. CI/CD 集成 — Experiment as Code
17. 知识库 UI + 实验结论沉淀
18. 规模化验证 — 压测 + 分库分表 + ClickHouse 集群

---

## 五、总结

**GateFlow 核心竞争力**在分桶引擎和统计引擎——这两块已达到甚至部分超越大厂水平（10000 桶粒度优于字节的 1000 桶、CUPED 实现覆盖更全）。

**当前最大瓶颈**在工程化和产品化：身份认证安全、Mock 数据残留、可观测性缺失、离线容灾未落地——这些"不酷但关键"的能力决定系统能否真正跑在生产环境。

**差异化策略建议**：相比做通用 AB 平台与字节/阿里正面竞争，更务实的路线是聚焦**付费墙/订阅增长**垂直场景，以行业模板 + 知识库沉淀 + 中国市场支付（支付宝/微信）集成为差异化切入点。

---

*报告基于 2026-05-26 代码库状态，涵盖 108 个 Java 源文件、4 个前端应用、9 个 Maven 模块的全面审查。*
