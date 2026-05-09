# 开发环境搭建

本文档指导你如何搭建 GateFlow 的开发环境。

## 前置要求

- Node.js >= 18
- pnpm >= 9
- JDK >= 17
- Maven >= 3.6
- Docker & Docker Compose (可选)

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd gate-flow
```

### 2. 安装前端依赖

```bash
pnpm install
```

### 3. 启动前端应用

```bash
pnpm dev          # 启动所有前端应用
pnpm dev:admin    # 仅启动管理控制台
pnpm dev:marketing # 仅启动营销站点
```

### 4. 启动后端服务

```bash
cd backend/victor-ab
docker-compose up -d mysql redis
mvn clean install
cd victor-web && mvn spring-boot:run
```

## 详细文档

- [本地开发](/dev/getting-started/local-setup) - 详细的本地开发配置
- [Docker 部署](/dev/getting-started/docker-setup) - 使用 Docker Compose 部署
