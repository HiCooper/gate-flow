# 实验生命周期

本文档介绍实验从创建到归档的完整生命周期。

## 状态流转

```mermaid
stateDiagram-v2
    [*] --> Draft: 创建实验
    Draft --> PendingReview: 提交审批
    PendingReview --> Draft: 驳回
    PendingReview --> Running: 审批通过
    Running --> Analyzing: 实验结束
    Analyzing --> Decided: 做出决策
    Decided --> RolledOut: 全量获胜方案
    Decided --> RolledBack: 回滚
    Decided --> Archived: 存档
    RolledOut --> [*]
    RolledBack --> [*]
    Archived --> [*]
```

## 状态说明

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| Draft | 草稿状态 | 编辑、删除、提交审批 |
| PendingReview | 等待审批 | 撤回 |
| Running | 运行中 | 停止、查看数据 |
| Analyzing | 分析中 | 查看报告、做出决策 |
| Decided | 已决策 | 全量、回滚、存档 |
