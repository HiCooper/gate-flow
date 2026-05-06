# Victor (维克托) AB实验系统架构Review报告

> **项目代号**: Victor (维克托)
> **Review日期**: 2026-05-05
> **Review人**: 架构师视角
> **文档版本**: v1.0
> **修复状态**: P0问题已修复 ✅

---

## 📋 P0问题修复状态

| P0问题 | 状态 | 修复内容 | 修复文档位置 |
|--------|------|---------|-------------|
| 数据库外键引用错误 | ✅ 已修复 | 外键改为引用主键id，移除variants JSON字段 | implementation_plan.md §2.4.1 |
| 配置同步机制缺失 | ✅ 已修复 | SDK定时拉取模式(30s轮询+版本比对+7天离线缓存) | implementation_plan.md §2.3.3 |
| 事件去重机制缺失 | ✅ 已修复 | Redis SETNX去重 + Schema校验 + SDK缓存 | implementation_plan.md §5.5 |

---

## 一、总体评价 (更新后)

| 维度 | 评分 | 说明 |
|------|------|------|
| **架构完整性** | ★★★★★ | 覆盖分流→采集→存储→分析全链路，细节已补充 ✅ |
| **模块设计** | ★★★★★ | Maven多模块分层清晰，依赖关系合理 |
| **可扩展性** | ★★★★☆ | 支持未来拆分微服务，设计灵活 |
| **性能设计** | ★★★★☆ | SDK纯本地计算达标 + 配置推送机制完善 ✅ |
| **数据完整性** | ★★★★★ | 去重机制 + Schema校验 + SDK离线兜底 ✅ |

**综合评分**: 4.6/5 - **优秀，核心P0问题已修复**

---

## 二、架构亮点 (做得好的地方)

### 2.1 Maven多模块分层设计 ⭐⭐⭐⭐⭐

```
victor-common → victor-domain → victor-bucketing → victor-infrastructure → victor-service → victor-sdk → victor-web
```

**评价**: 非常优秀的分层设计
- `victor-bucketing` 纯Java无Spring依赖 → 可直接移植SDK，**关键正确决策**
- `victor-domain` 领域模型独立 → 符合DDD原则，解耦框架
- `victor-sdk` 可独立发布 → 其他Java服务可直接引入依赖
- 依赖关系单向 → 无循环依赖，构建顺序明确

**建议**: 保持这个设计，这是架构的核心优势

### 2.2 SDK纯本地分桶设计 ⭐⭐⭐⭐⭐

设计文档明确：
> 本地缓存 + 纯本地计算，无需网络请求即可分桶

**评价**: 这是AB系统设计的**最关键正确决策**
- <5ms 延迟目标依赖本地计算，而非服务端
- 避免服务端成为性能瓶颈
- 符合业界最佳实践（Google、Airbnb等均采用此方案）

### 2.3 域-层正交分流模型 ⭐⭐⭐⭐

**评价**: 设计正确，但文档需补充实现细节
- 10000桶、0.1%粒度 → 符合业界标准
- `layer_id` 作为盐值实现层间正交 → 算法正确
- 独占域设计 → 支持互斥实验，设计合理

---

## 三、关键问题修复状态 (P0已修复)

### 3.1 ✅ 配置同步机制 (已修复)

**原问题**: 设计目标"<3min全局生效"缺少实现方案。

**修复状态**: ✅ 已在 `implementation_plan.md §2.3.3` 补充SDK定时拉取方案

| 设计要点 | 说明 | 实现状态 |
|------|---------|---------|
| 轮询间隔 | 30秒定时轮询版本 | ✅ 已设计 |
| 版本比对优先 | 先查版本再拉取，减少带宽 | ✅ 已设计 |
| 增量拉取 | 只拉取变更的实验配置 | ✅ 已设计 |
| 离线缓存 | 7天本地缓存兜底 | ✅ 已设计 |
| 配置生效延迟 | <30s (SDK轮询周期内) | ✅ 已设计 |

**设计优势**: 无需WebSocket/SSE长连接维护，架构简洁，离线友好

---

### 3.2 ✅ 事件去重机制 (已修复)

**原问题**: 事件上报缺少去重、Schema校验等关键机制。

**修复状态**: ✅ 已在 `implementation_plan.md §5.5` 补充完整方案

| 机制 | 作用 | 实现状态 |
|------|------|---------|
| 事件去重 | 防止重复计算 | ✅ Redis SETNX |
| Schema校验 | 防止脏数据 | ✅ 已实现 |
| SDK本地缓存 | 防止网络丢数据 | ✅ IndexedDB |

---

### 3.3 ✅ 数据库设计 (已修复)

**原问题**: 外键引用业务ID而非主键。

**修复状态**: ✅ 已在 `implementation_plan.md §2.4.1` 修复

- 外键改为引用主键`id`
- 移除`variants` JSON字段
- 新增`victor_user_assignment`表
- 新增`victor_config_version`表

---

**问题描述**: 
设计目标"百万DAU · 50+并行实验 · <5ms延迟"，但服务端高并发方案缺失。

**具体缺失**:
| 场景 | 当前设计 | 问题 |
|------|---------|------|
| 配置下发API | Spring Boot单实例 | 无限流、无熔断设计 |
| 事件上报API | Kafka生产者 | 无批量聚合、无背压处理 |
| 分桶查询API | Redis缓存 | 无缓存穿透/击穿防护 |

**改进建议**:

```
服务端高并发架构补充:

┌─────────────────────────────────────────────────────────────┐
│                     客户端 SDK (本地计算)                     │
│                    真正的 < 5ms 延迟来源                      │
└─────────────────────────────────────────────────────────────┘
                              │ 仅配置拉取
                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  CDN 缓存   │───▶│ Nginx 限流  │───▶│ Spring Boot │
│ (静态配置)  │    │ (10QPS/IP)  │    │  (集群部署) │
└─────────────┘    └─────────────┘    └─────────────┘

关键设计:
1. 配置JSON静态化 → CDN分发，服务端无压力
2. SDK增量拉取 → ETag比对，304返回无带宽消耗
3. 服务端仅处理实验管理操作 → 非高频路径
```

**结论**: SDK本地计算已解决核心性能问题，服务端需补充限流/熔断，但非核心瓶颈。

---

### 3.2 🔴 配置下发实时性设计不完整

**问题描述**:
设计文档提到"< 3min全局生效"，但缺少实现方案。

**当前设计缺失**:
- 无WebSocket/SSE具体实现
- 无配置变更通知机制
- 无SDK心跳/长轮询细节

**改进建议**:

```java
// 补充: 配置变更通知服务
@Service
public class ConfigNotificationService {
    
    // 方案1: WebSocket推送
    @Autowired
    private SimpMessagingTemplate webSocket;
    
    public void notifyConfigChange(String version) {
        webSocket.convertAndSend("/topic/config", 
            new ConfigUpdateEvent(version, "update"));
    }
    
    // 方案2: 长轮询 (SSE)
    @GetMapping("/config/poll")
    public SseEmitter pollConfig(@RequestParam String etag) {
        SseEmitter emitter = new SseEmitter(30000L); // 30s超时
        configChangeWatcher.register(etag, emitter);
        return emitter;
    }
}
```

**补充方案**: 
- 配置变更时 → 写入Redis + 发送Kafka通知
- SDK定期心跳 (每30s) → 比对版本号 → 拉取增量

---

### 3.3 🔴 事件上报缺少核心设计

**问题描述**:
事件上报是数据完整性核心，但设计缺失关键机制：

| 缺失设计 | 影响 | 严重程度 |
|---------|------|---------|
| 事件去重机制 | 重复计算导致统计偏差 | 🔴 高 |
| 事件幂等性设计 | Kafka重消费导致数据错误 | 🔴 高 |
| 事件Schema校验 | 脏数据进入存储 | 🟡 中 |
| 客户端缓存策略 | 网络抖动丢数据 | 🟡 中 |

**改进建议**:

```java
// 补充: 事件去重设计
public class EventDeduplicator {
    
    // 使用event_id + timestamp作为唯一键
    // Redis SETNX + 24h过期
    public boolean isDuplicate(String eventId, long timestamp) {
        String key = "event:dup:" + eventId;
        Boolean success = redis.opsForValue().setIfAbsent(key, 
            timestamp, Duration.ofHours(24));
        return !success; // 已存在=重复
    }
}

// 补充: 客户端事件缓存策略
// SDK本地缓存1000条事件，批量上报
// 网络失败时本地持久化，下次成功后上报
```

**事件Schema校验补充**:

```java
// 补充: 事件校验服务
@Service
public class EventValidator {
    
    public ValidationResult validate(EventRequest event) {
        // 1. 必填字段校验
        if (event.getEventId() == null || event.getUserId() == null) {
            return ValidationResult.fail("缺少必填字段");
        }
        
        // 2. 时间戳校验 (防止时钟偏移)
        long now = System.currentTimeMillis();
        if (Math.abs(event.getTimestamp() - now) > 3600000) { // 1h偏差
            return ValidationResult.fail("时间戳异常");
        }
        
        // 3. victor_tags校验 (必须包含实验标签)
        if (event.getVictorTags() == null || event.getVictorTags().isEmpty()) {
            // 警告但不拒绝，允许非实验用户事件
            return ValidationResult.warn("无实验标签");
        }
        
        return ValidationResult.success();
    }
}
```

---

### 3.4 🟡 数据库设计问题

**问题1: 外键约束不合理**

```sql
-- 当前设计问题:
FOREIGN KEY (layer_id) REFERENCES victor_layer(layer_id)

-- 问题: 
-- 1. layer_id是业务ID而非主键，外键引用错误
-- 2. 外键约束在高并发写入时成为性能瓶颈
```

**改进建议**:

```sql
-- 修正方案:
-- 1. 外键引用主键id而非业务ID
FOREIGN KEY (layer_id) REFERENCES victor_layer(id)

-- 2. 生产环境考虑移除物理外键，改用逻辑校验
-- ALTER TABLE victor_experiment DROP FOREIGN KEY fk_layer;
-- 在Service层校验: layerMapper.existsById(layerId)
```

**问题2: victor_experiment表variants字段用JSON存储**

```sql
-- 当前设计:
variants JSON,             -- 实验版本配置

-- 问题:
-- 1. JSON字段无法建索引，查询性能差
-- 2. 版本数据修改需全量更新JSON
-- 3. 与victor_variant表数据冗余
```

**改进建议**:

```sql
-- 建议: 移除variants JSON字段，统一使用victor_variant表
-- victor_variant表已设计，应作为唯一版本数据源

-- 如果需要快速查询版本列表，可:
-- 1. Redis缓存实验版本列表
-- 2. 或在victor_experiment添加variant_count字段用于统计
```

**问题3: 缺少用户分桶记录表**

**问题描述**:
用户分桶结果无持久化记录，无法回溯分析。

**补充设计**:

```sql
-- 新增: 用户分桶记录表 (可选，根据业务需求)
CREATE TABLE victor_user_assignment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(64) NOT NULL,
    exp_id VARCHAR(64) NOT NULL,
    variant_key VARCHAR(64) NOT NULL,
    bucket INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_exp (user_id, exp_id),
    INDEX idx_exp_variant (exp_id, variant_key)
) ENGINE=InnoDB;

-- 用途:
-- 1. 回溯用户分桶历史 (审计需求)
-- 2. SRM检验数据来源
-- 3. 用户实验交集分析
```

---

### 3.5 🟡 统计分析引擎设计不完整

**问题**: 统计模块代码骨架存在，但缺少核心实现细节。

**缺失设计**:

| 组件 | 设计文档 | 缺失内容 |
|------|---------|---------|
| SRM检验 | 声明"卡方检验" | 无具体算法实现 |
| CUPED | 有公式描述 | 无协变量选择策略 |
| mSPRT | 声明"序贯检验" | 无停止规则具体参数 |
| 样本量计算 | 未提及 | 实验启动前必需 |

**补充建议**: 使用成熟统计库而非自行实现

```java
// 建议: 使用Apache Commons Math或第三方统计库
// 而非自行实现t检验等核心算法

// 方案1: Apache Commons Math3
implementation 'org.apache.commons:commons-math3:3.6.1'

// 使用:
TTest tTest = new TTest();
double pValue = tTest.tTest(control, treatment);

// 方案2: 调用Python/R服务 (复杂统计场景)
// 通过REST调用独立统计服务 (Python scipy/statsmodels)
```

---

### 3.6 🟢 SDK设计整体良好，补充细节

**当前设计良好的部分**:
- 纯本地分桶设计正确
- 本地缓存策略完整
- 埋点注入机制设计合理

**补充建议**:

```typescript
// 补充: SDK配置版本比对逻辑
class ConfigManager {
    
    async checkUpdate(currentVersion: string): Promise<boolean> {
        // 1. 心跳请求携带版本号
        const response = await fetch(`/api/v1/config/version?t=${currentVersion}`);
        
        // 2. 服务端比对，返回是否有更新
        if (response.status === 304) {
            return false; // 无更新
        }
        
        // 3. 有更新则拉取增量配置
        const newConfig = await this.fetchIncremental(currentVersion);
        this.mergeConfig(newConfig);
        return true;
    }
}

// 补充: SDK离线兜底设计
class OfflineFallback {
    
    // 网络失败时使用本地缓存
    // 缓存过期7天，超期使用硬编码默认配置
    getFallbackConfig(): ExperimentConfig {
        const cached = localStorage.getItem('victor_config');
        if (cached) {
            const config = JSON.parse(cached);
            const cacheTime = config.cacheTime;
            const now = Date.now();
            if (now - cacheTime < 7 * 24 * 3600000) {
                return config; // 缓存有效
            }
        }
        return this.getHardcodedDefault(); // 硬编码兜底
    }
}
```

---

## 四、架构决策验证

### 4.1 SDK本地计算 vs 服务端分桶

**决策验证**: ✅ 正确决策

| 方案 | 延迟 | 服务端压力 | 可靠性 |
|------|------|---------|--------|
| SDK本地计算 | <5ms ✓ | 无 ✓ | 高(离线可用) ✓ |
| 服务端分桶 | 50-200ms | 高(百万QPS) | 低(依赖网络) |

**结论**: 设计文档选择SDK本地计算是正确决策。

### 4.2 单体服务 vs 微服务

**决策验证**: ✅ 当前阶段合理

| 阶段 | 建议架构 | 理由 |
|------|---------|------|
| MVP/初期 | 单体 + 多模块 | 开发效率高，运维简单 |
| 50+实验规模 | 单体可支撑 | 分流压力在SDK，服务端压力低 |
| 未来扩展 | 可拆分微服务 | victor-bucketing模块已解耦，可独立部署 |

**结论**: 当前单体+多模块设计合理，未来拆分成本低。

### 4.3 MySQL + Redis + Kafka vs ClickHouse

**决策验证**: 🟡 存储选型需补充

设计文档提到ClickHouse用于OLAP分析，但实施计划未包含。

**补充建议**:

```
存储选型分层设计:

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    MySQL     │    │    Redis     │    │  ClickHouse  │
│   (配置库)   │    │   (缓存)     │    │   (指标分析)  │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ 实验配置     │    │ 配置缓存     │    │ 实时指标表   │
│ 用户分桶记录 │    │ 分桶结果缓存 │    │ 离线指标表   │
│ 实验元数据   │    │ 会话数据     │    │ 事件明细表   │
└──────────────┘    └──────────────┘    └──────────────┘
      低频写入           高频读取           大批量分析
      事务支持           <3ms延迟          列式聚合查询
```

**建议**: Phase 4数据采集时补充ClickHouse集成设计。

---

## 五、整体改进优先级

| 优先级 | 问题 | 改进内容 | Phase关联 |
|--------|------|---------|----------|
| 🔴 P0 | 事件去重机制 | 补充去重设计 | Phase 4 |
| 🔴 P0 | 配置同步机制 | SDK定时拉取(30s轮询+版本比对) | Phase 1 |
| 🟡 P1 | 数据库外键修正 | 修正外键设计 | Phase 1 |
| 🟡 P1 | 统计库选型 | 使用成熟统计库 | Phase 5 |
| 🟢 P2 | 用户分桶记录表 | 补充审计表设计 | Phase 2 |
| 🟢 P2 | ClickHouse集成 | 补充OLAP存储设计 | Phase 4 |

---

## 六、架构演进路线建议

```
Phase 1: 分流核心 (配置拉取机制已完成)
    ↓
Phase 2: 实验管理 (补充审计表)
    ↓
Phase 3: SDK开发 (补充离线兜底)
    ↓
Phase 4: 数据采集 (补充去重+ClickHouse)
    ↓
Phase 5: 统计分析 (使用成熟库)
    ↓
未来演进:
    ├─ 统计服务独立部署 (复杂统计场景)
    ├─ 多租户支持 (SaaS化)
    ├─ 智能分流 (上下文感知)
```

---

## 七、总结

### 优点
1. Maven多模块分层设计优秀，`victor-bucketing`纯Java设计是关键亮点
2. SDK本地分桶设计正确，避免了服务端性能瓶颈
3. 域-层正交模型设计合理，符合业界最佳实践
4. 整体架构完整，覆盖全链路

### 待改进
1. ✅ 配置同步机制已补充(SDK定时拉取模式)
2. ✅ 事件去重、幂等性设计已补充
3. ✅ 数据库外键设计已修正
4. 统计模块使用成熟库而非自行实现
5. 补充ClickHouse OLAP存储设计

### 最终评价
**架构设计整体良好(3.8/5)，核心决策正确(SDK本地计算、多模块分层)，但需补充关键细节后方可进入实施阶段。**

---

> **建议**: 在Phase 1实施前，先补充配置推送机制设计；在Phase 4实施前，补充事件去重+ClickHouse设计。