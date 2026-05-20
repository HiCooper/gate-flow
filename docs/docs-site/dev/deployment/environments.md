# 环境配置

本文档介绍不同环境的配置方法。

## 环境类型

| 环境 | 用途 | 域名示例 |
|------|------|----------|
| dev | 本地开发 | localhost:8080 |
| test | 集成测试 | test-api.gateflow.com |
| staging | 预发布 | staging-api.gateflow.com |
| prod | 生产环境 | api.gateflow.com |

## 配置方式

GateFlow 使用 Spring Profile 管理不同环境：

```bash
# 指定 Profile 启动
java -jar app.jar --spring.profiles.active=prod
```

## 配置文件

```
victor-web/src/main/resources/
├── application.yml          # 默认配置
├── application-dev.yml      # 开发环境
├── application-test.yml    # 测试环境
├── application-staging.yml # 预发布环境
└── application-prod.yml    # 生产环境
```

## 数据库配置

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/${DB_NAME}?useSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  flyway:
    enabled: true
    baseline-on-migrate: true
```

## Redis 配置

```yaml
spring:
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 20
        max-idle: 10
```

## 环境变量

生产环境通过环境变量注入敏感配置：

| 变量 | 说明 |
|------|------|
| DB_HOST | 数据库地址 |
| DB_USERNAME | 数据库用户名 |
| DB_PASSWORD | 数据库密码 |
| REDIS_HOST | Redis 地址 |
| REDIS_PASSWORD | Redis 密码 |
| API_KEY | SDK API 密钥 |