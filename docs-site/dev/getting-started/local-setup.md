# 本地开发

本文档详细介绍本地开发环境的配置步骤。

## 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18 | 前端开发环境 |
| pnpm | >= 9 | 包管理器 |
| JDK | >= 17 | 后端 Java 运行环境 |
| Maven | >= 3.6 | 后端构建工具 |
| Docker | >= 20 | 基础设施容器化 |

## 快速开始

### 1. 克隆代码库

```bash
git clone https://github.com/HiCooper/gate-flow.git
cd gate-flow

# 初始化子模块（如果需要）
git submodule update --init --recursive
```

### 2. 启动基础设施

```bash
cd backend/victor-ab
docker-compose up -d mysql redis
```

等待 MySQL 和 Redis 启动完成。

### 3. 启动后端

```bash
cd backend/victor-ab
mvn spring-boot:run -pl victor-starter
```

后端服务将在 `http://localhost:8081` 启动。

### 4. 启动前端

```bash
# 启动所有前端应用
pnpm dev

# 或启动单个应用
pnpm dev:admin    # 管理控制台 (port 3001)
pnpm dev:marketing # 营销站点 (port 3000)
```

## 环境变量配置

### 后端配置

数据库配置位于 `backend/victor-ab/victor-starter/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/victor_experiment
    username: root
    password: root
  redis:
    host: localhost
    port: 6379
```

### 前端配置

前端环境变量位于各应用的 `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

## 常用命令

### 后端

```bash
cd backend/victor-ab

# 构建
mvn clean package

# 运行测试
mvn test

# 运行单个模块测试
mvn test -pl victor-service
```

### 前端

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm typecheck

# 构建
pnpm build
```

## 验证安装

完成后可访问以下地址确认服务状态：

- Swagger UI: http://localhost:8081/swagger-ui.html
- 管理控制台: http://localhost:3001
- 营销站点: http://localhost:3000