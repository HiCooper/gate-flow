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
    Starter[victor-starter<br/>应用入口 + Controllers] --> Service[victor-service<br/>业务逻辑 · 管道 · 统计]
    Starter --> Domain[victor-domain<br/>领域模型]

    Service --> Domain

    SDK[victor-sdk<br/>客户端 SDK] --> Domain
    SDK -.->|可嵌入| Common[victor-common<br/>BucketEngine · 枚举 · 工具]

    Domain --> Common

    style Common fill:#e1f5e1
```

> 绿色模块 `victor-common` 是纯 Java 实现，无 Spring 依赖。`BucketEngine` 可直接嵌入客户端 SDK（Java / Kotlin / Swift / TypeScript）。

## 实验生命周期状态机

```mermaid
stateDiagram-v2
    [*] --> Draft: 创建实验
    Draft --> PendingApproval: 提交审批
    PendingApproval --> Draft: 驳回
    PendingApproval --> Running: 审批通过
    Running --> Stopped: 停止实验
    Stopped --> Archive: 归档
    Archive --> [*]
```

| 状态 | 说明 | 允许的操作 |
|------|------|-----------|
| `draft` | 草稿 | 编辑、提交审批、启动、删除 |
| `pending_approval` | 待审批 | 审批通过、驳回 |
| `running` | 运行中 | 停止（可启用 auto_ramp 灰度自动推进） |
| `stopped` | 已停止 | 归档、查看分析报告 |
| `archive` | 已归档 | 查看 |

> 灰度放量不再是独立状态，而是 running 状态内的特性（`auto_ramp_enabled` + `ramp_config`）。

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

GateFlow 包含两个核心子系统，各自有独立的文档章节：

| 文档 | 说明 |
|------|------|
| [AB实验系统](/dev/ab-system/) | 分流引擎、统计引擎、数据模型、模块设计、SDK 集成等 |
| [埋点分析系统](/dev/analytics-system/) | 事件管道、数据模型、SDK 设计、会话管理、DLQ 重放等 |
| [前端架构](/dev/architecture/frontend-arch) | 前端应用技术栈和架构 |
