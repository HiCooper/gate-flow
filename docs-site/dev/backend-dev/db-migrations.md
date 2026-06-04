# 数据库迁移

本文档介绍如何使用 Flyway 进行数据库版本管理。

## 迁移脚本位置

迁移脚本位于 `victor-service/src/main/resources/db/migration/`

```
victor-service/src/main/resources/db/migration/
├── V1__init_schema.sql              # 初始化 14 张表（含 RBAC、用户、审批等）
└── V2__simplify_experiment_status.sql   # 实验状态从 12 个简化为 5 个
```

## 版本规则

- 文件名格式: `V{版本号}__{描述}.sql`
- 版本号必须唯一且递增
- 双下划线 `__` 分隔版本号和描述

## 当前迁移

| 版本 | 文件 | 说明 |
|------|------|------|
| V1 | init_schema.sql | 初始化 14 张表（实验、层、域、分桶、配置、白名单、审批、报告、CUPED、用户、RBAC 角色/用户角色/角色权限、报告任务） |
| V2 | simplify_experiment_status.sql | 实验状态从 12 个简化为 5 个（draft / pending_approval / running / stopped / archive） |

## 执行时机

Flyway 迁移在应用启动时自动执行。

日志示例：
```
Flyway Community Edition 9.22.3 by Boxfuse
Database: jdbc:mysql://localhost:3306/victor_experiment (MySQL 8.0)
Successfully validated 2 migrations (execution time 00:00.023s)
Current version of schema "victor_experiment": 1
Schema "victor_experiment" is up to date. No migration necessary.
```

## 添加新迁移

1. 创建新的 SQL 文件，例如 `V3__add_xxx.sql`
2. 编写迁移 SQL
3. 重启应用，Flyway 会自动执行

```sql
-- V3__add_xxx.sql
CREATE TABLE IF NOT EXISTS `victor_xxx` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 手动操作

### 查看迁移状态

```bash
mvn flyway:info -pl victor-service
```

### 清理并重新迁移（仅开发环境）

```bash
mvn flyway:clean flyway:migrate -pl victor-service
```

::: danger 警告
`flyway:clean` 会删除所有表，仅用于开发环境！
:::