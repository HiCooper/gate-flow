# 服务访问入口

本文档列出 GateFlow 系统各个服务的访问入口和部署信息。

## 项目结构说明

GateFlow 采用 Git Submodule 结构:

| 组件 | 仓库 | 类型 |
|------|------|------|
| Admin Console | `HiCooper/superab-admin` | Git Submodule |
| Marketing Site | `HiCooper/superab-marketing` | Git Submodule |
| Backend Service | `HiCooper/victor-ab` | Git Submodule |
| ReadMore App | 本仓库 | 本地目录 |
| DS Platform | 本仓库 | 本地目录 |

```bash
# 初始化/更新所有 submodules
git submodule update --init --recursive
git submodule update --remote
```

## 前端应用

| 应用 | 说明 | 本地端口 | 仓库 |
|------|------|---------|------|
| **Admin Console** | 管理控制台,实验管理、流量配置、数据分析 | `http://localhost:3001` | `HiCooper/superab-admin` |
| **Marketing Site** | 营销站点,产品介绍、定价、文档 | `http://localhost:3000` | `HiCooper/superab-marketing` |
| **ReadMore** | 阅读增强应用 | 待配置 | 本仓库 `apps/readmore` |
| **DS Platform** | 数据科学分析平台 | 待配置 | 本仓库 `apps/ds-platform` |
| **Docs Site** | 本文档网站 | `http://localhost:5173` | 本仓库 `docs/docs-site` |

### 启动方式

```bash
# 克隆仓库后初始化 submodules
git submodule update --init --recursive

# 安装依赖
pnpm install

# 启动所有前端应用
pnpm dev

# 单独启动
pnpm dev:admin       # Admin Console (3001)
pnpm dev:marketing   # Marketing Site (3000)
pnpm dev:readmore   # ReadMore App
pnpm dev:ds         # DS Platform
pnpm docs:dev       # Docs Site (5173)
```

## 后端服务

| 服务 | 说明 | 本地端口 | 仓库 |
|------|------|---------|------|
| **Victor API** | 主后端服务 (Spring Boot) | `http://localhost:8081` | `HiCooper/victor-ab` |
| **Swagger UI** | API 交互式文档 | `http://localhost:8081/swagger-ui.html` | 同上 |
| **OpenAPI Spec** | OpenAPI JSON 规范 | `http://localhost:8081/v3/api-docs` | 同上 |
| **Health Check** | 健康检查端点 | `http://localhost:8081/actuator/health` | 同上 |
| **Auth (Login)** | JWT 登录获取 Token | `POST http://localhost:8081/api/v1/auth/login` | 同上 |
| **Auth (Register)** | 用户注册 | `POST http://localhost:8081/api/v1/auth/register` | 同上 |

### 启动方式

```bash
cd backend/victor-ab

# 初始化 submodule (首次)
git submodule update --init --recursive

# 启动依赖服务
docker-compose up -d mysql redis

# 编译项目
mvn clean install

# 启动后端
mvn spring-boot:run -pl victor-starter
```

## 基础设施

| 组件 | 说明 | 本地端口 | 配置 |
|------|------|---------|------|
| **MySQL** | 主数据库 (实验配置、用户数据) | `localhost:3306` | `victor_experiment` |
| **Redis** | 缓存服务 (配置缓存、会话) | `localhost:6379` | DB 0 |
| **Kafka** | 事件消息管道 (事件流处理) | `localhost:9092` | - |
| **ClickHouse** | 分析数据库 (实时指标聚合) | `localhost:8123` (HTTP) / `9000` (Native) | - |

### 启动方式

```bash
cd backend/victor-ab
docker-compose up -d mysql redis kafka clickhouse
```

## Git Submodule 工作流

```mermaid
flowchart TD
    A[克隆主仓库] --> B[初始化 Submodules]
    B --> C[git submodule update --init --recursive]
    C --> D[更新 Submodule 到最新]

    D --> E{选择更新策略}
    E -->|拉取默认分支| F[git submodule update]
    E -->|拉取远程最新| G[git submodule update --remote]
    E -->|切换分支| H[git submodule foreach git checkout]

    G --> I[提交 submodule 引用变更]
    I --> J[git add .gitmodules]
    I --> K[git add <submodule-path>]
    I --> L[git commit]
```

### 常用命令

```bash
# 查看 submodule 状态
git submodule status

# 更新所有 submodule 到远程最新
git submodule update --remote

# 在 submodule 中切换分支
cd <submodule-path>
git checkout <branch>
cd ..
git add <submodule-path>
git commit -m "chore: update submodule to <branch>"

# 推送 submodule 变更
cd <submodule-path>
git push
cd ..
git push
```

## SDK 集成点

| SDK | 类型 | 状态 | 配置地址 |
|-----|------|------|---------|
| Java SDK | 服务端 | 可用 | `/api/v1/config/latest` |
| Expo SDK | React Native | 可用 | 同上 |
| iOS SDK | iOS 原生 | 开发中 | 同上 |
| Android SDK | Android 原生 | 开发中 | 同上 |

## API 端点速查

| 分组 | 路径前缀 | 说明 |
|------|---------|------|
| 认证授权 | `/api/v1/auth` | JWT 登录/注册 |
| 实验管理 | `/api/v1/experiments` | 实验 CRUD、统计、版本 |
| 分层管理 | `/api/v1/layers` | 实验层级 |
| 分桶管理 | `/api/v1/buckets` | 分桶/变体配置 |
| 运行时分流 | `/api/v1/bucketing` | 实验分流请求 |
| 域管理 | `/api/v1/domains` | 业务域管理 |
| 配置获取 | `/api/v1/config` | SDK 配置拉取 |
| 事件上报 | `/api/v1/events` | 事件采集 |
| 分析报告 | `/api/v1/reports` | 统计分析报告 |
| Bandit 优化 | `/api/v1/bandit` | 多臂老虎机 |
| 贝叶斯分析 | `/api/v1/analysis` | 贝叶斯后验分析 |
| 功效分析 | `/api/v1/power-analysis` | 样本量估算 |
| 灰度推进 | `/api/v1/ramp` | 灰度自动调度 |
| 流量地图 | `/api/v1/traffic` | 流量可视化 |
| 白名单 | `/api/v1/whitelist` | 白名单管理 |
| RBAC | `/api/v1/rbac` | 角色权限管理 |
| 子群分析 | `/api/v1/subgroup-analysis` | 群组分层分析 |
| 指标查询 | `/api/v1/metrics` | 指标数据查询 |

## 部署信息

| 环境 | API 地址 | 前端地址 | 数据库 | 状态 |
|------|---------|---------|--------|------|
| **Local** | `localhost:8081` | `localhost:3001` | Docker Compose | 开发中 |
| **Staging** | 待配置 | 待配置 | 待配置 | 未部署 |
| **Production** | 待配置 | 待配置 | 待配置 | 未部署 |

## 相关链接

- [GitHub 仓库](https://github.com/HiCooper/gate-flow)
- [Admin Console 仓库](https://github.com/HiCooper/superab-admin)
- [Marketing 仓库](https://github.com/HiCooper/superab-marketing)
- [Backend 仓库](https://github.com/HiCooper/victor-ab)
- [CONTRIBUTING.md](/CONTRIBUTING.md)
- [CHANGELOG.md](/CHANGELOG.md)
