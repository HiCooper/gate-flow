# GateFlow - A/B 测试实验平台

<div align="center">

![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.0-brightgreen)
![Maven](https://img.shields.io/badge/Maven-3.x-blue)
![pnpm](https://img.shields.io/badge/pnpm-9+-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

**企业级 A/B 测试实验平台 - 从实验创建到决策归档的一站式解决方案**

[特性](#-特性) • [架构](#-系统架构) • [快速开始](#-快速开始) • [文档](#-文档) • [贡献](#-贡献指南)

</div>

---

## 📖 项目简介

GateFlow 是一个功能完整的企业级 A/B 测试实验平台，提供实验管理、流量分配、数据统计分析等核心能力。系统采用前后端分离架构，支持多层实验、正交分桶、实时数据分析和统计显著性检验。

### 核心价值

- 🎯 **降低实验门槛**: 非技术用户也能自助创建、运行、分析实验
- 🛡️ **保障实验质量**: 内置SRM校验、统计功效计算、护栏监控等质量门禁
- ⚡ **提升决策效率**: 自动化报告生成、智能决策建议、一键全量/回滚
- 📚 **沉淀实验知识**: 实验知识库、经验复用、组织级实验文化积累

---

## ✨ 核心特性

### 实验管理
- ✅ 完整的实验生命周期管理（草稿→审批→灰度→运行→分析→决策→归档）
- ✅ 多层实验（Layer）和正交分桶支持
- ✅ 实验状态管理和版本控制
- ✅ 实验ID自动生成和管理

### 流量分配
- ✅ 基于 MurmurHash3 的一致性哈希分桶算法
- ✅ 支持多层实验流量隔离和正交性保证
- ✅ 白名单和黑名单机制
- ✅ 可视化流量地图和冲突检测

### 数据分析
- ✅ Z-Test 显著性检验
- ✅ mSPRT 序贯检验（支持早停）
- ✅ CUPED 方差缩减技术
- ✅ BH 多重检验校正
- ✅ A/A 测试验证
- ✅ 时间序列分析和人群拆分

### 实时监控
- ✅ Kafka事件流处理
- ✅ ClickHouse实时数据分析
- ✅ 护栏指标自动告警
- ✅ 样本量追踪和统计功效预估

### 权限与协作
- ✅ RBAC + ABAC 混合权限模型
- ✅ 多级审批流程配置
- ✅ 操作审计和合规记录
- ✅ 团队协作和知识沉淀

---

## 🏗️ 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GateFlow 平台架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  前端应用层       │         │  管理控制台        │                  │
│  │                  │         │                  │                  │
│  │ • Admin Console  │◄───────►│ • 实验管理        │                  │
│  │ • Marketing Site │         │ • 流量配置        │                  │
│  └──────────────────┘         │ • 数据分析        │                  │
│                               │ • 知识库          │                  │
│                               └──────────────────┘                  │
│                                        │                             │
│                                        ▼                             │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    后端服务层 (Victor)                     │      │
│  ├──────────────┬──────────────┬──────────────┬─────────────┤      │
│  │  Web API     │  Service     │  Bucketing   │  Stats      │      │
│  │  (REST)      │  (Business)  │  (Engine)    │  (Analysis) │      │
│  └──────────────┴──────────────┴──────────────┴─────────────┘      │
│                                        │                             │
│                                        ▼                             │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    基础设施层                              │      │
│  ├──────────┬──────────┬──────────┬──────────┬─────────────┤      │
│  │  MySQL   │  Redis   │  Kafka   │ClickHouse│  SDK/API    │      │
│  └──────────┴──────────┴──────────┴──────────┴─────────────┘      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 技术栈

#### 前端技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 18, TypeScript 5.6 |
| **构建工具** | Vite 5.4 |
| **状态管理** | Zustand 4.5 |
| **路由** | React Router 6.26 |
| **UI组件** | Lucide React, Recharts |
| **样式** | TailwindCSS 4.0 |
| **拖拽** | @dnd-kit/core |
| **包管理** | pnpm 9+ (Monorepo) |

#### 后端技术栈

| 类别 | 技术 |
|------|------|
| **后端框架** | Spring Boot 3.4.0, Java 17 |
| **ORM框架** | MyBatis-Plus 3.5.15 |
| **数据库** | MySQL 8.0, Redis 7, ClickHouse |
| **消息队列** | Apache Kafka |
| **缓存** | Caffeine (本地), Redis (分布式) |
| **数据迁移** | Flyway 9.5.1 |
| **HTTP客户端** | OkHttp 4.12.0 |
| **JSON处理** | Jackson 2.17.0 |
| **API文档** | SpringDoc OpenAPI 2.5.0 |
| **构建工具** | Maven 3.x |
| **容器化** | Docker, Docker Compose |

### 模块结构

#### 前端 Monorepo

```
apps/
├── admin/                    # AB实验管理控制台
│   ├── src/
│   │   ├── api/               # API接口定义
│   │   ├── components/        # React组件
│   │   ├── layouts/           # 布局组件
│   │   ├── pages/             # 页面组件
│   │   ├── stores/            # Zustand状态管理
│   │   └── mocks/             # Mock数据
│   └── package.json
│
├── marketing/          # 营销展示页面
│   ├── src/
│   │   ├── components/        # 营销组件
│   │   ├── layouts/           # 布局
│   │   └── pages/             # 营销页面
│   └── package.json
│
packages/
└── shared/                     # 共享组件库
    ├── src/
    │   ├── components/        # 通用UI组件
    │   ├── hooks/             # 自定义Hooks
    │   ├── tokens/            # 设计令牌（颜色、间距等）
    │   └── utils/             # 工具函数
    └── package.json
```

#### 后端微服务

```
backend/victor-ab/
├── victor-common/              # 公共模块：常量、枚举、工具类、分桶引擎
├── victor-domain/              # 领域模型：实体、DTO、事件
├── victor-service/             # 业务服务：实验管理、Kafka管道、ClickHouse、统计引擎
│   └── src/main/resources/db/migration/  # Flyway 迁移脚本
├── victor-sdk/                 # 客户端SDK：Java SDK
├── victor-starter/             # Web层：REST API控制器、Spring Boot入口、安全配置
└── scripts/                    # 数据库脚本
    ├── seed/                   # 种子数据
    ├── maintenance/            # 运维脚本
    └── examples/               # 示例脚本
```

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18
- **pnpm** >= 9
- **JDK** >= 17
- **Maven** >= 3.6
- **Docker & Docker Compose** (可选，用于容器化部署)

### 方式一：本地开发环境

#### 1. 克隆项目

```bash
git clone <repository-url>
cd gate-flow
```

#### 2. 启动前端应用

```bash
# 安装依赖
pnpm install

# 启动所有前端应用（并行）
pnpm dev

# 或单独启动
pnpm dev:admin      # 启动管理控制台
pnpm dev:marketing  # 启动营销页面

# 启动文档网站
pnpm docs:dev       # 启动文档开发服务器
```

前端应用地址：
- Admin Console: http://localhost:5173
- Marketing Site: http://localhost:5174

#### 3. 启动后端服务

```bash
cd backend/victor-ab

# 启动依赖服务（MySQL, Redis）
docker-compose up -d mysql redis

# 编译项目
mvn clean install

# 启动应用
cd victor-starter
mvn spring-boot:run
```

后端服务地址：
- API服务: http://localhost:8080
- Swagger文档: http://localhost:8080/swagger-ui.html
- 健康检查: http://localhost:8080/actuator/health

### 方式二：Docker 部署

#### 1. 构建并启动所有服务

```bash
cd backend/victor-ab

# 构建后端镜像
docker build -t victor-service .

# 启动所有服务（MySQL, Redis, Victor Service）
docker-compose up -d
```

#### 2. 查看日志

```bash
docker-compose logs -f victor-service
```

---

## 📚 文档

### 文档网站 (推荐)

GateFlow 提供基于 VitePress 构建的文档网站，面向产品和技术两类用户:

- **📘 产品指南**: [https://your-docs-site/guide/](docs/docs-site/guide/) - 面向产品经理、运营人员
- **💻 技术文档**: [https://your-docs-site/dev/](docs/docs-site/dev/) - 面向开发工程师
- **📚 内部知识**: [https://your-docs-site/knowledge/](docs/docs-site/knowledge/) - 团队共享知识

本地启动文档网站:
```bash
pnpm docs:dev     # 启动文档开发服务器
pnpm docs:build   # 构建生产版本
```

### 原始文档

- **[AB实验平台设计方案](docs/ab/ab_experiment_platform_design.md)** - 完整的平台设计和架构说明
- **[系统架构设计](docs/ab/ab_experiment_system_architecture.html)** - 技术架构详解
- **[客户端 SDK 架构](docs/native-sdk-architecture-plan.md)** - iOS/Android SDK 架构设计
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - 如何贡献代码和文档
- **[CHANGELOG.md](CHANGELOG.md)** - 版本变更记录

### 知识库

项目采用面向 Agent 设计的知识库系统，位于 [`docs/knowledge/`](docs/knowledge/)：

- **01-project-overview/** - 项目目标、高层架构、术语表
- **02-business-domain/** - 业务规则、业务术语、运营逻辑
- **03-development-guide/** - 环境搭建、编码规范、项目约定
- **04-best-practices/** - 已验证模式、性能技巧、设计准则
- **05-historical-lessons/** - 事故复盘、踩坑记录、已废弃决策
- **06-api-reference/** - API 契约、接入说明、外部服务文档
- **07-test-rule/** - 测试规范、用例设计、质量门禁规则
- **08-externel-resources/** - 外部链接、参考资料、第三方文档

详见 [知识库 README](docs/knowledge/README.md)

### API 文档

启动后端服务后访问 Swagger UI：

```
http://localhost:8080/swagger-ui.html
```

#### 主要 API 接口

##### 实验管理
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/experiments` | 创建实验 |
| GET | `/api/experiments` | 查询实验列表 |
| GET | `/api/experiments/{id}` | 获取实验详情 |
| PUT | `/api/experiments/{id}` | 更新实验 |
| DELETE | `/api/experiments/{id}` | 删除实验 |
| POST | `/api/experiments/{id}/start` | 启动实验 |
| POST | `/api/experiments/{id}/stop` | 停止实验 |

##### 流量分配
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/bucketing/assign` | 用户分桶 |
| GET | `/api/bucketing/statistics` | 分桶统计 |

##### 统计分析
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/experiments/{id}/statistics` | 实验统计数据 |
| GET | `/api/experiments/{id}/metrics` | 实验指标数据 |
| GET | `/api/experiments/{id}/aa-test` | A/A 测试结果 |

更多接口请参考 Swagger 文档。

---

## 🔧 配置说明

### 前端配置

环境变量文件位于各应用的根目录：
- `apps/admin/.env.development`
- `apps/marketing/.env.development`

### 后端配置

主要配置文件：`backend/victor-ab/victor-starter/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/victor_experiment
    username: root
    password: victor123
  data:
    redis:
      host: localhost
      port: 6379

server:
  port: 8080
```

支持通过环境变量覆盖配置：

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/victor_experiment
export SPRING_DATA_REDIS_HOST=redis
```

---

## 🧪 测试

### 前端测试

```bash
# 类型检查
pnpm typecheck

# Lint检查
pnpm lint
```

### 后端测试

```bash
cd backend/victor-ab

# 运行所有测试
mvn test

# 运行特定模块测试
mvn test -pl victor-common      # 分桶引擎和工具类测试
mvn test -pl victor-service     # 业务服务、统计算法测试
mvn test -pl victor-starter     # Web层测试
```

---

## 📦 客户端 SDK

### Maven 依赖

```xml
<dependency>
    <groupId>com.gateflow</groupId>
    <artifactId>victor-sdk</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

### 使用示例

```java
import com.gateflow.victor.sdk.VictorClient;
import com.gateflow.victor.sdk.VictorConfig;

// 创建客户端
VictorConfig config = VictorConfig.builder()
    .baseUrl("http://localhost:8080")
    .apiKey("your-api-key")
    .build();

VictorClient client = new VictorClient(config);

// 获取用户分桶结果
BucketingResponse response = client.assignBucket(
    BucketingRequest.builder()
        .userId("user_123")
        .experimentId("exp_001")
        .build()
);

System.out.println("Assigned variant: " + response.getVariantKey());
```

---

## 🛠️ 开发指南

### 代码规范

#### 前端
- 遵循 TypeScript 最佳实践
- 使用函数式组件和 Hooks
- 组件命名采用 PascalCase
- 文件命名采用 kebab-case

#### 后端
- 遵循阿里巴巴 Java 开发手册
- 使用 Lombok 简化代码
- 使用 MapStruct 进行对象映射
- 统一异常处理

### 分支策略

- `main`: 主分支，生产环境代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具链
```

---

## 🐛 故障排查

### 常见问题

#### 1. 前端依赖安装失败

```bash
# 清除缓存重新安装
pnpm store prune
rm -rf node_modules
pnpm install
```

#### 2. 数据库连接失败

```bash
# 检查 MySQL 是否启动
docker ps | grep mysql

# 查看日志
docker logs victor-mysql
```

#### 3. Redis 连接失败

```bash
# 检查 Redis 是否启动
docker ps | grep redis

# 测试连接
docker exec -it victor-redis redis-cli ping
```

#### 4. 端口冲突

修改相应配置文件中的端口设置。

---

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献前请阅读

- [项目开发指南](docs/knowledge/03-development-guide/)
- [最佳实践](docs/knowledge/04-best-practices/)
- [测试规范](docs/knowledge/07-test-rule/)

---

## 📮 联系方式

- **项目主页**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **邮箱**: support@gateflow.com

---

## 🙏 致谢

感谢所有为 GateFlow 项目做出贡献的开发者和社区成员！

---

<div align="center">

**Made with ❤️ by Gateflow Team**

[⬆ 回到顶部](#gateflow---ab-测试实验平台)

</div>
