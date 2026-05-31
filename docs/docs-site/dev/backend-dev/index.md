# 后端开发

GateFlow 后端采用 Java Spring Boot + Maven 多模块架构，包含 5 个模块：

| 模块 | 用途 | 关键特征 |
|------|------|----------|
| `victor-common` | 公共工具层 | BucketEngine（MurmurHash3 分桶）、枚举、常量、异常 |
| `victor-domain` | 数据模型层 | 实体类、DTO、事件模型 |
| `victor-service` | 业务服务层 | 19 个业务服务、MyBatis 数据访问、Kafka 管道、统计算法、Bandit、Flyway 迁移 |
| `victor-sdk` | 客户端 SDK | Java 端侧 SDK（Caffeine 缓存、OkHttp、离线降级） |
| `victor-starter` | 应用入口 | Spring Boot 启动类、18 个 Controller、JWT 安全、RBAC 拦截器 |

详细模块设计见 [模块设计](/dev/ab-system/module-design)。

## 详细内容

- [编码规范](/dev/backend-dev/coding-standards)
- [添加新接口](/dev/backend-dev/adding-endpoint)
- [数据库迁移](/dev/backend-dev/db-migrations)
- [测试指南](/dev/backend-dev/testing-guide)
