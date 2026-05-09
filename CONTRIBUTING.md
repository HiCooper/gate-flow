# Contributing to GateFlow

欢迎为 GateFlow 贡献代码和文档!

## 如何开始

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'feat: add your feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 开启 Pull Request

## 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具链
```

## 开发环境

### 前端

```bash
pnpm install
pnpm dev          # 启动所有前端应用
pnpm dev:admin    # 仅启动管理控制台
```

### 后端

```bash
cd backend/victor-ab
docker-compose up -d mysql redis
mvn clean install
cd victor-web && mvn spring-boot:run
```

### 文档

```bash
pnpm docs:dev     # 启动文档网站
pnpm docs:build   # 构建文档
```

## 文档贡献

文档网站位于 `docs/docs-site/`,使用 VitePress 构建。

- 产品指南: `docs/docs-site/guide/`
- 技术文档: `docs/docs-site/dev/`
- 内部知识: `docs/docs-site/knowledge/`

详见 [文档贡献指南](docs/docs-site/dev/contributing/)。

## Code of Conduct

请保持友好和专业的交流态度。
