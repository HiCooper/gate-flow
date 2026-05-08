# DS Platform v2.0 重构计划

## 目标
基于大厂 DS（数据科学家）岗位职责分析，重构 DS Platform 为专业的实验分析工具平台。

## 核心模块

### 1. 实验概览 (Experiments)
- 全量实验列表，支持状态筛选、搜索
- 实验卡片展示：名称、状态、时间、关键指标预览
- 快速导航到详情/监控

### 2. 实验详情 (Experiment Detail)
- 分流配置展示（各变体流量比例）
- **SRM 检验**（样本比例不匹配检测 + 卡方检验 p-value）
- 核心统计结果（转化率、p-value、置信区间）
- Guardrail 指标监控
- 多维度数据拆分（可选）

### 3. 实时监控 (Real-time Monitor)
- 流量趋势图（小时级）
- 事件趋势图
- 各变体实时对比
- 数据延迟提示

### 4. 分流诊断 (Traffic Diagnosis)
- **SRM 实时检测**：自动检测分流是否均匀
- **异常告警**：检测到异常时高亮提醒
- **历史对比**：与历史实验的分流情况对比
- **根因分析提示**：可能的 SRM 原因

### 5. 报告中心 (Reports)
- 报告列表（按实验、时间筛选）
- 报告详情页（完整统计分析）
- 导出功能

### 6. 数据排查 (Troubleshooting)
- T+1 任务执行状态
- 失败原因详细日志
- 数据完整性检查

## 实现步骤

### Phase 1: 数据层 & API
1. 更新 TypeScript 类型定义（Experiment, SRMResult, MetricResult）
2. 创建 Experiment API（列表、详情）
3. 创建 Metrics API（SRM 检验、实时指标）
4. 创建 Report API（报告列表、详情）

### Phase 2: 页面组件
1. **ExperimentsPage** - 实验列表页
2. **ExperimentDetailPage** - 实验详情页（含 SRM 检验）
3. **TrafficDiagnosisPage** - 分流诊断页
4. **ReportsPage** - 报告中心页
5. 更新 **RealtimeMonitorPage** - 增强趋势图
6. 更新 **OfflineJobsPage** - 数据排查

### Phase 3: UI/UX 优化
1. 统一导航结构
2. 数据可视化（趋势图、柱状图）
3. 告警样式（SRM 异常高亮）
4. 响应式布局

### Phase 4: Mock 数据 & 测试
1. 完善 Mock 数据（模拟真实场景）
2. E2E 测试验证
3. 截图记录

## 文件结构
```
apps/ds-platform/src/
├── pages/
│   ├── Experiments.tsx        # 实验概览
│   ├── ExperimentDetail.tsx   # 实验详情 + SRM
│   ├── TrafficDiagnosis.tsx    # 分流诊断
│   ├── RealtimeMonitor.tsx     # 实时监控（更新）
│   ├── Reports.tsx            # 报告中心
│   └── Troubleshooting.tsx    # 数据排查（原 OfflineJobs）
├── api/
│   ├── experiment.ts         # 实验 API
│   ├── metrics.ts            # 指标 API
│   └── report.ts             # 报告 API
├── components/
│   ├── SRMIndicator.tsx      # SRM 检验组件
│   ├── MetricChart.tsx       # 指标趋势图
│   └── TrafficGauge.tsx      # 分流仪表盘
└── types/
    └── index.ts              # 类型定义
```
