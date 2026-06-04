# 链路追踪方案对比：EagleEye/ARMS vs Micrometer Tracing + Brave + Zipkin

本文档对比阿里鹰眼（EagleEye）/ ARMS 与当前采用的 Micrometer Tracing + Brave + Zipkin 两种分布式链路追踪方案。

## 方案概述

| 维度 | EagleEye → ARMS | Micrometer Tracing + Brave + Zipkin |
|------|----------------|-------------------------------------|
| 类型 | 商业云服务（SaaS） | 开源方案（自建） |
| 起源 | 阿里巴巴 2012 年内部系统，后演化为 ARMS | Google Dapper → Zipkin(2012) → Brave(2014) → Micrometer Tracing(2022) |
| 维护方 | 阿里云 | CNCF / Spring 社区 |
| 计费 | 按量付费（探针数 + Span 量） | 免费，自担基础设施与运维成本 |

## 架构差异

### EagleEye / ARMS

```
┌──────────── Application ────────────┐
│  ARMS Agent (JavaAgent 4.x)         │
│  ├─ 自动埋点（字节码增强）            │
│  ├─ 协议适配（W3C / EagleEye / B3）  │
│  └─ 采集上报                         │
└──────────────┬──────────────────────┘
               │ EagleEye Protocol
               ▼
┌────────── ARMS 服务端 ──────────────┐
│  ├─ Trace 聚合与存储                  │
│  ├─ 调用链查询 / 火焰图               │
│  ├─ 拓扑大图                         │
│  ├─ 慢 SQL / 线程分析                 │
│  └─ 告警                             │
└────────────────────────────────────┘
```

**特点：** Agent 在应用内完成所有工作（埋点、采样、上报），服务端负责存储和分析。应用代码零侵入。

### Micrometer Tracing + Brave + Zipkin

```
┌──────── Application ───────────┐
│  Micrometer Tracing (抽象层)    │
│  ├─ Brave (埋点实现)            │
│  ├─ Observation API (手动Span) │
│  └─ MDC 自动注入 traceId       │
└──────────────┬─────────────────┘
               │ W3C Trace Context / B3
               ▼
┌────────── Zipkin Server ───────┐
│  ├─ Span 接收与存储（MySQL/ES）  │
│  ├─ 调用链查询                   │
│  └─ 依赖图（有限）               │
└────────────────────────────────┘
```

**特点：** 应用内通过 Micrometer 生成 Span，Zipkin 只做存储和基本查询。功能边界清晰，各层可替换。

## 核心技术对比

### 1. 埋点方式

| | EagleEye / ARMS 4.x | Brave + Micrometer |
|---|---|---|
| 机制 | JavaAgent 字节码增强（无侵入） | 自动装配 + Observation API（少量侵入） |
| 覆盖范围 | Controller、RPC、MQ、DB、Redis、线程池 | Controller、JDBC、Redis、Kafka、@Scheduled |
| 自定义 Span | 需通过 ARMS API | `Observation.createNotStarted()` 一行代码 |
| 升级方式 | 替换 Agent jar 包 | 升级 Maven 依赖 |

**结论：** ARMS 字节码增强覆盖更广（线程池、异步调用自动透传），但 Micrometer 对 Spring Boot 技术栈的覆盖已经足够。

### 2. Trace 传播协议

| 协议 | EagleEye | Brave | 说明 |
|------|----------|-------|------|
| W3C Trace Context | ✅ v4.5+ 最高优先级 | ✅ 默认 | 国际标准，两者互通 |
| B3 (Zipkin) | ✅ 支持 | ✅ 原生 | Zipkin 原生协议 |
| EagleEye 私有协议 | ✅ v4.5 降为第二优先级 | ❌ 不支持 | 阿里内部协议，含 RpcId 树形结构 |
| Jaeger | ✅ 支持 | ❌ 不支持 | — |
| SkyWalking | ✅ 支持 | ❌ 不支持 | — |

**结论：** 两者通过 W3C Trace Context 协议可完全互通。EagleEye 私有协议仅在阿里内部中间件体系有优势。

### 3. TraceId 设计

**EagleEye：** 将时间戳、IP、进程号、服务类型编码进 traceId，可直接从 traceId 反推请求来源。

```
时间戳(20221018101040) + IP(11.15.148.83) + 进程号(14031) + 类型(e) + 递增数(0001)
```

**Brave/Zipkin：** 128-bit 随机十六进制字符串，与 Zipkin 生态完全兼容。

```
463ac35c9f6413ad48485a395acc51db
```

| | EagleEye | Brave/Zipkin |
|---|---|---|
| 排障效率 | 从 traceId 可快速定位来源机器和时间 | 需查询服务端才能获取上下文 |
| 协议标准化 | 非标准 | W3C Trace Context 标准 |
| 隐私风险 | traceId 泄露服务拓扑和 IP | 无信息泄露 |

**结论：** EagleEye 的 traceId 设计在紧急排障时更方便（告警群直接发 traceId 就能知道哪台机器几点出问题）。但 Brave 的随机 traceId 更标准化、无隐私风险。

### 4. 采样策略

| 策略 | ARMS | Brave + Micrometer |
|------|------|-------------------|
| 固定比例 | ✅ | ✅ |
| 错误全采样 | ✅ | ✅ |
| 慢调用全采样 | ✅ | 需手动实现 |
| 入口业务标签 | ✅ 按 URL/Header/参数 | 需手动实现 |
| 动态调整 | ✅ 控制台下发，无需重启 | ❌ 需重启应用 |
| 通道隔离 | ✅ Agent 独立上报通道 | ❌ 与应用共享网络 |

**结论：** ARMS 在采样策略的灵活性和动态调整上明显优于开源方案。

## 运维与成本

### 日常运维负担

| | ARMS | Zipkin 自建 |
|---|---|---|
| 部署 | 应用加 `-javaagent` 参数 | 加 Maven 依赖 + 部署 Zipkin Server |
| 存储 | 阿里云托管，自动过期 | 自维护 MySQL/ES，定期清理 |
| 升级 | 替换 Agent jar（阿里云推送） | 升级 Maven 依赖 + 重发布 |
| 监控告警 | 内置探针自监控 + 告警模板 | 需自建（Prometheus + Grafana） |
| 多语言 | Java/Go/Python 专用探针 + OTel 通用 | Micrometer 多语言绑定（不如 Java 成熟） |

### 成本估算

| 规模 | ARMS（按探针数 + Span 量） | Zipkin 自建 |
|------|--------------------------|------------|
| ≤ 3 个服务 | ~¥300-800/月 | 1 台 2C4G 服务器 ~¥100/月 + 运维人力 |
| 10 个服务 | ~¥1500-3000/月 | 2-3 台服务器 ~¥500/月 + 运维人力 |
| 50+ 服务 | ~¥8000+/月 | ES 集群 ~¥3000/月 + 专职运维 |

**结论：** 小规模下 Zipkin 自建更经济，规模越大 ARMS 的人力节省越显著。

## 优劣势总结

### EagleEye / ARMS 优势

1. **零代码侵入：** JavaAgent 字节码增强，服务代码完全不感知追踪逻辑
2. **端到端打通：** 深度集成阿里云 ALB/MSE/ASM/API Gateway，一键开启全链路
3. **高级诊断：** 慢 SQL 分析、线程剖析、CPU/内存热点，不只是"能看到调用链"
4. **动态采样与控制：** 采样策略无需重启即可调整，有独立上报通道不怕应用 OOM
5. **SLA 保障：** 商业服务有技术支持，生产故障可提工单

### EagleEye / ARMS 劣势

1. **厂商锁定：** 强依赖阿里云生态，迁移成本高
2. **持续付费：** 按量计费，规模越大成本越高
3. **黑盒探针：** Agent 内部逻辑不透明，出问题只能提工单
4. **协议历史包袱：** EagleEye 私有协议与开源标准不完全兼容（v4.x 改善中）
5. **非阿里云环境支持弱：** 其他云或自建机房接入体验不如阿里云原生

### Micrometer Tracing + Brave 优势

1. **完全开源：** 无厂商锁定，可自由定制和迁移
2. **零成本起步：** 不需要 Zipkin Server 即可在日志中看到 traceId
3. **标准协议：** W3C Trace Context 原生支持，与任何兼容系统互通
4. **Spring 原生：** Spring Boot 3.x 一等公民，配置即用
5. **架构灵活：** 底层可切换 Brave / OpenTelemetry，后端可切换 Zipkin / Jaeger / OTel Collector

### Micrometer Tracing + Brave 劣势

1. **需要 Zipkin Server：** 可视化查询需要单独部署和维护 Zipkin
2. **无高级诊断：** 只有调用链，没有慢 SQL 分析、线程剖析等能力
3. **采样不灵活：** 调整采样策略需修改配置并重启
4. **跨云组件无感知：** 无法自动串联云网关、负载均衡器的 Span
5. **运维需自主投入：** 存储、告警、升级都需要自己搞定

## 决策矩阵

| 场景 | 推荐方案 |
|------|----------|
| 业务部署在阿里云，团队 < 5 人 | **ARMS** — 开箱即用，省去运维成本 |
| 自建机房 / 多云 / 非阿里云 | **Micrometer + Brave + Zipkin** |
| Spring Boot 技术栈，团队有运维能力 | **Micrometer + Brave + Zipkin** |
| 需要慢 SQL / 线程分析等诊断能力 | **ARMS** |
| 预算有限，服务 < 5 个 | **Micrometer + Brave + Zipkin** |
| 已有 Prometheus/Grafana 体系 | **Micrometer + Brave + Zipkin**（可统一） |
| 未来可能迁移到 OpenTelemetry | **两者皆可** — 都在向 OTel 靠拢 |

## 与当前方案的兼容性

**两者通过 W3C Trace Context 互通，不会冲突。**

如果未来迁移到 ARMS，当前 Micrometer Tracing 的 Span 可以通过 W3C header 让 ARMS 探针识别并串联；反之 ARMS 生成的 traceId 也能被 Zipkin 接收。不需要推倒重来，只是**替换埋点层**，数据层通过标准协议互通。

如果要预留 ARMS 接入能力，当前只需确保：
- Spring Kafka 开启了 `observation-enabled: true`（已完成）
- 日志中打印了 `traceId`/`spanId`（已完成）
- 不使用 EagleEye 私有协议的 header（当前方案没有，天然满足）
