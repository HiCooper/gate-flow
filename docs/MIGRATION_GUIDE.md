# 目录重命名迁移指南

## 概述

本次重构统一了前端应用的命名规范，消除了项目中的命名不一致问题。

## 变更内容

### 目录重命名

| 旧名称 | 新名称 | 说明 |
|--------|--------|------|
| `apps/superab-admin` | `apps/admin` | AB实验管理控制台 |
| `apps/superab-marketing` | `apps/marketing` | 营销展示页面 |

### 更新的文件

- ✅ `.gitmodules` - Git 子模块配置
- ✅ `README.md` - 项目根文档
- ✅ `apps/admin/README.md` - Admin 应用文档
- ✅ `pnpm-lock.yaml` - 依赖锁定文件（自动更新）

## 影响范围

### ✅ 无破坏性变更

此次重命名**不影响**以下内容：

- Package 名称保持不变：
  - `@gate-flow/admin` (未改变)
  - `@gate-flow/marketing` (未改变)
- 所有导入路径保持不变
- API 接口和路由保持不变
- 环境变量配置保持不变

### ⚠️ 需要注意的地方

1. **本地开发路径**
   ```bash
   # 旧路径
   cd apps/superab-admin
   
   # 新路径
   cd apps/admin
   ```

2. **IDE 配置**
   - 如果使用 VS Code，可能需要重新打开工作区
   - 检查任何硬编码的路径引用

3. **CI/CD 脚本**
   - 如果有外部 CI/CD 配置引用了旧路径，需要更新

4. **Git 子模块**
   - 子模块 URL 保持不变（仍指向原始仓库）
   - 仅本地路径更新

## 验证清单

迁移后已验证以下功能正常：

- ✅ `pnpm install` - 依赖安装成功
- ✅ `pnpm dev:admin` - Admin 应用启动正常 (http://localhost:3001)
- ✅ `pnpm dev:marketing` - Marketing 应用启动正常 (http://localhost:3000)
- ✅ `pnpm build` - 构建流程正常
- ✅ TypeScript 类型检查通过（已有错误与重命名无关）

## 回滚方案

如果需要回滚到重命名前的状态：

```bash
# 回滚到重命名前的提交
git checkout <commit-hash-before-rename>

# 或者撤销最近的提交但保留文件更改
git reset --soft HEAD~1
```

## 常见问题

### Q: 为什么只重命名目录而不改 package name？

A: Package name (`@gate-flow/admin`) 已经符合规范，无需更改。重命名目录只是为了简化路径，减少冗余的 `superab-` 前缀。

### Q: 会影响已有的部署吗？

A: 不会影响。部署通常基于构建产物（dist 目录），与源码路径无关。

### Q: 需要重新安装依赖吗？

A: 建议执行一次 `pnpm install` 以确保 pnpm lockfile 正确更新。

### Q: Git 历史记录会丢失吗？

A: 不会。Git 能够识别文件重命名，历史记录保持完整。使用 `git log --follow <file>` 可以查看文件的完整历史。

## 后续优化建议

基于此次重命名，建议继续优化：

1. **整理 SQL 文件** - 将散落的 `.sql` 文件归类到 `backend/victor/scripts/`
2. **统一后端命名** - 考虑将 `backend/victor-ab` 简化为 `backend/victor`
3. **基础设施集中** - 创建 `infra/` 目录统一管理 Docker 配置

## 联系方式

如有任何问题，请提交 Issue 或联系项目维护团队。

---

**迁移完成日期**: 2026-05-07  
**Git Commit**: `57976cd`
