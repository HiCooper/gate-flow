# AB实验系统架构

本文档描述 GateFlow AB实验系统的整体架构、模块依赖关系和技术选型。

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
    end

    subgraph API["API 网关层"]
        G1[REST API<br/>Spring Boot]
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
    P2 --> D4
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

## 实验生命周期

实验遵循 5 状态简化生命周期（经由 Flyway V2 迁移从 12 个状态简化为 5 个）：

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
| `draft` | 草稿，实验设计中 | 编辑、提交审批、启动、删除 |
| `pending_approval` | 待审批 | 审批通过、驳回 |
| `running` | 运行中，分流活跃 | 停止（可启用 auto_ramp 自动放量） |
| `stopped` | 已停止，数据收集结束 | 归档、查看分析报告 |
| `archive` | 已归档，知识沉淀 | 查看 |

> 灰度放量（ramp）不再是独立状态，而是 running 状态的特性（通过 `auto_ramp_enabled` 标志和 `ramp_config` JSON 配置实现）。`RampScheduler` 每 5 分钟检查 Redis 健康结果并自动推进流量比例。

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

## 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| Java 17 + Spring Boot 3.4 | 后端框架 |
| MyBatis-Plus 3.5 | ORM |
| MySQL 8.0 | 配置数据库 |
| Redis 7 | 缓存 |
| Apache Kafka | 事件流 |
| ClickHouse | 分析数据库 |
| Flyway | 数据库迁移 |
| SpringDoc OpenAPI | API 文档 |

### 前端

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Vite | 构建工具 |
| Tailwind CSS v4 | 样式系统 |
| Zustand | 状态管理 |
| Recharts | 图表库 |

## 安全架构

`victor-starter` 通过以下组件实现 JWT + RBAC 安全模型：

| 组件 | 职责 |
|------|------|
| `JwtTokenProvider` | JWT Token 生成与验证 |
| `JwtAuthenticationFilter` | 从请求头提取 Bearer Token，设置 SecurityContext |
| `PermissionInterceptor` | 拦截 `@RequirePermission` 注解，校验用户权限 |
| `SecurityConfig` | 白名单配置（`/api/v1/auth/**`、`/api/v1/config/**`、`/api/v1/bucketing/**` 无需认证） |

**4 个角色**:
- **ADMIN** — 全部权限（含用户管理）
- **OPERATOR** — 实验创建/编辑/审批/查看分析
- **VIEWER** — 只读（查看实验和分析）
- **SDK_CLIENT** — 仅分流/配置/事件 API 访问

**10 项权限**: `CREATE_EXPERIMENT`、`EDIT_EXPERIMENT`、`DELETE_EXPERIMENT`、`VIEW_EXPERIMENT`、`APPROVE_EXPERIMENT`、`SUBMIT_APPROVAL`、`VIEW_TRAFFIC`、`VIEW_ANALYSIS`、`POWER_ANALYSIS`、`MANAGE_USERS`

## 详细文档

| 文档 | 说明 |
|------|------|
| [分流引擎](./bucketing-engine) | MurmurHash3 分桶算法详解 |
| [统计引擎](./stats-engine) | Z-Test、mSPRT、CUPED 算法 |
| [数据模型](./data-model) | 数据库表结构设计 |
| [模块设计](./module-design) | Maven 多模块职责与依赖 |