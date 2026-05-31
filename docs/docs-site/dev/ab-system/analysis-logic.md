# 实验分析逻辑

本文档描述 AB 实验的行为指标分析链路：如何将分流数据与页面行为数据关联，按实验分桶计算对比指标。

## 核心思路

实验分析的关键问题是：**用户被分到哪个桶 → 用户做了什么行为**。

两个独立系统各自记录一半信息：

| 系统 | 记录内容 | ClickHouse 表 |
|------|---------|--------------|
| AB 分流系统 | userId → 实验ID + bucket_id | `victor.events` |
| 页面行为系统 (tracker) | userId → page_view / click 等行为 | `gateflow_tracker.events` |

**`userId` 是连接两边的唯一桥梁**。分析时通过 userId 将分流结果与行为数据关联，即可按分桶统计行为指标。

## 分析步骤

### 第一步：确定基础用户集合

从页面行为日志中，筛选出在分析周期内访问过实验所在页面的全部用户。

```
SELECT DISTINCT user_id
FROM gateflow_tracker.events
WHERE event_type = 'page_view'
  AND page_url = '/experiment-page'
  AND toDate(toDateTime(timestamp / 1000)) BETWEEN '2026-05-30' AND '2026-05-30'
```

这批用户是实验的**基础流量池**，后续渗透率计算以此集合作为分母。

### 第二步：查询用户的分桶归属

实验分流结果具有稳定性——只要实验配置不变，同一用户多次访问会命中相同的桶。从分流日志中获取每个用户的 bucket_id：

```
SELECT user_id, buckets[1] AS bucket
FROM victor.events
WHERE has(exp_ids, 'exp_001')
  AND toDate(timestamp) BETWEEN '2026-05-30' AND '2026-05-30'
GROUP BY user_id, bucket
```

### 第三步：按分桶分组关联行为

将分桶结果与行为数据按 userId JOIN，分组统计：

```
WITH
assignment AS (
    SELECT user_id, buckets[1] AS bucket
    FROM victor.events
    WHERE has(exp_ids, 'exp_001')
      AND toDate(timestamp) BETWEEN '2026-05-30' AND '2026-05-30'
    GROUP BY user_id, bucket
),
page_view AS (
    SELECT user_id, count() AS pv
    FROM gateflow_tracker.events
    WHERE event_type = 'page_view'
      AND toDate(toDateTime(timestamp / 1000)) BETWEEN '2026-05-30' AND '2026-05-30'
    GROUP BY user_id
),
click AS (
    SELECT user_id, count() AS pv
    FROM gateflow_tracker.events
    WHERE event_type = 'click'
      AND toDate(toDateTime(timestamp / 1000)) BETWEEN '2026-05-30' AND '2026-05-30'
    GROUP BY user_id
)
SELECT
    a.bucket,
    count(DISTINCT a.user_id)                              AS assignment_uv,
    count(DISTINCT p.user_id)                              AS exposure_uv,
    coalesce(sum(p.pv), 0)                                 AS exposure_pv,
    count(DISTINCT c.user_id)                              AS click_uv,
    coalesce(sum(c.pv), 0)                                 AS click_pv
FROM assignment a
LEFT JOIN page_view p ON a.user_id = p.user_id
LEFT JOIN click c     ON a.user_id = c.user_id
GROUP BY a.bucket
```

### 第四步：计算对比指标

基于分组结果，计算各分桶的对比指标。

## 指标定义

| 指标 | 计算方式 | 说明 |
|------|---------|------|
| **分流 UV** (assignment_uv) | `count(DISTINCT user_id) FROM assignment` | 被分入该桶的去重用户数 |
| **曝光 UV** (exposure_uv) | `count(DISTINCT user_id) FROM assignment JOIN page_view` | 分入该桶且产生过 page_view 的用户数 |
| **曝光 PV** (exposure_pv) | `sum(page_view.pv)` | 该桶用户的 page_view 总量 |
| **点击 UV** (click_uv) | `count(DISTINCT user_id) FROM assignment JOIN click` | 分入该桶且产生过点击的用户数 |
| **点击 PV** (click_pv) | `sum(click.pv)` | 该桶用户的点击总量 |
| **曝光渗透率** | 曝光 UV / 页面总访客 UV × 100% | 该桶曝光用户在整个实验页面的渗透占比 |

### 曝光渗透率详解

渗透率衡量的是实验变体在页面流量中的覆盖程度：

```
渗透率 = 分桶X的曝光UV / 页面A的总访客UV
```

- 分子：被分入该桶，且成功产生 page_view 事件的用户数
- 分母：所有访问过该页面的用户数（不限于实验参与用户）

**示例**：页面A一天有 1000 个访客，其中 300 人被分入对照组（bucket A），240 人产生了曝光。那么：

```
对照组曝光渗透率 = 240 / 1000 = 24%
```

## 与 SRM 检验的区别

| | SRM 检验 | 行为分析 |
|---|---|---|
| 比较对象 | 各桶的实际分流比例 vs 预期比例 | 各桶之间的行为指标 |
| 数据源 | 仅 victor.events | victor.events + gateflow_tracker.events |
| 目的 | 验证分流是否均匀 | 评估变体效果 |
| 执行时机 | 每次分析必做 | 按需查询 |

## 实现位置

上述分析逻辑实现在 `MetricsRepository.queryBehaviorMetrics()` 方法中，被 `ExperimentReportService` 调用生成实验报告。
