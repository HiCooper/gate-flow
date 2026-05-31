# AB实验系统

GateFlow AB实验系统（Victor / 维克托）是企业级 A/B 测试平台的核心，提供从实验创建、流量分流、数据采集到统计分析的全链路实验能力。

## 系统能力

- **流量分流**: 基于 MurmurHash3 的一致性哈希分桶算法，支持 0.01% 精度流量切分
- **正交分层**: 多层实验互不干扰，同一用户可同时参与多个独立实验
- **多平台 SDK**: 支持 Java、iOS、Android、Expo 等平台，核心分流引擎可移植
- **统计分析**: 内置 Z-Test、mSPRT 序贯检验、CUPED 方差缩减、BH 多重比较校正
- **实验管理**: 完整的实验生命周期管理，从草稿到归档的全流程支持

## 核心架构

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Admin 控制台 │    │   Client SDK  │    │  下游服务     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────┐
│                  REST API (victor-starter)            │
├──────────────────────────────────────────────────┤
│   ExperimentService  │  BucketingService          │
│   ConfigService      │  StatisticsService         │
├──────────────────────────────────────────────────┤
│   BucketEngine (纯Java)  │  StatsEngine           │
├──────────────────────────────────────────────────┤
│   MySQL (配置)  │  Redis (缓存)  │  ClickHouse (分析) │
└──────────────────────────────────────────────────┘
```

## 文档导航

| 文档 | 说明 |
|------|------|
| [系统架构](./architecture) | 整体架构、模块依赖、技术栈 |
| [分流引擎](./bucketing-engine) | MurmurHash3 分桶算法原理与实现 |
| [统计引擎](./stats-engine) | Z-Test、mSPRT、CUPED 等算法 |
| [实验分析逻辑](./analysis-logic) | 分流数据+行为数据关联分析方案 |
| [数据模型](./data-model) | MySQL 与 ClickHouse 表结构设计 |
| [模块设计](./module-design) | Maven 多模块架构与依赖关系 |
| [实验管理平台](./experiment-platform) | Web 控制台功能设计 |
| [API 参考](./api) | REST API 接口文档 |
| [SDK 集成](./sdk-integration/) | 各平台 SDK 使用指南 |
| [SDK 开发](./sdk-development/) | SDK 内部架构与开发指南 |