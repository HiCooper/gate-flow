# 架构总览

GateFlow 采用分层微服务架构,各模块职责清晰,支持水平扩展。

## 整体系统架构

```mermaid
graph TB
    subgraph Client["客户端层"]
        C1[iOS App]
        C2[Android App]
        C3[Web App]
        C4[下游服务]
    end

    subgraph Frontend["前端应用层"]
        F1[Admin Console<br/>React + TS]
        F2[Marketing Site<br/>React + TS]
        F3[Victor Mng Front<br/>React + TS]
        F4[Docs Site<br/>VitePress]
    end

    subgraph API["API 网关层"]
        G1[REST API<br/>Spring Boot]
        G2[Swagger UI]
    end

    subgraph Backend["后端服务层"]
        subgraph Service["业务服务"]
            S1[ExperimentService]
            S2[BucketingService]
            S3[StatisticsService]
            S4[ConfigService]
        end

        subgraph Engine["核心引擎"]
            E1[BucketEngine<br/>分桶引擎]
            E2[StatsEngine<br/>统计引擎]
        end

        subgraph Pipeline["数据管道"]
            P1[EventController]
            P2[Kafka Consumer]
            P3[ClickHouse Writer]
        end
    end

    subgraph Data["数据层"]
        D1[(MySQL<br/>配置数据)]
        D2[(Redis<br/>缓存)]
        D3[(Kafka<br/>事件流)]
        D4[(ClickHouse<br/>分析数据)]
    end

    Client --> G1
    Frontend --> G1
    G1 --> Service
    Service --> Engine
    Service --> Pipeline
    Pipeline --> D3
    P2 --> D3
    P3 --> D4
    S1 --> D1
    S2 --> D2
    S3 --> D4
    E1 -.->|可移植| C1
    E1 -.->|可移植| C2
```

## 模块依赖关系

```mermaid
graph TD
    Web[victor-web<br/>Web 入口] --> Service
    Web --> Infra
    Web --> Domain

    Service[victor-service<br/>业务服务] --> Bucketing
    Service --> Domain
    Service --> Infra

    Pipeline[victor-pipeline<br/>数据管道] --> Infra
    Pipeline --> Domain

    Stats[victor-stats<br/>统计引擎] --> Domain

    SDK[victor-sdk<br/>客户端 SDK] --> Bucketing
    SDK --> Domain

    Bucketing[victor-bucketing<br/>分桶引擎<br/>纯 Java,无 Spring] --> Domain

    Infra[victor-infrastructure<br/>基础设施] --> Domain

    Domain[victor-domain<br/>领域模型] --> Common

    Common[victor-common<br/>公共模块]

    style Bucketing fill:#e1f5e1
    style Stats fill:#fff2e1
```

> 绿色模块 `victor-bucketing` 是纯 Java 实现,无 Spring 依赖,可直接嵌入客户端 SDK。

## 实验生命周期状态机

```mermaid
stateDiagram-v2
    [*] --> Draft: 创建实验
    Draft --> PendingReview: 提交审批
    PendingReview --> Draft: 驳回
    PendingReview --> Running: 审批通过
    Running --> Stopped: 手动停止
    Running --> Analyzing: 实验结束
    Stopped --> Analyzing: 分析数据
    Analyzing --> Decided: 做出决策
    Decided --> RolledOut: 全量获胜方案
    Decided --> RolledBack: 回滚
    Decided --> Archived: 存档
    RolledOut --> [*]
    RolledBack --> [*]
    Archived --> [*]
```

## 事件流管道架构

```mermaid
sequenceDiagram
    participant SDK as Client SDK
    participant API as EventController
    participant Kafka as Kafka
    participant Consumer as Kafka Consumer
    participant CH as ClickHouse Writer
    participant DB as ClickHouse

    SDK->>API: POST /api/v1/events
    API->>Kafka: Publish Event
    API-->>SDK: 202 Accepted

    Kafka->>Consumer: Consume Event
    Consumer->>CH: Batch Write
    CH->>DB: Insert Records
    CH-->>Consumer: Ack

    Note over SDK,DB: 近实时采集,秒级聚合
```

## 分桶算法流程

```mermaid
flowchart TD
    A[userId] --> B[computeBucket]
    C[layerId] --> B
    D[salt] --> B

    B --> E[MurmurHash3<br/>hash = hash userId#layerId#salt ]
    E --> F[bucket = hash % 10000]
    F --> G{bucket 范围匹配}

    G -->|variant1<br/>0-4999| H[control]
    G -->|variant2<br/>5000-7499| I[treatment_a]
    G -->|variant3<br/>7500-9999| J[treatment_b]

    H --> K[返回 variantKey]
    I --> K
    J --> K
```

## 技术栈总览

### 前端

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Vite 5.4 | 构建工具 |
| Tailwind CSS v4 | 样式系统 |
| React Router v6/v7 | 路由 |
| Zustand | 状态管理 |
| Recharts | 图表库 |
| @dnd-kit | 拖拽组件 |

### 后端

| 技术 | 用途 |
|------|------|
| Java 17 + Spring Boot 3.4 | 后端框架 |
| MyBatis-Plus 3.5 | ORM |
| MySQL 8.0 | 主数据库 |
| Redis 7 | 缓存 |
| Apache Kafka | 事件流 |
| ClickHouse | 分析数据库 |
| Flyway | 数据库迁移 |
| SpringDoc OpenAPI | API 文档 |

## 详细内容

| 文档 | 说明 |
|------|------|
| [模块设计](/dev/architecture/module-design) | 各模块职责和依赖关系 |
| [分桶引擎](/dev/architecture/bucketing-engine) | MurmurHash3 分桶算法原理 |
| [统计引擎](/dev/architecture/stats-engine) | Z-Test、mSPRT、CUPED 等算法 |
| [事件管道](/dev/architecture/event-pipeline) | Kafka + ClickHouse 实时流 |
| [数据模型](/dev/architecture/data-model) | 数据库表结构设计 |
| [前端架构](/dev/architecture/frontend-arch) | 前端应用技术栈和架构 |
