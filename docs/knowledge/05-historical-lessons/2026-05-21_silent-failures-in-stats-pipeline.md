# 统计管线静默失败 — 代码审查发现的 5 个严重缺陷

**类型：** 排坑记录
**范围：** 后端 — victor-stats
**前置依赖：** 无
**最后更新：** 2026-05-21

## 摘要（TL;DR）

外部 agent 代码审查发现 victor-stats 统计管线存在多个「代码执行了但结果未生效」的静默失败：CUPED
计算结果被丢弃、MySQL ENUM 与 Java 枚举不同步导致定时任务永不会匹配实验、SRM 检验硬编码均分假设、
护栏指标用二项方差公式计算连续型收入数据。这些问题不会报错，但会导致功能完全空转。

## 背景

victor-stats 模块在一次 3 轮自主审查后，又接受了一个外部 agent 的全量代码审查。该审查采用
「逐行追踪数据流」方法，发现了仅靠编译检查和功能测试无法暴露的逻辑缺陷。

## 详情

### 1. CUPED 结果未回写报告（最严重）

`StatsDailyJob.applyCUPED()` 调用了 `cuped.adjust()` 得到 `SampleStatistics`，但只打了 debug
日志后就丢弃了结果。`ExperimentReport` 模型根本没有 CUPED 相关字段。

**根因：** 功能分阶段实现，Phase 2（CUPED）的"写入报告"步骤被遗漏。

**修复：**
- `ExperimentReport.VariantSummary` 新增 `cupedAdjustedMean` / `cupedAdjustedVariance`
- `applyCUPED()` 通过 `report.getVariantSummaries().get(key)` 回写 CUPED 结果
- 新增 `report.cupedApplied` 标记

### 2. MySQL ENUM 与 Java Enum 不同步

`ExperimentStatus` Java enum 有 `STOPPED("stopped")`，`EndOfExpJob` 查询
`WHERE e.status = 'stopped'`。但 MySQL V1 schema 中 status 列的 ENUM 定义为
`('draft','review','ramp','running','paused','analyzing','decision','archive')`，
不含 `'stopped'`。MySQL 严格模式下会拒绝写入 'stopped' 值，导致没有任何实验能匹配
EndOfExpJob 的查询。

**根因：** 状态机在 Java 层演进，但 DB schema 的 Flyway 迁移未同步更新。

**修复：** V8 迁移将 ENUM 扩展为包含 `pending_approval`、`approved`、`rejected`、`stopped`。

### 3. SRM 检验硬编码均分假设

`StatsEngine.runSRMCheck()` 硬编码 `expected[i] = 1.0 / expected.length`，假设所有变体流量均分。
但实际业务中 control 50%、treatment_a 25%、treatment_b 25% 是常见配置。

**根因：** `ExperimentRepository.findVariants()` 已从 DB 查询了 `bucket_start`/`bucket_end`，
但 `VariantInfo` DTO 丢弃了这些数据，只返回变体 key 列表。

**修复：** `VariantInfo` 新增 `bucketProportions` 字段，从 bucket 范围计算真实比例
（`(end-start+1)/10000`），传递给 `analyzeExperiment()`。

### 4. 护栏指标用二项方差公式计算连续数据

`StatsEngine.runGuardrailTests()` 对 avgRevenue 使用
`variance = avgRevenue * (1 - avgRevenue)`。这是二项分布的方差公式，仅适用于 0-1
比例的指标。当 avgRevenue > 1（如 $19.99）时，`1 - avgRevenue` 为负数，产生负数方差。
负数方差传入 mSPRT 会导致无意义结果。

**根因：** 从 conversion rate 的 Z-Test 代码复制粘贴时未调整方差公式。

**修复：** 改用 `avgRevenue²` 作为连续数据的方差代理，添加 TODO 说明需从 ClickHouse
计算真实 per-user 方差。

### 5. CUPED `overallMeanX == 0.0` 判断逻辑错误

用 `overallMeanX == 0.0` 判断「无实验前数据」，但当转化率真的为 0 时（预实验窗口无人转化），
也会误判为无数据而跳过 CUPED。

**根因：** `allPreValues.stream().average().orElse(0.0)` 的默认值 0.0 与真实均值 0.0 无法区分。

**修复：** 改为 `allPreValues.isEmpty()` 检查。

## 可执行规则

- **应该：** 代码审查时追踪每个计算结果的「消费者」——如果计算结果只被 log 而未被任何字段/返回值使用，视为缺陷。
- **应该：** 涉及状态机的变更必须同时检查 Java enum 和 MySQL ENUM（或任何外部存储的约束）。
- **禁止：** 对连续型指标使用 `p*(1-p)` 二项方差公式。该公式仅适用于 0-1 比例（转化率）。
- **禁止：** 用浮点数 `== 0.0` 判断「无数据」，始终用集合 `.isEmpty()` 检查。

## 后果

忽略这些问题会导致：CUPED 离线计算浪费 CPU 但报告不受益；实验结束后永远不会自动生成终态报告；
SRM 检验对非均分实验给出错误结论；护栏指标产生 NaN/负数方差导致决策失效。

## 关联文档

- `backend/victor-ab/victor-stats-engine/src/main/java/com/gateflow/victor/stats/engine/StatsEngine.java`
- `backend/victor-ab/victor-stats-engine/src/main/java/com/gateflow/victor/stats/algorithm/ZTest.java`
- `backend/victor-stats-scheduler/src/main/java/com/gateflow/victor/stats/scheduler/StatsDailyJob.java`
