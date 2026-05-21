# victor-stats 模块拆分：Engine（库） + Scheduler（独立进程）

**类型：** 决策
**范围：** 后端 — victor-stats-engine, victor-stats-scheduler
**前置依赖：** 无
**最后更新：** 2026-05-21

## 摘要（TL;DR）

victor-stats 原为「双模式」模块——既是 library 被 victor-service 依赖，又是独立进程有 main
类和 @Scheduled 任务。拆分为 victor-stats-engine（纯库，留 victor-ab）和
victor-stats-scheduler（新 git 项目，独立部署），解除离线任务和在线 API 的耦合。

## 背景

原始 victor-stats 模块同时承担两种角色：
1. 作为库：提供 `StatsEngine`、统计算法、`MetricsRepository` 等给 `victor-service`
   的 `StatisticsService` 调用（同步、在线）
2. 作为独立进程：`VictorStatsApplication` + 3 个 @Scheduled 定时任务（异步、离线）

双模式导致的问题：
- victor-web 的 `scanBasePackages = "com.gateflow.victor"` 会拾取 scheduler beans，
  即使 victor-web 不需要离线任务
- 离线任务和在线 API 捆绑发版、共享资源配置
- 模块职责不清晰：pom.xml 混入了 scheduler 专属依赖（Redis、Actuator、Tracing）

## 详情

### 拆分结果

```
backend/
├── victor-ab/                          # 现有项目
│   └── victor-stats-engine/            # 纯库（算法、模型、StatsEngine、Repository）
│       - 无 main 类，无 @Scheduled
│       - 无 spring-boot-maven-plugin（输出 plain jar）
│       - 仅依赖 spring-boot-starter, jdbc, commons-math3, clickhouse-jdbc
│
└── victor-stats-scheduler/             # 新 git 项目
    - parent: spring-boot-starter-parent（独立于 victor-parent）
    - 包含：main 类 + 3 个定时任务 + application.yml
    - 依赖 victor-stats-engine（Maven 制品，本地 ~/.m2 或远程仓库）
    - 输出 executable fat jar (port 8082)
```

### victor-stats-engine 保留内容

| 包 | 内容 | victor-service 消费者 |
|----|------|----------------------|
| `algorithm/` | 7 个算法类 | ZTest, SrmTest |
| `model/` | 8 个模型/DTO | ExperimentReport, TestResult, Recommendation |
| `engine/StatsEngine` | 编排门面 | StatisticsService, ExperimentReportService |
| `config/StatsClickHouseConfig` | ClickHouse 连接 | SubgroupAnalysisService |
| `repository/MetricsRepository` | ClickHouse 查询 | MetricsService, StatisticsService |
| `repository/ReportRepository` | MySQL 报告读写 | StatisticsService |
| `repository/ExperimentRepository` | MySQL 实验查询 | (仅 scheduler 使用) |

### victor-stats-scheduler 迁移内容

| 文件 | 说明 |
|------|------|
| `VictorStatsSchedulerApplication` | main 类，scanBasePackages="com.gateflow.victor.stats" |
| `EndOfExpJob` | 60s 轮询，检测 stopped 实验 → 生成终态报告 |
| `StatsDailyJob` | 凌晨2点，3 阶段分析（聚合+CUPED+持久化） |
| `StatsMonitorJob` | 5 分钟，SRM+转化率快照 → Redis |
| `application.yml` | port 8082，MySQL/Redis/ClickHouse 连接 |

### 依赖关系

```
victor-stats-scheduler (独立进程, port 8082)
    └── victor-stats-engine (Maven 制品)
            └── 被 victor-service / victor-web 依赖
```

### 关键配置注意事项

- **Lombok 配置：** 当 project parent 是 `spring-boot-starter-parent`（非 victor-parent），
  必须在 `maven-compiler-plugin` 中显式配置 `annotationProcessorPaths` 包含 Lombok，
  否则 `@Slf4j` 等注解不会生成代码。
- **引擎安装：** scheduler 构建前需先 `mvn install` engine 到本地 `~/.m2`。
  CI/CD 中可通过 checkout 两个仓库或发布 engine 到 GitHub Packages 解决。
- **@EnableScheduling 移除：** victor-web 的 `VictorServiceApplication` 移除了
  `@EnableScheduling`，因为 scheduler beans 已迁出，无 @Scheduled 方法需要触发。

## 可执行规则

- **应该：** 新建模块前明确其角色——是纯库（plain jar，无 main）还是独立进程（executable jar）。
  一个模块只承担一种角色。
- **应该：** 独立部署的模块使用自己的 git 仓库和 parent POM（spring-boot-starter-parent），
  不与库模块的 reactor 构建耦合。
- **禁止：** 在库模块中引入 spring-boot-maven-plugin（会破坏 library jar 结构）。
- **禁止：** 在库模块中引入独立进程专属依赖（Redis、Actuator、micrometer-tracing）。

## 后果

未拆分前，scheduler beans 被 victor-web 的组件扫描拾取，导致同一个进程中同时存在
在线 API 和离线定时任务，资源竞争且部署边界模糊。拆分后两者独立扩缩容、独立发版。

## 关联文档

- `backend/victor-ab/victor-stats-engine/pom.xml`
- `backend/victor-stats-scheduler/pom.xml`
- `backend/victor-ab/victor-web/src/main/java/com/gateflow/victor/VictorServiceApplication.java` — 移除了 @EnableScheduling
