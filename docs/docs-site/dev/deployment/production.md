# 生产部署

本文档介绍 GateFlow 的生产部署流程。

## 架构概览

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ victor-starter │        │ victor-starter │        │ victor-starter │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
┌───▼───┐              ┌─────▼─────┐             ┌───▼───┐
│ MySQL │              │   Redis   │             │Kafka  │
└───────┘              └───────────┘             └───────┘
```

## 部署方式

### 方式一: JAR 部署

```bash
cd backend/victor-ab
mvn clean package -DskipTests
java -jar victor-starter/target/victor-starter-1.0.0.jar
```

### 方式二: Docker 部署

```dockerfile
FROM eclipse-temurin:17-jre-alpine
COPY target/victor-starter-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 环境要求

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 50 GB | 100 GB SSD |
| MySQL | 8.0 | 8.0 |
| Redis | 6.0 | 7.0 |

## 健康检查

```bash
# 检查应用健康状态
curl http://localhost:8081/actuator/health

# 预期响应
{"status":"UP"}
```

## 部署检查清单

- [ ] 备份数据库
- [ ] 验证配置文件
- [ ] 执行数据库迁移
- [ ] 启动应用并检查日志
- [ ] 验证健康检查端点
- [ ] 执行冒烟测试