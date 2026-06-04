# Docker 部署

本文档介绍使用 Docker Compose 部署 GateFlow 开发/测试环境。

## 前提条件

- Docker >= 20.x
- Docker Compose >= 2.x

## 快速启动

### 1. 启动基础设施

```bash
cd backend/victor-ab
docker-compose up -d mysql redis
```

这将启动：
- **MySQL 8.0** (port 3306) - 实验数据存储
- **Redis** (port 6379) - 缓存和配置存储

### 2. 验证服务

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f mysql
```

### 3. 初始化数据库

Flyway 会在应用启动时自动执行数据库迁移，无需手动初始化。

## Docker Compose 配置

`backend/victor-ab/docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: victor_experiment
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## 生产环境部署

生产环境建议：

1. 使用托管数据库服务 (RDS、Cloud SQL)
2. Redis 使用集群模式或托管服务 (ElastiCache、Memorystore)
3. 应用容器化后使用 Kubernetes 部署
4. 配置定期备份策略

## 常见问题

### MySQL 连接超时

检查 MySQL 是否完全启动：
```bash
docker-compose logs mysql | grep "ready for connections"
```

### 端口冲突

确保本地 3306、6379 端口未被占用：
```bash
lsof -i :3306
lsof -i :6379
```