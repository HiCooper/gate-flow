# 项目知识库（面向 Agent 设计）

本目录（`docs/knowledge/`）是项目的**增量式知识库**，专为 AI Coding Agent（如 Claude Code）设计。它存储代码本身无法表达的上下文：业务规则、技术决策、开发规范、排坑记录和已验证的模式。

## Agent 加载策略

**禁止一次性读取所有文件。** 知识库按主题分目录组织，支持按需渐进加载。

请严格按以下顺序查找：

1. **先读本 README** — 它包含全部知识文件的目录索引。
2. **按关键词匹配** — 根据当前任务，在下方的 Catalog 表中定位相关文件。
3. **优先读前置依赖** — 如果某文档标注了 `前置依赖`，请先读完依赖文档。
4. **按需跟随 Related 链接** — 仅在任务需要更广泛上下文时，才链式读取关联文档。

## 目录结构

知识按主题分组在编号子目录中。Agent 可通过目录名快速定位：

```
docs/knowledge/
├── 01-project-overview/     # 项目目标、高层架构、术语表
├── 02-business-domain/      # 业务规则、业务术语、运营逻辑
├── 03-development-guide/    # 环境搭建、编码规范、项目约定
├── 04-best-practices/       # 已验证模式、性能技巧、设计准则
├── 05-historical-lessons/   # 事故复盘、踩坑记录、已废弃决策
├── 06-api-reference/        # API 契约、接入说明、外部服务文档
├── 07-test-rule/            # 测试规范、用例设计、质量门禁规则
└── 08-externel-resources/   # 外部链接、参考资料、第三方文档
```

## 目录索引（Catalog）

| 路径 | 主题 | 何时加载 |
|------|------|----------|
| `01-project-overview/GateFlow_产品方案_纯净版.md` | 产品方案 | 理解产品定位、功能边界、用户角色时 |
| `01-project-overview/native-sdk-architecture.md` | Native SDK 架构 | 理解 iOS/Android SDK 设计模式时 |
| `04-best-practices/WINDOWS_COMMANDS.md` | Windows 命令 | Windows 环境下项目操作参考 |
| `07-test-rule/E2E_TESTING_GUIDE.md` | E2E 测试 | 编写或调试端到端测试时 |
| `05-historical-lessons/2026-05-07_swift-macos-runtime-crash.md` | Swift macOS 崩溃 | 在 macOS 上跑 Swift 单元测试时 |
| `06-api-reference/expo-gateflow-api.md` | Expo SDK API | React Native 集成 GateFlow 时 |
| `07-test-rule/SDK_TEST_PROGRESS.md` | SDK 测试进展 | 在另一台机器上继续 SDK 测试时 |

> **当前状态：** 4/8 目录已有文档，4 个目录为空。新增 `.md` 文件后，请在上表注册。

## 如何新增知识条目

创建新文档时，请遵循以下规范：

1. **放入对应子目录** — 按主题匹配，不按序号顺序。
2. **文件名使用 kebab-case** — 例如 `traffic-bucketing-rules.md`。
3. **决策/复盘类文件加日期前缀** — 例如 `2026-05-07_why-kafka.md`。
4. **更新本 Catalog** — 注册精确相对路径和触发条件。

## 文档格式模板

每篇知识文档必须包含以下头信息，方便 Agent 在几秒内判断是否需要深入阅读：

```markdown
# 标题

**类型：** [决策 | 规范 | 业务规则 | 排坑记录 | 操作指南 | 参考]
**范围：** [前端 | 后端 | 基础设施 | 全局 | 模块名]
**前置依赖：** [无 | 路径/到/依赖文档.md]
**最后更新：** YYYY-MM-DD

## 摘要（TL;DR）

1-2 句话概括核心结论。Agent 先读此处，决定是否继续阅读全文。

## 背景

本文档要解决什么问题？消除什么歧义或风险？

## 详情

核心知识本身。优先使用 bullet points 和具体示例，减少大段叙述。

## 可执行规则

Agent 可直接应用的显式规则：
- **应该：** ...
- **禁止：** ...

## 后果

忽略或违反本文档知识会导致什么问题。

## 关联文档

- [主题名](路径/到/文件.md) — 关联原因
- `src/路径/到/相关/代码.ts` — 实现该知识的代码位置
```

## 设计原则

- **可搜索** — 文件名和标题应包含 Agent 可能使用的关键词。
- **原子化** — 一篇文档只讲一个主题。Agent 加载小而聚焦的文档，远快于加载大部头。
- **可链接** — 用「关联文档」和「前置依赖」构建知识网络，而非堆砌文档。
- **带日期** — 必须填写「最后更新」。Agent 应更信任日期较新的文件。
