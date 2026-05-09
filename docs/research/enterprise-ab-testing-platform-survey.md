# 大厂实验系统架构综合调研与 GateFlow 改进建议

**调研日期**: 2026-05-09  
**调研对象**: 字节跳动(DataTester)、阿里巴巴(PAI-ABTest)、腾讯(TAB)、火山引擎  
**对比基准**: GateFlow Victor 实验平台当前架构

---

## 一、大厂实验系统概览

### 1.1 字节跳动 DataTester / 火山引擎

**核心定位**: 大规模在线 A/B Testing 和智能调优平台

**解决的关键问题**:
- **超大规模并发实验**: 支持日均数百个实验同时运行，覆盖推荐、搜索、广告等核心场景
- **流量饥渴问题**: 通过正交分层 + 互斥设计，最大化流量利用率
- **归因准确性**: 严格的统计检验体系，防止错误决策造成业务损失
- **实验与工程集成**: 嵌入研发全流程，从实验设计到决策的闭环

**架构特点**:
```
流量接入 → 分流服务(Hash + Bucket) → 实验路由 → 数据采集 → 实时/离线计算 → 报表展示
                │                                              │
                └─ 1000个桶/层, 层间正交                          └─ Flink实时 + 离线T+1
```

**技术亮点**:
1. **正交分层模型**: 每层 1000 个桶，层间通过不同 Hash Salt 保证正交性
2. **实时计算**: Flink 流式计算，分钟级指标更新
3. **CUPED 方差缩减**: 利用实验前数据修正，减少 20-50% 所需样本量
4. **顺序检验**: 支持实验过程中的随时查看，控制假阳性率
5. **SDK 本地分流**: 配置下发后客户端本地计算，延迟 < 5ms

---

### 1.2 阿里巴巴 PAI-ABTest

**核心定位**: 专业的模型评测平台，侧重 AI/ML 模型效果对比

**解决的关键问题**:
- **模型迭代加速**: 为 LLM、搜索、推荐等模型提供快速在线评测
- **多场景适配**: 支持在线分流和离线抽样两种实验模式
- **人群定向**: 基于用户标识的精细化人群圈选和分层实验
- **跨服务权限治理**: 通过 SLR 实现跨云服务的权限隔离

**架构特点**:
```
Web配置界面 → Go/Java SDK → 中央路由服务器 → MaxCompute(原始日志) → Hologres(指标存储)
                                    │
                                    └─ 基于访问上下文的路由分发
```

**技术亮点**:
1. **上下文感知路由**: 根据请求上下文(用户特征、设备、场景)动态分流
2. **MaxCompute + Hologres 双引擎**: 原始事件走 MaxCompute 批处理，指标查询走 Hologres 实时 OLAP
3. **近实时指标**: 小时级和天级双通道计算
4. **参数化 Rollout**: 支持灰度发布的参数化配置和自动推进

---

### 1.3 腾讯 TAB (Tencent AB Test)

**核心定位**: 一站式 AB 实验平台，覆盖算法推荐场景效果评测

**解决的关键问题**:
- **复杂嵌套流量结构**: 业务域 + 实验层的嵌套正交设计
- **参数冲突治理**: 流量染色分析，可视化参数覆盖范围
- **配置发布稳定性**: 多策略保证配置中心更新的一致性
- **白名单实时性**: 白名单更新与主配置发布解耦

**架构特点**:
```
流量 → 域隔离 → 层路由(从外到内, 从上到下) → 实验命中 → 双端埋点 → 实时指标
         │              │                                      │
         └─ 用户群隔离    └─ 每层独立Hash                          └─ 服务端路由日志 + 客户端ACM串
```

**技术亮点**:
1. **分层分域嵌套架构**: 域解决用户群隔离，层解决正交实验，支持递归嵌套
2. **双端埋点对账**: 服务端路由日志 + 客户端 ACM 追踪串，格式 `版本.业务域.内容类型.资源位.实验.自定义值`
3. **Flink 实时计算**: 替代离线 T+1，实现分钟级指标
4. **流量染色可视化**: 树状结构展示复杂层-桶关系，避免参数冲突

---

## 二、核心能力横向对比

### 2.1 分流与流量管理

| 能力维度 | 字节 DataTester | 阿里 PAI-ABTest | 腾讯 TAB | GateFlow Victor |
|---------|:--------------:|:--------------:|:--------:|:--------------:|
| **分桶粒度** | 1000 桶/层 | 人群分组 | Hash 桶 | 10000 桶/层 |
| **正交分层** | ✓ 层间独立 Salt | ✓ 实验层正交 | ✓ 域+层嵌套 | ✓ 层间独立 Salt |
| **互斥实验** | ✓ 同层互斥 | ✓ 同层互斥 | ✓ 同层互斥 | ✓ 桶冲突检测 |
| **流量可视化** | ✓ 流量地图 | ✓ 流量管理 | ✓ 树状结构 | ✗ 待实现 |
| **动态流量调整** | ✓ 实时调整 | ✓ 参数化 Rollout | ✓ 灰度策略 | ✗ 静态配置 |
| **白名单机制** | ✓ 定向实验 | ✓ 人群圈选 | ✓ 实时白名单 | ✗ 待实现 |

**关键发现**:
1. **GateFlow 分桶粒度更精细**: 10000 桶优于字节的 1000 桶，流量控制精度更高
2. **缺少流量可视化工具**: 大厂都有流量地图/树状可视化工具，GateFlow 目前没有
3. **缺少动态灰度能力**: 大厂支持运行时动态调整流量比例，GateFlow 需要重新配置

---

### 2.2 统计与分析能力

| 能力维度 | 字节 DataTester | 阿里 PAI-ABTest | 腾讯 TAB | GateFlow Victor |
|---------|:--------------:|:--------------:|:--------:|:--------------:|
| **SRM 检验** | ✓ 卡方检验 | ✓ 流量校验 | ✓ 样本均衡 | ✓ 卡方检验 |
| **Z-Test** | ✓ 比例检验 | ✓ 假设检验 | ✓ 显著性检验 | ✓ 双样本 Z-Test |
| **CUPED** | ✓ 方差缩减 | ✗ | ✗ | ✓ 已实现 |
| **顺序检验** | ✓ mSPRT | ✗ | ✗ | ✓ mSPRT |
| **多重校正** | ✓ BH-FDR | ✓ Bonferroni | ✓ BH | ✓ BH-FDR |
| **贝叶斯方法** | ✓ 贝叶斯估计 | ✗ | ✗ | ✗ 待实现 |
| **多臂老虎机** | ✓ 自动调优 | ✗ | ✗ | ✗ 待实现 |
| **人群拆分分析** | ✓ 多维度下钻 | ✓ 人群对比 | ✓ 细分分析 | ✗ 待实现 |
| **实验功效计算** | ✓ 样本量预估 | ✓ 功效分析 | ✗ | ✗ 待实现 |

**关键发现**:
1. **GateFlow 统计能力已经很强**: SRM、Z-Test、CUPED、mSPRT、BH 都已实现，与字节处于同一梯队
2. **缺少贝叶斯方法**: 大厂逐步引入贝叶斯估计提供概率化解读（如"B 优于 A 的概率为 92%"）
3. **缺少自动调优**: 字节支持多臂老虎机自动分配流量给表现好的版本
4. **缺少实验功效计算**: 创建实验前无法预估所需样本量和运行时间

---

### 2.3 数据管道与实时计算

| 能力维度 | 字节 DataTester | 阿里 PAI-ABTest | 腾讯 TAB | GateFlow Victor |
|---------|:--------------:|:--------------:|:--------:|:--------------:|
| **事件采集** | ✓ SDK 上报 | ✓ MaxCompute | ✓ 双端埋点 | ✓ REST + Kafka |
| **消息队列** | ✓ Kafka | ✓ Kafka | ✓ Kafka | ✓ Kafka |
| **实时计算** | ✓ Flink | ✓ 小时级聚合 | ✓ Flink | ✗ Spring Scheduler |
| **OLAP 存储** | ✓ 自研 OLAP | ✓ Hologres | ✓ ClickHouse | ✓ ClickHouse |
| **分钟级指标** | ✓ 5 分钟 | ✓ 小时级 | ✓ 分钟级 | ✓ 60 秒聚合 |
| **离线 T+1** | ✓ 天级汇总 | ✓ 天级汇总 | ✓ 天级汇总 | ✓ 天级汇总 |
| **实时看板** | ✓ 秒级刷新 | ✓ 分钟级 | ✓ 分钟级 | ✗ 待实现前端 |

**关键发现**:
1. **GateFlow 聚合间隔已经很好**: 60 秒聚合优于阿里的小时级
2. **计算引擎差距**: 字节/腾讯使用 Flink 流式计算，GateFlow 使用 Spring Scheduler 定时任务
3. **OLAP 选型一致**: 都使用列式存储（ClickHouse/Hologres）做指标查询

---

### 2.4 实验生命周期与治理

| 能力维度 | 字节 DataTester | 阿里 PAI-ABTest | 腾讯 TAB | GateFlow Victor |
|---------|:--------------:|:--------------:|:--------:|:--------------:|
| **状态机** | ✓ 完整状态机 | ✓ 生命周期管理 | ✓ 实验流程 | ✓ 8 种状态 |
| **灰度发布** | ✓ 自动推进 | ✓ 参数化 Rollout | ✓ 灰度策略 | ✓ RAMP 阶段 |
| **审批流程** | ✓ 多级审批 | ✓ 审核备案 | ✓ 审批链 | ✓ 设计但未实现 |
| **权限控制** | ✓ 细粒度权限 | ✓ SLR 权限 | ✓ 角色权限 | ✓ RBAC+ABAC 设计 |
| **审计日志** | ✓ 全量审计 | ✓ 操作留痕 | ✓ 审计合规 | ✓ 设计但未实现 |
| **实验模板** | ✓ 模板市场 | ✓ 实验库 | ✗ | ✗ 待实现 |
| **知识库** | ✗ | ✗ | ✗ | ✓ 设计中 |

**关键发现**:
1. **GateFlow 设计理念先进**: RBAC+ABAC、知识库、实验模板等在文档中都有设计
2. **实现差距较大**: 审批流程、权限控制、审计日志等大部分停留在设计阶段，未落地
3. **知识库是差异化优势**: 大厂实验平台普遍缺少知识沉淀能力

---

### 2.5 SDK 与工程集成

| 能力维度 | 字节 DataTester | 阿里 PAI-ABTest | 腾讯 TAB | GateFlow Victor |
|---------|:--------------:|:--------------:|:--------:|:--------------:|
| **Java SDK** | ✓ 服务端 SDK | ✓ Go/Java SDK | ✓ Java SDK | ✓ 已实现 |
| **iOS SDK** | ✓ | ✓ | ✓ | ✗ 设计中 |
| **Android SDK** | ✓ | ✓ | ✓ | ✗ 设计中 |
| **React Native** | ✗ | ✗ | ✗ | ✓ expo-gateflow |
| **本地分流** | ✓ 客户端计算 | ✗ 服务端路由 | ✓ 客户端计算 | ✓ 本地计算 |
| **配置缓存** | ✓ 本地缓存 | ✓ 缓存 | ✓ 缓存 | ✓ Caffeine |
| **增量更新** | ✓ 版本比对 | ✓ 增量拉取 | ✓ 实时推送 | ✓ 版本检查 |
| **离线容灾** | ✓ 本地兜底 | ✗ | ✓ 本地兜底 | ✗ 待实现 |

**关键发现**:
1. **GateFlow Java SDK 设计优秀**: 本地 Caffeine 缓存 + 版本比对 + 纯 Java 分桶引擎
2. **移动端 SDK 缺失**: iOS/Android SDK 仅有设计文档，未实现
3. **缺少离线容灾**: SDK 在网络异常时缺少本地兜底策略

---

## 三、大厂实验系统解决的共性问题

### 3.1 流量效率问题

**问题**: 业务线多、实验多，但总流量有限

**大厂解决方案**:
1. **正交分层**（字节/腾讯/阿里均采用）: 不同层的实验互不影响，理论上可无限叠加
2. **互斥设计**: 同一层内实验互斥，保证归因准确性
3. **流量染色**（腾讯特色）: 可视化参数覆盖范围，避免隐式冲突
4. **动态扩缩容**（字节特色）: 根据实验优先级动态调整流量分配

**GateFlow 现状**:
- ✓ 已实现正交分层（不同层不同 Salt）
- ✓ 已实现桶冲突检测
- ✗ 缺少流量可视化地图
- ✗ 缺少动态流量调整

### 3.2 统计准确性问题

**问题**: 错误决策导致业务损失（误判有效/误判无效）

**大厂解决方案**:
1. **SRM 检验**: 检验分流是否均匀，防止分流系统 bug 导致结论错误
2. **CUPED 方差缩减**: 利用实验前数据修正，提升统计功效
3. **顺序检验**: 支持随时查看结果，防止 peeking problem
4. **多重校正**: 多指标场景控制 FDR

**GateFlow 现状**:
- ✓ SRM、CUPED、mSPRT、BH 均已实现
- ✓ 统计能力已达到大厂水平
- ✗ 缺少贝叶斯方法作为补充视角
- ✗ 缺少实验功效计算（创建前预估样本量）

### 3.3 实验效率问题

**问题**: 实验创建门槛高、分析耗时长、知识无法沉淀

**大厂解决方案**:
1. **实验模板**: 预置常见实验类型，降低创建门槛
2. **自动化报告**: 自动统计显著性、生成决策建议
3. **智能调优**（字节特色）: 多臂老虎机自动分配流量
4. **实验克隆**: 基于历史实验快速创建迭代版本

**GateFlow 现状**:
- ✓ 实验状态机设计完整
- ✓ 自动化报告有设计
- ✗ 实验模板未实现
- ✗ 智能调优未涉及
- ✗ 知识库仅在设计阶段

### 3.4 工程集成问题

**问题**: 实验平台需要深度嵌入业务流程

**大厂解决方案**:
1. **多端 SDK**: Java/iOS/Android/前端全覆盖
2. **本地分流**: 延迟 < 5ms，不影响主链路性能
3. **离线容灾**: SDK 网络异常时使用本地缓存兜底
4. **灰度解耦**: 实验参数与业务代码解耦，降低实验失败风险

**GateFlow 现状**:
- ✓ Java SDK 已实现，Expo SDK 在开发
- ✓ 本地分流已实现
- ✗ 离线容灾未实现
- ✗ iOS/Android SDK 未实现

---

## 四、GateFlow 可学习参考的改进建议

### P0 — 必须补齐（核心能力缺失）

#### 1. 流量可视化地图

**参考**: 腾讯 TAB 的树状流量结构图、字节的流量地图

**价值**: 直观展示域/层/桶的占用情况，避免流量冲突，提升产品经理使用体验

**实现建议**:
```
前端组件: React + Recharts/ECharts
数据源: 后端聚合当前各层实验的桶占用情况
展示内容:
├─ 总流量 100%
│  ├─ 域A (90%)
│  │  ├─ 层1 [实验A: 桶0-4999] [实验B: 桶5000-7999] [空闲: 桶8000-9999]
│  │  └─ 层2 [实验C: 桶0-2999] [空闲: 桶3000-9999]
│  └─ 域B (10%)
│     └─ 层3 [实验D: 桶0-9999]
```

**关键 API**:
- `GET /api/v1/traffic/map` — 返回全量流量占用情况
- `GET /api/v1/layers/{id}/occupancy` — 返回单层的桶占用详情

---

#### 2. 实验功效计算与样本量预估

**参考**: 字节 DataTester 的样本量预估工具

**价值**: 创建实验前预估所需样本量和运行时间，避免实验周期过长或统计功效不足

**实现建议**:
```java
// 新增 PowerAnalysisService
public class PowerAnalysisService {
    /**
     * 根据预期效应量、历史基准转化率、统计功效要求，计算所需样本量
     * @param baselineConversion 历史基准转化率
     * @param mde 最小可检测效应量 (Minimum Detectable Effect)
     * @param alpha 显著性水平 (通常 0.05)
     * @param power 统计功效 (通常 0.8)
     * @return 每组所需样本量
     */
    public long calculateSampleSize(double baselineConversion, double mde, 
                                     double alpha, double power) {
        // 标准公式: n = 2 * (Z_alpha/2 + Z_beta)^2 * p * (1-p) / MDE^2
    }
    
    /**
     * 根据当前样本量，计算当前统计功效
     */
    public double calculateCurrentPower(...) { ... }
    
    /**
     * 预估实验完成时间
     */
    public LocalDate estimatedCompletionDate(...) { ... }
}
```

---

#### 3. 离线容灾策略

**参考**: 字节/腾讯的 SDK 本地兜底策略

**价值**: SDK 在网络异常或配置服务宕机时，仍能正常工作

**实现建议**:
```java
// VictorClient 增加离线容灾
public class VictorClient {
    private volatile SdkConfig localFallbackConfig; // 本地持久化配置
    
    // 初始化时读取本地缓存
    private void loadLocalCache() {
        Path cacheFile = configDir.resolve("victor_cache.json");
        if (Files.exists(cacheFile)) {
            localFallbackConfig = objectMapper.readValue(Files.readAllBytes(cacheFile), SdkConfig.class);
        }
    }
    
    // 配置拉取失败时使用本地缓存
    private SdkConfig getConfigWithFallback() {
        try {
            return fetchRemoteConfig();
        } catch (Exception e) {
            log.warn("Remote config fetch failed, using local fallback");
            return localFallbackConfig;
        }
    }
    
    // 成功拉取配置后持久化到本地
    private void persistConfig(SdkConfig config) {
        localFallbackConfig = config;
        Files.write(configDir.resolve("victor_cache.json"), objectMapper.writeValueAsBytes(config));
    }
}
```

---

### P1 — 高优先级（显著提升能力）

#### 4. 白名单 / 定向实验

**参考**: 腾讯 TAB 的实时白名单、阿里的圈人实验

**价值**: 支持定向用户群体实验（如内部员工测试、特定城市灰度），提升实验灵活性

**实现建议**:
```sql
-- 新增实验白名单表
CREATE TABLE experiment_whitelist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    experiment_id BIGINT NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    forced_variant VARCHAR(32) NOT NULL,  -- 强制分配的变体
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_exp_user (experiment_id, user_id)
);

-- BucketingService 增加白名单检查
public BucketResult computeBucket(String userId, String experimentKey) {
    // 1. 先检查白名单
    String forcedVariant = whitelistMapper.getForcedVariant(experimentKey, userId);
    if (forcedVariant != null) {
        return new BucketResult(userId, experimentKey, -1, forcedVariant, true);
    }
    // 2. 正常分桶逻辑
    return BucketEngine.computeBucketResult(userId, experimentSpec);
}
```

---

#### 5. 人群拆分分析（Subgroup Analysis）

**参考**: 所有大厂实验平台均支持多维度人群拆分

**价值**: 分析实验效果在不同用户群体中的差异，发现细分洞察

**实现建议**:
```java
// 新增 SubgroupAnalysisService
public class SubgroupAnalysisService {
    
    /**
     * 按用户属性拆分分析实验效果
     * @param expId 实验ID
     * @param dimension 拆分维度 (如 "device_type", "user_segment", "city_tier")
     * @return 各子群体的实验效果
     */
    public Map<String, VariantEffect> analyzeByDimension(Long expId, String dimension) {
        // ClickHouse 查询:
        // SELECT 
        //     user_properties[dimension] as group_value,
        //     variant,
        //     count(*) as users,
        //     sum(conversion) / count(*) as conversion_rate
        // FROM victor.events
        // WHERE exp_id = ?
        // GROUP BY group_value, variant
    }
}
```

前端展示:
```
┌─────────────────────────────────────────────────┐
│  人群拆分分析: 按设备类型                         │
├──────────┬────────┬────────┬────────┬───────────┤
│ 群体      │ 对照组  │ 实验组  │ Lift   │ p值      │
├──────────┼────────┼────────┼────────┼───────────┤
│ iOS      │ 12.3%  │ 14.1%  │ +14.6% │ 0.003 ** │
│ Android  │ 11.8%  │ 12.2%  │ +3.4%  │ 0.21     │
│ Web      │ 10.5%  │ 13.0%  │ +23.8% │ 0.001 ** │
└──────────┴────────┴────────┴────────┴───────────┘
```

---

#### 6. 动态灰度推进

**参考**: 字节的自动灰度推进、阿里的参数化 Rollout

**价值**: 灰度阶段自动根据门禁条件推进流量比例，减少人工干预

**实现建议**:
```java
// 新增 RampScheduler
@Component
public class RampScheduler {
    
    @Scheduled(fixedRate = 300000) // 每5分钟检查一次
    public void checkAndAdvanceRamp() {
        List<Experiment> rampingExperiments = 
            experimentMapper.selectByStatus(ExperimentStatus.RAMP);
        
        for (Experiment exp : rampingExperiments) {
            RampStage currentStage = exp.getCurrentRampStage();
            
            // 检查当前阶段门禁条件
            if (checkRampGate(exp, currentStage)) {
                // 满足条件，推进到下一阶段
                RampStage nextStage = currentStage.next();
                experimentService.updateTrafficAllocation(exp.getId(), nextStage.getTrafficPercent());
                exp.setCurrentRampStage(nextStage);
                
                // 通知实验Owner
                notificationService.sendRampAdvanceNotification(exp, nextStage);
            } else if (checkRampFailure(exp, currentStage)) {
                // 门禁失败，暂停实验
                experimentService.pauseExperiment(exp.getId());
                notificationService.sendRampFailureAlert(exp, currentStage);
            }
        }
    }
    
    private boolean checkRampGate(Experiment exp, RampStage stage) {
        // SRM 检验
        if (!statsService.checkSRM(exp.getId())) return false;
        // 护栏指标检查
        if (guardrailMetrics.worsened(exp.getId())) return false;
        // 核心流程错误率检查
        if (errorRate.exceedsThreshold(exp.getId())) return false;
        return true;
    }
}
```

---

### P2 — 中期规划（差异化竞争力）

#### 7. 贝叶斯统计方法

**参考**: 字节 DataTester 的贝叶斯估计

**价值**: 提供概率化解读（如"B 优于 A 的概率为 92%"），更易被非技术用户理解

**实现建议**:
```java
// 新增 BayesianTest
public class BayesianTest {
    
    /**
     * 贝叶斯 A/B 检验: 计算 B 优于 A 的概率
     * @param conversionsA 对照组转化数
     * @param usersA 对照组用户数
     * @param conversionsB 实验组转化数
     * @param usersB 实验组用户数
     * @return P(B > A) 的概率
     */
    public double probabilityBBetterA(int conversionsA, int usersA, 
                                       int conversionsB, int usersB) {
        // 使用 Beta 分布作为先验
        BetaDistribution priorA = new BetaDistribution(1, 1); // 均匀先验
        BetaDistribution posteriorA = new BetaDistribution(1 + conversionsA, 1 + usersA - conversionsA);
        BetaDistribution posteriorB = new BetaDistribution(1 + conversionsB, 1 + usersB - conversionsB);
        
        // Monte Carlo 采样估计 P(B > A)
        int samples = 100000;
        int bBetterCount = 0;
        for (int i = 0; i < samples; i++) {
            double sampleA = posteriorA.sample();
            double sampleB = posteriorB.sample();
            if (sampleB > sampleA) bBetterCount++;
        }
        return (double) bBetterCount / samples;
    }
}
```

---

#### 8. 多臂老虎机（Multi-Armed Bandit）

**参考**: 字节 DataTester 的智能调优

**价值**: 实验运行过程中自动将更多流量分配给表现好的版本，减少机会成本

**实现建议**:
```java
// 新增 ThompsonSamplingMAB
public class ThompsonSamplingMAB {
    
    /**
     * Thompson Sampling 算法: 根据后验分布采样决定流量分配
     * 每 N 分钟重新计算一次流量权重
     */
    public Map<String, Double> computeTrafficWeights(
            Map<String, VariantPerformance> variants) {
        
        Map<String, Double> weights = new HashMap<>();
        
        // 对每个变体采样
        for (Map.Entry<String, VariantPerformance> entry : variants.entrySet()) {
            BetaDistribution posterior = new BetaDistribution(
                1 + entry.getValue().getConversions(),
                1 + entry.getValue().getUsers() - entry.getValue().getConversions()
            );
            weights.put(entry.getKey(), posterior.sample());
        }
        
        // 归一化为流量权重
        double total = weights.values().stream().mapToDouble(Double::doubleValue).sum();
        return weights.entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue() / total));
    }
}
```

---

#### 9. 实验模板市场

**参考**: 字节 DataTester 的实验模板库

**价值**: 降低实验创建门槛，提升实验标准化程度

**实现建议**:
```json
// 实验模板示例
{
  "template_id": "tpl_button_ab",
  "name": "按钮 A/B 测试",
  "category": "UI优化",
  "description": "测试不同按钮文案/颜色对转化率的影响",
  "default_config": {
    "metrics": {
      "primary": "button_click_rate",
      "guardrails": ["page_load_p90", "error_rate"]
    },
    "traffic_allocation": {
      "control": 50,
      "treatment": 50
    },
    "duration_days": 14,
    "ramp_stages": [1, 5, 10, 50]
  }
}
```

---

## 五、优先级总结与实施路线图

### 5.1 能力成熟度评估

| 能力域 | GateFlow 现状 | 行业标杆 | 差距 | 优先级 |
|-------|:------------:|:-------:|:---:|:------:|
| **分桶引擎** | ★★★★★ | ★★★★☆ | 超越 | 保持 |
| **统计方法** | ★★★★☆ | ★★★★☆ | 接近 | P2 补充贝叶斯 |
| **数据管道** | ★★★☆☆ | ★★★★☆ | 计算引擎 | P1 考虑 Flink |
| **流量管理** | ★★☆☆☆ | ★★★★★ | 可视化/动态 | P0 流量地图 |
| **实验治理** | ★★☆☆☆ | ★★★★☆ | 实现差距 | P0 审批/权限 |
| **SDK 生态** | ★★★☆☆ | ★★★★☆ | 移动端 | P0 离线容灾 |
| **智能调优** | ★☆☆☆☆ | ★★★★☆ | MAB/自动化 | P2 中期规划 |
| **知识沉淀** | ★★★☆☆ | ★★☆☆☆ | 领先 | 差异化优势 |

### 5.2 建议实施路线

```
Phase 1: 核心能力补齐 (当前最紧迫)
├─ 1. 流量可视化地图 — 产品经理强需求
├─ 2. 实验功效计算 — 创建实验必备
├─ 3. SDK 离线容灾 — 生产环境可靠性
├─ 4. 审批流程实现 — 治理合规要求
└─ 5. RBAC 权限落地 — 安全基础

Phase 2: 体验与效率提升 (显著提升竞争力)
├─ 6. 白名单/定向实验
├─ 7. 人群拆分分析
├─ 8. 动态灰度推进
├─ 9. iOS/Android SDK 实现
└─ 10. 实验模板市场

Phase 3: 差异化竞争力建设 (长期投入)
├─ 11. 贝叶斯统计方法
├─ 12. 多臂老虎机自动调优
├─ 13. 知识库 UI 与智能推荐
├─ 14. Flink 实时计算升级 (可选)
└─ 15. AI 辅助实验设计 (探索性)
```

---

## 六、与 GateFlow 产品定位的关联

根据项目文档 `docs/knowledge/01-project-overview/GateFlow_产品方案_纯净版.md`，GateFlow 的长期愿景是成为 **AI 驱动的付费墙增长基础设施**（类似 Superwall 但支持中国市场）。

### 6.1 实验能力对付费墙场景的价值

| 付费墙场景 | 需要的实验能力 | GateFlow 现状 |
|-----------|:-------------:|:------------:|
| **付费墙模板 A/B** | 快速创建实验、模板市场 | ✗ 待实现 |
| **价格弹性测试** | 多组实验、统计功效计算 | ✗ 待实现 |
| **试用期长度测试** | 长期实验监控、顺序检验 | ✓ 已实现 mSPRT |
| **UI/文案优化** | 人群拆分分析、快速迭代 | ✗ 待实现 |
| **自动调优** | 多臂老虎机减少收入损失 | ✗ 待实现 |
| **灰度发布** | 动态灰度推进降低风险 | ✗ 待实现 |

### 6.2 差异化竞争策略

GateFlow 相比大厂实验平台的差异化机会:

1. **垂直场景深耕**: 聚焦付费墙/订阅增长场景，预置行业模板和最佳实践
2. **知识沉淀**: 大厂普遍缺少知识库能力，这是 GateFlow 的差异化优势
3. **中国市场适配**: 支付宝/微信支付集成、中国区定价实验模板
4. **AI 增强**: AI 辅助实验设计、AI 文案生成、自动洞察解读

---

## 七、结论

### GateFlow 的核心优势

1. **分桶引擎设计优秀**: 10000 桶粒度 + 纯 Java 实现 + 零 Spring 依赖，架构上优于多数大厂
2. **统计方法全面**: SRM、Z-Test、CUPED、mSPRT、BH 均已实现，与字节同一梯队
3. **设计理念先进**: RBAC+ABAC、知识库、完整状态机等设计文档完备
4. **代码质量高**: 模块分层清晰、无循环依赖、架构评分 3.5/5.0

### 最需要补齐的短板

1. **实现与设计的鸿沟**: 大量优秀设计（审批、权限、知识库）停留在文档阶段
2. **缺少流量可视化工具**: 产品经理无法直观理解流量分配
3. **缺少实验前规划**: 无法预估样本量和运行时间
4. **SDK 生态不完整**: 移动端 SDK 缺失、缺少离线容灾

### 一句话总结

> GateFlow 在分桶引擎和统计方法上已达到大厂水平，但流量管理工具化、实验治理落地、SDK 生态完整性方面仍有明显差距。优先补齐流量可视化、功效计算、离线容灾等核心能力，同时在知识库和垂直场景模板上建立差异化优势。
