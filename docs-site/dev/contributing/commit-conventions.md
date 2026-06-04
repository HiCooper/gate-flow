# 提交规范

本文档介绍 Git 提交信息的规范格式。

## 提交格式

```
<type>: <subject>

[optional body]

[optional footer]
```

### Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat: 添加实验克隆功能 |
| fix | 修复 bug | fix: 修复分桶引擎空指针异常 |
| docs | 文档更新 | docs: 更新数据模型文档 |
| style | 代码格式 | style: 格式化代码 |
| refactor | 重构 | refactor: 简化 Service 层 |
| perf | 性能优化 | perf: 优化查询性能 |
| test | 测试相关 | test: 添加分桶引擎测试 |
| chore | 构建/工具链 | chore: 升级 Maven 依赖 |

### 示例

```bash
# 功能提交
git commit -m "feat: 添加实验版本管理功能"

# Bug 修复
git commit -m "fix: 修复用户分桶记录查询超时问题

修复当用户分配记录超过100万条时查询缓慢的问题，
通过添加索引优化查询性能。"

# 文档更新
git commit -m "docs: 更新本地开发环境配置文档"
```

## 提交规范优势

- 清晰的历史记录
- 自动生成 CHANGELOG
- 便于 code review
- 支持语义化版本控制