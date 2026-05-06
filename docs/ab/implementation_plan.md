# Victor (维克托) AB实验系统后端实施计划

> **项目代号**: Victor (维克托)
> **版本**: v1.0-impl
> **日期**: 2026-05-05
> **技术栈**: Java (Spring Boot)
> **优先级**: 分流服务优先 (SDK + Bucketing)

---

## 一、项目结构规划

### 1.1 Monorepo新增后端模块

```
gate-flow/
├── apps/
│   ├── admin/              # 管理后台前端 (React/Vite)
│   ├── marketing/          # 营销网站前端 (React/Vite)
│   └── victor-console/     # [新增] Victor实验管理平台前端 (React/Vite)
├── backend/
│   └── victor-service/     # [新增] Victor AB实验系统服务端 (Maven多模块项目)
│       ├── pom.xml         # 父POM (依赖管理、版本控制)
│       │
│       ├── victor-common/      # 公共模块
│       │   ├── src/main/java/com/gateflow/victor/common/
│       │   │   ├── util/           # 工具类 (MurmurHash3等)
│       │   │   ├── constant/       # 常量定义
│       │   │   ├── exception/      # 异常类
│       │   │   └── enums/          # 公共枚举
│       │   └── pom.xml
│       │
│       ├── victor-domain/      # 领域模型模块
│       │   ├── src/main/java/com/gateflow/victor/domain/
│       │   │   ├── entity/         # 实体类 (Experiment, Layer, Domain, Variant)
│       │   │   ├── dto/            # 数据传输对象
│       │   │   ├── event/          # 事件模型
│       │   │   └── stats/          # 统计结果模型
│       │   └── pom.xml
│       │
│       ├── victor-bucketing/   # 分流核心模块 (纯Java，无Spring依赖)
│       │   ├── src/main/java/com/gateflow/victor/bucketing/
│       │   │   ├── BucketEngine.java      # 分桶引擎
│       │   │   ├── BucketAssignment.java  # 分桶结果
│       │   │   ├── DomainLayerModel.java  # 域-层模型
│       │   │   └── VariantMatcher.java    # 版本匹配
│       │   ├── src/test/java/...          # 单元测试
│       │   └── pom.xml
│       │
│       ├── victor-infrastructure/  # 基础设施模块
│       │   ├── src/main/java/com/gateflow/victor/infra/
│       │   │   ├── mapper/          # MyBatis-Plus Mapper接口
│       │   │   ├── cache/           # Redis缓存服务
│       │   │   ├── mq/              # Kafka生产者/消费者
│       │   │   ├── config/          # Spring配置类
│       │   │   └── migration/       # Flyway数据库迁移脚本
│       │   ├── src/main/resources/
│       │   │   └── db/migration/
│       │   └── pom.xml
│       │
│       ├── victor-service/     # 业务服务模块
│       │   ├── src/main/java/com/gateflow/victor/service/
│       │   │   ├── experiment/   # 实验管理服务
│       │   │   ├── config/       # 配置下发服务
│       │   │   ├── ingestion/    # 数据采集服务
│       │   │   └── stats/        # 统计分析服务
│       │   └── pom.xml
│       │
│       ├── victor-sdk/         # [新增] Java客户端SDK模块 (供其他Java服务集成)
│       │   ├── src/main/java/com/gateflow/victor/sdk/
│       │   │   ├── VictorClient.java      # SDK主客户端
│       │   │   ├── VictorConfig.java      # SDK配置类
│       │   │   ├── BucketingService.java  # 分桶服务(复用victor-bucketing)
│       │   │   ├── EventCollector.java    # 事件采集服务
│       │   │   ├── ConfigFetcher.java     # 配置拉取服务
│       │   │   └── CacheManager.java      # 本地缓存管理
│       │   ├── src/test/java/...          # SDK单元测试
│       │   └── pom.xml                    # 可独立发布到Maven仓库
│       │
│       └── victor-web/        # Web应用模块 (启动入口)
│           ├── src/main/java/com/gateflow/victor/
│           │   ├── controller/    # REST Controller
│           │   │   ├── BucketingController.java
│           │   │   ├── ExperimentController.java
│           │   │   ├── ConfigController.java
│           │   │   ├── EventController.java
│           │   │   └ AnalysisController.java
│           │   └── VictorServiceApplication.java  # 启动类
│           ├── src/main/resources/
│           │   └ application.yml    # 主配置
│           └── pom.xml
│           └── Dockerfile
│
├── packages/
│   ├── shared/             # 前端共享组件
│   └── victor-sdk/         # [新增] 多平台分流SDK
│       ├── sdk-core/       # 核心分桶逻辑 (复用victor-bucketing模块)
│       ├── sdk-web/        # Web SDK (TypeScript)
│       ├── sdk-android/    # Android SDK (Kotlin)
│       └── sdk-ios/        # iOS SDK (Swift)
│
├── docs/
│   └── victor/             # Victor设计文档
│       ├── victor_experiment_system_proposal.md
│       ├── victor_experiment_system_architecture.html
│       └── implementation_plan.md  # 本文档
```

### 1.2 Maven多模块依赖关系

```
                              ┌─────────────┐
                              │ victor-web  │  (启动入口，聚合所有模块)
                              └─────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
          ┌──────────┐       ┌──────────┐       ┌──────────┐
          │victor-svc│       │victor-infra│     │victor-sdk │
          │(业务层)  │       │(基础设施) │       │(Java SDK) │
          └──────────┘       └──────────┘       └──────────┘
                │                   │                   │
                └───────┬───────────┘                   │
                        │                               │
                        ▼                               │
                  ┌──────────┐                          │
                  │victor-domain│                        │
                  │(领域模型) │◀─────────────────────────┘
                  └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │victor-common│
                  │  (公共)   │
                  └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │victor-bucket│
                  │(分流核心) │  ← 无Spring依赖，纯Java
                  └──────────┘
```

### 1.3 模块职责说明

| 模块 | 职责 | 依赖 | 特点 |
|------|------|------|------|
| **victor-common** | 工具类、常量、异常、枚举 | 无 | 纯Java，无第三方依赖 |
| **victor-domain** | 领域模型、实体、DTO | victor-common | 纯Java，可被SDK复用 |
| **victor-bucketing** | 分桶计算核心逻辑 | victor-common, victor-domain | 纯Java，无Spring依赖，可独立测试 |
| **victor-infrastructure** | 数据访问、缓存、消息队列 | victor-domain | MyBatis-Plus/Redis/Kafka |
| **victor-service** | 业务逻辑服务 | victor-domain, victor-bucketing | Spring Service层 |
| **victor-sdk** | Java客户端SDK (供其他Java服务集成) | victor-bucketing, victor-domain | 可独立发布到Maven仓库 |
| **victor-web** | REST API、启动入口 | victor-service, victor-infra | Spring Boot Web |

### 1.4 设计优势

- **victor-bucketing 纯Java**：无Spring依赖，可直接移植到SDK (sdk-core)
- **victor-domain 独立**：领域模型与框架解耦，方便跨平台复用
- **victor-sdk 可独立发布**：其他Java服务可直接引入依赖，无需HTTP调用
- **分层清晰**：Controller → Service → Infrastructure → Domain → Common
- **可扩展**：未来可拆分为微服务（如 stats-service 单独部署）

### 1.5 技术栈详情

| 组件 | 技术选型 | 版本 |
|------|---------|------|
| **分流服务** | Spring Boot 3.x | Java 17+ |
| **数据访问** | MyBatis-Plus + MySQL | 8.0+ |
| **配置缓存** | Spring Data Redis | 7.x |
| **消息队列** | Spring Kafka | 3.x |
| **API文档** | SpringDoc OpenAPI | 2.x |
| **构建工具** | Maven | 3.9+ |
| **容器化** | Docker + Compose | - |

---

## 二、Phase 1: 分流服务核心

### 2.1 目标

实现分流服务的核心功能，涉及以下子模块：
- **victor-common**: MurmurHash3工具类、常量定义
- **victor-domain**: 领域模型 (Experiment, Layer, Domain, Variant)
- **victor-bucketing**: 分桶引擎核心逻辑 (纯Java)
- **victor-infrastructure**: Mapper、Redis缓存配置
- **victor-sdk**: Java客户端SDK (供其他Java服务集成)
- **victor-web**: 分桶计算API、配置下发API

### 2.2 各模块实现内容

**victor-common 模块**:
```
victor-common/src/main/java/com/gateflow/victor/common/
├── util/
│   └── MurmurHash3.java           # MurmurHash3实现
├── constant/
│   └── BucketConstants.java       # TOTAL_BUCKETS=10000等
├── enums/
│   └ ExperimentStatus.java        # 实验状态枚举
│   └ Platform.java                # 平台枚举
└── exception/
│   └ ExperimentNotFoundException.java
```

**victor-domain 模块**:
```
victor-domain/src/main/java/com/gateflow/victor/domain/
├── entity/
│   ├── Experiment.java            # 实验实体 (MyBatis-Plus注解)
│   ├── Layer.java                 # 层实体
│   ├── Domain.java                # 域实体
│   ├── Variant.java               # 版本实体
│   ├── UserAssignment.java        # 用户分桶记录
│   └── ConfigVersion.java         # 配置版本
├── dto/
│   ├── BucketingRequest.java
│   ├── BucketingResponse.java
│   ├── ConfigResponse.java
│   └── ExperimentCreateRequest.java
└── stats/
│   └ BucketAssignment.java        # 分桶结果模型
```

**实体类示例 (MyBatis-Plus)**:

```java
// Experiment.java - 实验实体
@TableName("victor_experiment")
public class Experiment {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("exp_id")
    private String expId;           // 业务ID
    
    private String name;
    private String description;
    
    @TableField("layer_id")
    private Long layerId;           // 引用victor_layer.id
    
    private String status;          // draft/running/paused等
    private BigDecimal trafficRatio;
    private Integer bucketStart;
    private Integer bucketEnd;
    
    @TableField(type = FieldType.JSON)
    private String targetingRules;  // JSON格式
    
    private String primaryMetric;
    
    @TableField(type = FieldType.JSON)
    private String secondaryMetrics;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    // 关联查询: 一对多
    @TableField(exist = false)
    private List<Variant> variants;
}

// Variant.java - 版本实体
@TableName("victor_variant")
public class Variant {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("exp_id")
    private Long expId;
    
    private String variantKey;
    private String name;
    private Integer bucketStart;
    private Integer bucketEnd;
    
    @TableField(type = FieldType.JSON)
    private String params;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

**victor-bucketing 模块** (纯Java，无Spring依赖):
```
victor-bucketing/src/main/java/com/gateflow/victor/bucketing/
├── BucketEngine.java              # 分桶引擎
├── DomainLayerModel.java          # 域-层模型
├── VariantMatcher.java            # 版本匹配器
└── ExperimentConfigResolver.java  # 实验配置解析
```

**victor-infrastructure 模块**:
```
victor-infrastructure/src/main/java/com/gateflow/victor/infra/
├── mapper/
│   ├── ExperimentMapper.java
│   ├── LayerMapper.java
│   └ DomainMapper.java
│   └ VariantMapper.java
│   └ UserAssignmentMapper.java
│   └ ConfigVersionMapper.java
├── cache/
│   └ ExperimentCacheService.java  # Redis缓存
└ config/
│   └ RedisConfig.java
│   └ MybatisPlusConfig.java       # MyBatis-Plus配置
│   └ KafkaConfig.java
└── migration/
    └── V1__init_schema.sql        # Flyway初始化脚本
```

**victor-sdk 模块 (Java客户端SDK)**:
```
victor-sdk/src/main/java/com/gateflow/victor/sdk/
├── VictorClient.java              # SDK主客户端 (门面类)
├── VictorConfig.java              # SDK配置类
├── BucketingService.java          # 分桶服务 (复用victor-bucketing)
├── EventCollector.java            # 事件采集服务
├── ConfigFetcher.java             # 配置拉取服务 (HTTP客户端)
├── CacheManager.java              # 本地缓存管理 (Caffeine)
└── model/
│   ├── ExperimentConfig.java      # 实验配置模型
│   └ Variant.java                 # 版本模型
│   └ BucketResult.java            # 分桶结果
└── http/
│   └── VictorHttpClient.java      # HTTP客户端封装
└── listener/
│   └ ConfigChangeListener.java    # 配置变更监听器
└── pom.xml                        # 可独立发布到Maven仓库
```

**SDK使用示例**:

```java
// 其他Java服务集成Victor SDK示例
public class Application {
    
    public static void main(String[] args) {
        // 初始化Victor SDK
        VictorConfig config = VictorConfig.builder()
            .serverUrl("http://victor-service:8080")
            .apiKey("your-api-key")
            .pollingInterval(30)          // 30秒轮询
            .cacheExpiry(7 * 24 * 3600)   // 7天缓存
            .build();
            
        VictorClient victor = VictorClient.init(config);
        
        // 获取用户分桶结果
        String userId = "user_123";
        String variant = victor.getVariant(userId, "exp_recommend_ui");
        // 返回: "treatment_a" 或 "control" 或 null
        
        // 获取实验参数
        String color = victor.getParam(userId, "exp_button_color", "color", "blue");
        
        // 批量获取所有实验分桶
        Map<String, String> allVariants = victor.getAllVariants(userId);
        
        // 获取实验标签(用于埋点)
        List<ExperimentTag> tags = victor.getExperimentTags(userId);
        
        // 上报事件
        victor.trackEvent(userId, "click", Map.of("button_id", "submit"));
    }
}
```

**Mapper接口示例 (MyBatis-Plus)**:

```java
// ExperimentMapper.java
@Mapper
public interface ExperimentMapper extends BaseMapper<Experiment> {
    
    /**
     * 查询运行中的实验列表
     */
    @Select("SELECT * FROM victor_experiment WHERE status = 'running'")
    List<Experiment> selectRunningExperiments();
    
    /**
     * 查询实验及其版本 (一对多关联)
     */
    @Select("SELECT * FROM victor_experiment WHERE exp_id = #{expId}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "variants", column = "id",
                many = @Many(select = "com.gateflow.victor.infra.mapper.VariantMapper.selectByExpId"))
    })
    Experiment selectExperimentWithVariants(@Param("expId") String expId);
    
    /**
     * 查询指定层下的所有实验
     */
    @Select("SELECT * FROM victor_experiment WHERE layer_id = #{layerId} AND status IN ('running', 'ramp')")
    List<Experiment> selectByLayerId(@Param("layerId") Long layerId);
}

// VariantMapper.java
@Mapper
public interface VariantMapper extends BaseMapper<Variant> {
    
    /**
     * 查询实验的所有版本
     */
    @Select("SELECT * FROM victor_variant WHERE exp_id = #{expId}")
    List<Variant> selectByExpId(@Param("expId") Long expId);
    
    /**
     * 批量插入版本
     */
    @Insert("<script>" +
            "INSERT INTO victor_variant (exp_id, variant_key, name, bucket_start, bucket_end, params) VALUES " +
            "<foreach collection='variants' item='v' separator=','>" +
            "(#{v.expId}, #{v.variantKey}, #{v.name}, #{v.bucketStart}, #{v.bucketEnd}, #{v.params})" +
            "</foreach>" +
            "</script>")
    int batchInsert(@Param("variants") List<Variant> variants);
}

// ConfigVersionMapper.java
@Mapper
public interface ConfigVersionMapper extends BaseMapper<ConfigVersion> {
    
    /**
     * 查询最新配置版本
     */
    @Select("SELECT * FROM victor_config_version ORDER BY created_at DESC LIMIT 1")
    ConfigVersion selectLatestVersion();
    
    /**
     * 查询指定版本之后的变更
     */
    @Select("SELECT * FROM victor_config_version WHERE version > #{fromVersion} ORDER BY created_at")
    List<ConfigVersion> selectChangesAfterVersion(@Param("fromVersion") String fromVersion);
}

// MyBatis-Plus配置类
@Configuration
@MapperScan("com.gateflow.victor.infra.mapper")
public class MybatisPlusConfig {
    
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
    
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        // 自动填充 createTime / updateTime
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
            }
            @Override
            public void updateFill(MetaObject metaObject) {
                this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }
        };
    }
}
```

**victor-web 模块**:
```
victor-web/src/main/java/com/gateflow/victor/
├── controller/
│   ├── BucketingController.java   # 分桶计算API
│   └ ConfigController.java        # 配置下发API
│   └ EventController.java         # 事件上报API
│   └ ExperimentController.java    # 实验管理API
│   └ AnalysisController.java      # 统计分析API
└── VictorServiceApplication.java  # 启动类
```

### 2.3 核心接口设计

#### 2.3.1 分桶计算API

```java
@RestController
@RequestMapping("/api/v1/bucketing")
public class BucketingController {

    /**
     * 单实验分桶查询
     * @param userId 用户ID
     * @param experimentKey 实验标识
     * @return 分桶结果 {variant: "treatment_a" | "control" | null}
     */
    @GetMapping("/variant")
    public BucketingResponse getVariant(
        @RequestParam String userId,
        @RequestParam String experimentKey
    );

    /**
     * 批量分桶查询
     * @param userId 用户ID
     * @return 用户所有实验分桶结果 Map<expKey, variant>
     */
    @GetMapping("/all-variants")
    public AllVariantsResponse getAllVariants(@RequestParam String userId);
}
```

#### 2.3.2 配置下发API

```java
@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    /**
     * SDK启动拉取配置
     * @param version 当前SDK版本号(用于增量更新)
     * @param platform 平台标识 ios/android/web
     * @return 实验配置JSON
     */
    @GetMapping("/fetch")
    public ConfigResponse fetchConfig(
        @RequestParam(required = false) String version,
        @RequestParam String platform
    );

    /**
     * 增量配置更新(长轮询/WebSocket)
     * @param etag 配置版本标识
     * @return 变更的配置(无变更返回304)
     */
    @GetMapping("/poll")
    public ResponseEntity<ConfigResponse> pollConfig(@RequestParam String etag);
}
```

#### 2.3.3 SDK定时拉取配置机制

**设计理念**: 采用SDK定时拉取模式，简化架构，避免WebSocket/SSE的连接维护复杂度。

```
配置同步架构 (定时拉取模式):

┌─────────────────┐         ┌─────────────────┐
│   实验管理平台   │  发布   │   配置服务       │
│ (admin-console) │ ──────▶ │ ConfigService   │
└─────────────────┘         └───────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ 写入          │ 写入          │ 写入
                    ▼               ▼               ▼
            ┌──────────┐    ┌──────────┐    ┌──────────┐
            │  MySQL   │    │  Redis   │    │ Kafka   │
            │配置版本表│    │最新版本  │    │变更Topic│
            └──────────┘    └──────────┘    └──────────┘
                                    │
                                    │ SDK定时查询
                                    ▼
                    ┌─────────────────────────────┐
                    │        客户端 SDK            │
                    │   每30s轮询 → 版本比对 → 增量拉取 │
                    └─────────────────────────────┘
```

**服务端API设计**:

```java
@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    @Autowired
    private ConfigService configService;
    
    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 版本查询接口: SDK快速比对版本
     * @param version SDK当前持有的配置版本号
     * @return 200有更新(返回最新版本号), 304无更新
     */
    @GetMapping("/version")
    public ResponseEntity<VersionResponse> checkVersion(
        @RequestParam(required = false) String version,
        @RequestParam String platform
    ) {
        String latestVersion = redisTemplate.opsForValue().get("ab:config:latest:" + platform);
        
        if (latestVersion == null) {
            // Redis无缓存，从MySQL加载
            latestVersion = configService.getLatestVersion(platform);
        }
        
        if (version != null && version.equals(latestVersion)) {
            // 版号一致，无更新
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
        }
        
        // 有更新，返回最新版本号
        return ResponseEntity.ok(new VersionResponse(latestVersion, System.currentTimeMillis()));
    }

    /**
     * 配置拉取接口: SDK获取增量或全量配置
     * @param fromVersion SDK当前版本号(用于增量拉取)
     * @param platform 平台标识
     * @return 增量配置或全量配置
     */
    @GetMapping("/fetch")
    public ConfigResponse fetchConfig(
        @RequestParam(required = false) String fromVersion,
        @RequestParam String platform
    ) {
        if (fromVersion != null) {
            // 增量拉取: 只返回fromVersion之后的变更
            return configService.getIncrementalConfig(fromVersion, platform);
        }
        // 全量拉取: 返回完整配置
        return configService.getFullConfig(platform);
    }
    
    /**
     * 配置发布: 管理平台发布新配置时调用
     */
    @PostMapping("/publish")
    @Transactional
    public void publishConfig(@RequestBody ConfigPublishRequest request) {
        // 1. 写入MySQL配置版本表
        ConfigVersion newVersion = configService.saveConfigVersion(request);
        
        // 2. 更新Redis最新版本号
        redisTemplate.opsForValue().set(
            "ab:config:latest:" + request.getPlatform(), 
            newVersion.getVersion()
        );
        
        // 3. 发送Kafka变更事件 (供后续统计模块订阅)
        kafkaTemplate.send("victor-config-change", new ConfigChangeEvent(newVersion));
    }
}

// 版本响应DTO
public record VersionResponse(String version, long timestamp) {}

// 配置响应DTO
public class ConfigResponse {
    private String version;
    private String etag;
    private ConfigChangeType changeType; // FULL / INCREMENTAL
    private List<ExperimentConfig> experiments;
    private List<String> deletedExperimentIds; // 仅增量时有效
}
```

**SDK端定时拉取实现**:

```typescript
// SDK配置同步策略 (定时拉取模式)
class ConfigSyncManager {
    
    private currentVersion: string | null = null;
    private pollingInterval = 30000; // 30秒轮询间隔
    private offlineCacheExpiry = 7 * 24 * 3600 * 1000; // 7天离线缓存有效期
    
    /**
     * 启动定时轮询
     */
    startPolling() {
        // 立即拉取一次
        this.checkAndFetch();
        
        // 每30秒轮询版本
        setInterval(() => this.checkAndFetch(), this.pollingInterval);
    }
    
    /**
     * 检查版本并拉取更新
     */
    async checkAndFetch() {
        try {
            // Step 1: 版本查询 (轻量请求)
            const versionUrl = `/api/v1/config/version?platform=${this.platform}`;
            if (this.currentVersion) {
                versionUrl += `&version=${this.currentVersion}`;
            }
            
            const response = await fetch(versionUrl);
            
            if (response.status === 304) {
                // 无更新，继续使用本地配置
                return;
            }
            
            // Step 2: 有更新，拉取增量配置
            const { version } = await response.json();
            await this.fetchIncrementalConfig(version);
            
        } catch (error) {
            // 网络失败，使用本地缓存
            this.handleOfflineFallback(error);
        }
    }
    
    /**
     * 拉取增量配置
     */
    async fetchIncrementalConfig(newVersion: string) {
        const fetchUrl = `/api/v1/config/fetch?platform=${this.platform}`;
        if (this.currentVersion) {
            fetchUrl += `&fromVersion=${this.currentVersion}`;
        }
        
        const response = await fetch(fetchUrl);
        const config = await response.json();
        
        // 合并配置到本地
        this.configManager.merge(config);
        this.currentVersion = newVersion;
        
        // 更新本地持久化缓存
        this.cacheManager.save({
            version: newVersion,
            config: this.configManager.getConfig(),
            cachedAt: Date.now()
        });
    }
    
    /**
     * 离线兜底策略
     * 7天内本地缓存有效，超过7天警告但不阻塞业务
     */
    handleOfflineFallback(error: Error) {
        const cached = this.cacheManager.load();
        
        if (cached && (Date.now() - cached.cachedAt) < this.offlineCacheExpiry) {
            // 缓存未过期，继续使用
            console.warn('[AB SDK] 网络失败，使用本地缓存', error);
            this.configManager.setConfig(cached.config);
            this.currentVersion = cached.version;
        } else {
            // 缓存过期，警告但不阻塞
            console.error('[AB SDK] 本地缓存已过期(>7天)，配置可能过时');
            if (cached) {
                this.configManager.setConfig(cached.config);
            }
        }
    }
}
```

**拉取策略参数**:

| 参数 | 值 | 说明 |
|------|-----|------|
| **轮询间隔** | 30s | 平衡实时性与服务器压力 |
| **离线缓存有效期** | 7天 | 允许长时间离线运行 |
| **版本比对优先** | 是 | 先查版本再拉取，减少带宽 |
| **增量拉取** | 支持 | 只拉取变更的实验配置 |
| **配置生效延迟** | <30s | SDK轮询周期内生效 |

**设计优势**:

1. **架构简洁**: 无需维护WebSocket/SSE长连接
2. **服务端压力小**: 版本查询请求轻量(仅返回版本号)
3. **SDK实现简单**: 纯HTTP请求，无需处理连接断开重连
4. **离线友好**: 7天本地缓存兜底，适合移动端弱网环境
5. **跨平台一致**: iOS/Android/Web SDK使用相同策略

#### 2.4.1 MySQL表结构 (已修复P0外键问题)

```sql
-- 域配置表
CREATE TABLE victor_domain (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    domain_id VARCHAR(64) NOT NULL UNIQUE,  -- 业务ID，用于API
    name VARCHAR(128),
    traffic_ratio DECIMAL(4,4) DEFAULT 1.0,
    is_exclusive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain_id (domain_id)  -- 业务查询索引
);

-- 层配置表
CREATE TABLE victor_layer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    layer_id VARCHAR(64) NOT NULL,           -- 业务ID
    domain_id BIGINT NOT NULL,               -- 引用victor_domain.id主键
    name VARCHAR(128),
    salt VARCHAR(64),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- 外键引用主键id而非业务ID (已修复)
    FOREIGN KEY (domain_id) REFERENCES victor_domain(id),
    UNIQUE KEY uk_layer_domain (layer_id, domain_id),
    INDEX idx_layer_id (layer_id)            -- 业务查询索引
);

-- 实验配置表
CREATE TABLE victor_experiment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exp_id VARCHAR(64) NOT NULL UNIQUE,      -- 业务ID
    name VARCHAR(128) NOT NULL,
    description TEXT,
    layer_id BIGINT NOT NULL,                -- 引用victor_layer.id主键 (已修复)
    status ENUM('draft', 'review', 'ramp', 'running', 'paused', 'analyzing', 'decision', 'archive') DEFAULT 'draft',
    traffic_ratio DECIMAL(4,4),
    bucket_start INT,
    bucket_end INT,
    -- 移除variants JSON字段，使用victor_variant表作为唯一数据源 (已修复)
    targeting_rules JSON,
    primary_metric VARCHAR(64),
    secondary_metrics JSON,
    guardrail_metrics JSON,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (layer_id) REFERENCES victor_layer(id),
    INDEX idx_exp_id (exp_id),
    INDEX idx_status (status),
    INDEX idx_layer (layer_id)
);

-- 实验版本表 (唯一版本数据源)
CREATE TABLE victor_variant (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exp_id BIGINT NOT NULL,                  -- 引用victor_experiment.id主键 (已修复)
    variant_key VARCHAR(64) NOT NULL,
    name VARCHAR(128),
    bucket_start INT,
    bucket_end INT,
    params JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exp_id) REFERENCES victor_experiment(id),
    UNIQUE KEY uk_exp_variant (exp_id, variant_key),
    INDEX idx_exp_id (exp_id)
);

-- 用户分桶记录表 (新增: 用于审计和SRM检验)
CREATE TABLE victor_user_assignment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(64) NOT NULL,
    exp_id BIGINT NOT NULL,
    variant_key VARCHAR(64) NOT NULL,
    bucket INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_exp (user_id, exp_id),
    INDEX idx_exp_variant (exp_id, variant_key),
    INDEX idx_assigned_time (assigned_at)
) ENGINE=InnoDB;

-- 配置版本表 (新增: 支持配置变更追踪)
CREATE TABLE victor_config_version (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(32) NOT NULL UNIQUE,     -- 如: "20260505-143000"
    etag VARCHAR(16) NOT NULL,               -- 配置摘要
    config_json LONGTEXT,                    -- 完整配置快照
    change_type ENUM('full', 'incremental') DEFAULT 'full',
    changed_experiments JSON,                -- 变更的实验ID列表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_version (version)
);
```

**数据库设计修复说明**:

| 问题 | 修复方案 |
|------|---------|
| 外键引用业务ID | 改为引用主键`id`，业务ID保留用于API查询 |
| variants JSON冗余 | 移除JSON字段，`victor_variant`表作为唯一数据源 |
| 缺少用户分桶记录 | 新增`victor_user_assignment`表，支持审计和SRM检验 |
| 缺少配置版本追踪 | 新增`victor_config_version`表，支持增量更新 |

**生产环境建议**: 可移除物理外键约束，改用Service层逻辑校验，提升写入性能。

### 2.5 分桶算法实现

```java
public class BucketEngine {

    private static final int TOTAL_BUCKETS = 10000;
    private static final double MIN_GRANULARITY = 0.001; // 0.1%

    /**
     * 计算用户桶号
     * @param userId 用户ID
     * @param layerId 层ID
     * @param salt 盐值
     * @return 桶号 (0-9999)
     */
    public int computeBucket(String userId, String layerId, String salt) {
        String hashInput = userId + "#" + layerId + "#" + salt;
        int hash = MurmurHash3.hash32(hashInput.getBytes(StandardCharsets.UTF_8));
        return Math.abs(hash) % TOTAL_BUCKETS;
    }

    /**
     * 根据桶号查找实验版本
     * @param bucket 桶号
     * @param experiment 实验配置
     * @return 版本标识
     */
    public String findVariant(int bucket, Experiment experiment) {
        for (Variant variant : experiment.getVariants()) {
            if (bucket >= variant.getBucketStart() && bucket <= variant.getBucketEnd()) {
                return variant.getVariantKey();
            }
        }
        return null; // 未命中
    }
}
```

### 2.6 实施步骤 (多模块构建顺序)

| 步骤 | 模块 | 内容 | 产出 |
|------|------|------|------|
| **Step 1** | 父POM | 创建Maven多模块项目骨架 | `victor-service/pom.xml` + 子模块目录 |
| **Step 2** | victor-common | 实现MurmurHash3、常量、枚举 | `victor-common/pom.xml` + 工具类 |
| **Step 3** | victor-domain | 定义实体、DTO模型 | `victor-domain/pom.xml` + 领域类 |
| **Step 4** | victor-bucketing | 实现BucketEngine核心逻辑 | `victor-bucketing/pom.xml` + 单元测试 |
| **Step 5** | victor-infrastructure | 实现Mapper、Redis配置 | `victor-infrastructure/pom.xml` + Flyway脚本 |
| **Step 6** | victor-service | 实现业务服务层 | `victor-service模块/pom.xml` + Service类 |
| **Step 7** | victor-sdk | 实现Java客户端SDK | `victor-sdk/pom.xml` + SDK类 |
| **Step 8** | victor-web | 实现REST API + 启动类 | `victor-web/pom.xml` + Controller |
| **Step 9** | Docker化 | 容器化部署 | Dockerfile + compose.yml |

**模块构建顺序**:
```bash
# 1. 构建父POM
cd backend/victor-service
mvn clean install

# 2. 单独测试victor-bucketing (无Spring依赖)
cd victor-bucketing
mvn test

# 3. 启动完整服务
cd victor-web
mvn spring-boot:run
```

---

## 三、Phase 2: 实验管理API

### 3.1 目标

实现实验生命周期管理API，创建独立的实验管理前端。

### 3.2 API设计

```java
@RestController
@RequestMapping("/api/v1/experiments")
public class ExperimentController {

    @GetMapping
    Page<Experiment> listExperiments(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        Pageable pageable
    );

    @GetMapping("/{expId}")
    Experiment getExperiment(@PathVariable String expId);

    @PostMapping
    Experiment createExperiment(@RequestBody ExperimentCreateRequest request);

    @PutMapping("/{expId}")
    Experiment updateExperiment(
        @PathVariable String expId,
        @RequestBody ExperimentUpdateRequest request
    );

    @PostMapping("/{expId}/start")
    Experiment startExperiment(@PathVariable String expId);

    @PostMapping("/{expId}/pause")
    Experiment pauseExperiment(@PathVariable String expId);

    @PostMapping("/{expId}/stop")
    Experiment stopExperiment(@PathVariable String expId);

    @PostMapping("/{expId}/promote")
    Experiment promoteWinner(@PathVariable String expId, @RequestParam String variant);
}
```

### 3.3 创建独立的实验管理前端

新增独立的前端应用 `apps/experiment-console/`：

```
apps/experiment-console/
├── src/
│   ├── pages/
│   │   ├── ExperimentListPage.tsx     # 实验列表
│   │   ├── ExperimentDetailPage.tsx   # 实验详情(统计结果)
│   │   ├── CreateExperimentPage.tsx   # 创建实验
│   │   └── DomainLayerPage.tsx        # 域-层配置
│   ├── components/
│   │   ├── experiment/
│   │   ├── stats/
│   │   └── layout/
│   ├── stores/
│   │   └── experimentStore.ts
│   └── api/
│       └── experimentApi.ts           # 后端API调用
├── package.json
└── vite.config.ts
```

技术栈与现有前端保持一致：React + Vite + Tailwind CSS

---

## 四、Phase 3: Web SDK

### 4.1 目标

实现Web端分流SDK，支持纯本地分桶计算。

### 4.2 SDK结构

```
packages/victor-sdk/sdk-web/
├── src/
│   ├── index.ts                  # 入口导出
│   ├── VictorClient.ts           # SDK主类
│   ├── BucketEngine.ts           # 分桶引擎(移植Java逻辑)
│   ├── ConfigManager.ts          # 配置管理
│   ├── MurmurHash3.ts            # MurmurHash3实现
│   ├── types/
│   │   ├── ExperimentConfig.ts   # 配置类型定义
│   │   ├── Variant.ts            # 版本类型
│   │   └── BucketResult.ts       # 分桶结果类型
│   ├── cache/
│   │   ├── LocalStorageCache.ts  # localStorage缓存
│   │   └ IndexedDBCache.ts       # IndexedDB缓存(大配置)
│   ├── hooks/
│   │   └── useExperiment.ts      # React Hook
│   └── utils/
│       ├── eventInjector.ts      # 埋点注入工具
│       └ PromiseUtils.ts         # 工具函数
├── package.json
├── tsconfig.json
└── rollup.config.js              # 多格式打包(ESM/CJS/UMD)
```

### 4.3 核心接口

```typescript
// packages/victor-sdk/sdk-web/src/VictorClient.ts

export class VictorClient {
  private configManager: ConfigManager;
  private bucketEngine: BucketEngine;

  /**
   * 初始化SDK
   */
  async initialize(options: VictorClientOptions): Promise<void>;

  /**
   * 获取用户在某个实验中的分组
   */
  getVariant(userId: string, experimentKey: string): string | null;

  /**
   * 批量获取用户所有实验分组
   */
  getAllVariants(userId: string): Record<string, string | null>;

  /**
   * 获取实验参数
   */
  getParam<T>(userId: string, experimentKey: string, paramKey: string, defaultValue: T): T;

  /**
   * 获取实验标签(用于埋点)
   */
  getExperimentTags(userId: string): ExperimentTag[];
}
```

### 4.4 React Hook

```typescript
// packages/victor-sdk/sdk-web/src/hooks/useExperiment.ts

export function useExperiment(experimentKey: string): {
  variant: string | null;
  isLoading: boolean;
  isReady: boolean;
} {
  const [variant, setVariant] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    VictorClient.onReady(() => {
      const userId = getCurrentUserId(); // 从业务层获取
      const v = VictorClient.getVariant(userId, experimentKey);
      setVariant(v);
      setIsReady(true);
    });
  }, [experimentKey]);

  return { variant, isLoading: !isReady, isReady };
}
```

---

## 五、Phase 4: 数据采集管道

### 5.1 目标

实现事件数据采集链路，支持埋点数据流入存储。

### 5.2 组件设计

数据采集模块整合到 `backend/victor-service/src/main/java/com/gateflow/victor/ingestion/`:

```
backend/victor-service/src/main/java/com/gateflow/victor/
├── ingestion/                   # 数据采集模块
│   ├── EventController.java     # 事件上报API
│   ├── EventService.java        # 事件处理服务
│   ├── EventProducer.java       # Kafka生产者
│   ├── EventRequest.java        # 事件请求DTO
│   ├── VictorEvent.java         # 事件实体
│   └── ExperimentTag.java       # 实验标签
```

### 5.3 事件上报API

```java
@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    /**
     * 批量事件上报
     */
    @PostMapping("/batch")
    public EventResponse reportEvents(@RequestBody List<EventRequest> events);

    /**
     * 单事件上报
     */
    @PostMapping("/single")
    public EventResponse reportEvent(@RequestBody EventRequest event);
}
```

### 5.4 事件Schema

```json
{
  "event_id": "uuid",
  "event_name": "click",
  "user_id": "user_123",
  "timestamp": 1714900000,
  "platform": "web",
  "page_id": "home",
  "victor_tags": [
    {"exp_id": "exp_001", "variant": "treatment_a", "layer": "recommend"},
    {"exp_id": "exp_003", "variant": "control", "layer": "ui"}
  ],
  "properties": {
    "element_id": "btn_submit",
    "element_type": "button"
  }
}
```

### 5.5 事件去重与数据完整性机制 (P0修复)

**问题**: 事件重复上报会导致统计偏差，需设计去重机制。

**去重架构设计**:

```
事件处理流程:

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  SDK上报    │───▶│ Schema校验  │───▶│  去重判断   │───▶│  Kafka发送  │
│ (批量1000)  │    │ EventValidator│   │ Deduplicator│   │ EventProducer│
└─────────────┘    └─────────────┘    └──────┬──────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Redis     │
                                       │ SETNX去重   │
                                       │ 24h过期    │
                                       └─────────────┘
```

**去重服务实现**:

```java
@Service
public class EventDeduplicator {
    
    private final StringRedisTemplate redis;
    private static final Duration DEDUP_EXPIRE = Duration.ofHours(24);
    
    /**
     * 判断事件是否重复
     * 使用 event_id + timestamp 作为唯一键
     * Redis SETNX实现原子性去重
     */
    public DedupResult checkDuplicate(EventRequest event) {
        String dedupKey = buildDedupKey(event);
        
        // SETNX: 设置成功表示首次，设置失败表示已存在(重复)
        Boolean success = redis.opsForValue()
            .setIfAbsent(dedupKey, 
                String.valueOf(event.getTimestamp()), 
                DEDUP_EXPIRE);
        
        if (Boolean.TRUE.equals(success)) {
            return DedupResult.unique();
        } else {
            return DedupResult.duplicate(event.getEventId());
        }
    }
    
    /**
     * 构建去重键
     * 格式: ab:event:dedup:{event_id}:{timestamp_hour}
     * timestamp_hour用于防止跨天重复
     */
    private String buildDedupKey(EventRequest event) {
        long hourBucket = event.getTimestamp() / 3600000; // 按小时分桶
        return String.format("ab:event:dedup:%s:%d", 
            event.getEventId(), hourBucket);
    }
    
    /**
     * 批量去重检查
     * 返回去重后的有效事件列表
     */
    public List<EventRequest> filterDuplicates(List<EventRequest> events) {
        List<EventRequest> uniqueEvents = new ArrayList<>();
        List<String> duplicateIds = new ArrayList<>();
        
        for (EventRequest event : events) {
            DedupResult result = checkDuplicate(event);
            if (result.isUnique()) {
                uniqueEvents.add(event);
            } else {
                duplicateIds.add(result.getDuplicateId());
            }
        }
        
        return uniqueEvents;
    }
}
```

**Schema校验服务实现**:

```java
@Service
public class EventValidator {
    
    /**
     * 校验事件Schema完整性
     * 校验失败的事件会被拒绝，返回错误信息
     */
    public ValidationResult validate(EventRequest event) {
        List<String> errors = new ArrayList<>();
        
        // 1. 必填字段校验
        if (event.getEventId() == null || event.getEventId().isEmpty()) {
            errors.add("event_id缺失");
        }
        if (event.getUserId() == null || event.getUserId().isEmpty()) {
            errors.add("user_id缺失");
        }
        if (event.getEventName() == null || event.getEventName().isEmpty()) {
            errors.add("event_name缺失");
        }
        
        // 2. 时间戳校验 (防止时钟偏移导致的异常数据)
        long now = System.currentTimeMillis();
        long deviation = Math.abs(event.getTimestamp() - now);
        if (deviation > 3600000) { // 1小时偏差阈值
            errors.add(String.format("时间戳偏差过大: %dms", deviation));
        }
        
        // 3. 时间戳不可在未来
        if (event.getTimestamp() > now + 300000) { // 5分钟容许偏差
            errors.add("时间戳在未来，数据无效");
        }
        
        // 4. victor_tags格式校验 (非强制，但需校验格式)
        if (event.getVictorTags() != null) {
            for (ExperimentTag tag : event.getVictorTags()) {
                if (tag.getExpId() == null || tag.getVariant() == null) {
                    errors.add("victor_tags格式不完整");
                    break;
                }
            }
        }
        
        if (errors.isEmpty()) {
            return ValidationResult.success();
        } else {
            return ValidationResult.fail(errors);
        }
    }
}
```

**SDK端事件缓存策略**:

```typescript
// SDK本地事件缓存 (网络失败时不丢数据)
class EventCacheManager {
    
    private eventQueue: EventRequest[] = [];
    private maxCacheSize = 1000;
    
    /**
     * 添加事件到本地队列
     */
    addEvent(event: EventRequest): void {
        this.eventQueue.push(event);
        
        // 达到批量阈值时自动上报
        if (this.eventQueue.length >= 100) {
            this.flush();
        }
        
        // 超过最大缓存时，存入IndexedDB持久化
        if (this.eventQueue.length > this.maxCacheSize) {
            this.persistToIndexedDB();
        }
    }
    
    /**
     * 批量上报
     */
    async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            const response = await fetch('/api/v1/events/batch', {
                method: 'POST',
                body: JSON.stringify(events)
            });
            
            if (!response.ok) {
                // 网络失败，事件回队列
                this.eventQueue.unshift(...events);
                setTimeout(() => this.flush(), 5000);
            }
        } catch (error) {
            this.eventQueue.unshift(...events);
            this.persistToIndexedDB();
        }
    }
    
    /**
     * IndexedDB持久化 (离线兜底)
     */
    persistToIndexedDB(): void {
        const db = new IndexedDBCache('victor_events');
        db.save('pending_events', this.eventQueue);
    }
}
```

**数据完整性保障机制**:

| 机制 | 作用 | 实现方式 |
|------|------|---------|
| **事件去重** | 防止重复计算 | Redis SETNX + 24h过期 |
| **Schema校验** | 防止脏数据 | 必填字段 + 时间戳校验 |
| **SDK本地缓存** | 防止网络丢数据 | IndexedDB持久化 |
| **Kafka持久化** | 防止处理丢数据 | Kafka ACK + 重试 |
| **幂等性保证** | Kafka重消费安全 | event_id唯一键 |

---

## 六、Phase 5: 统计分析引擎

### 6.1 目标

实现核心统计检验方法，生成实验分析报告。

### 6.2 组件设计

统计分析模块整合到 `backend/victor-service/src/main/java/com/gateflow/victor/stats/`:

```
backend/victor-service/src/main/java/com/gateflow/victor/
├── stats/                       # 统计分析模块
│   ├── AnalysisController.java  # 分析API
│   ├── ReportController.java    # 报告API
│   ├── AnalysisService.java     # 分析服务
│   ├── SRMTest.java             # SRM检验
│   ├── WelchTTest.java          # Welch t检验
│   ├── CUPEDReducer.java        # CUPED方差缩减
│   ├── BHCorrection.java        # BH-FDR校正
│   ├── mSPRT.java               # 序贯检验
│   ├── StatisticalResult.java   # 统计结果DTO
│   ├── ExperimentReport.java    # 实验报告DTO
│   └── MetricMapper.java       # 指标数据查询
```

### 6.3 统计检验实现

```java
public class WelchTTest {

    /**
     * 执行Welch t检验
     * @param control 对照组数据
     * @param treatment 实验组数据
     * @return 统计结果 {tValue, pValue, ciLower, ciUpper}
     */
    public StatisticalResult execute(
        SampleData control,
        SampleData treatment
    ) {
        double meanDiff = treatment.getMean() - control.getMean();
        double se = computeStandardError(control, treatment);
        double tValue = meanDiff / se;
        double pValue = computePValue(tValue, df);
        double[] ci = computeConfidenceInterval(meanDiff, se, df);

        return new StatisticalResult(tValue, pValue, ci[0], ci[1]);
    }
}
```

---

## 七、部署架构

### 7.1 开发环境

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: victor_experiment
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    ports:
      - "9092:9092"

  victor-service:
    build: ./backend/victor-service
    ports:
      - "8080:8080"
    depends_on: [mysql, redis]
```

### 7.2 生产环境架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Ingress                           │
│                    (负载均衡 + SSL)                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ victor-svc-1 │   │ victor-svc-2 │   │ victor-svc-3 │
        │ (分流)   │   │ (分流)   │   │ (分流)   │
        └──────────┘   └──────────┘   └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  MySQL   │   │  Redis   │   │  Kafka   │
        │ (主从)   │   │ (集群)   │   │ (集群)   │
        └──────────┘   └──────────┘   └──────────┘
```

---

## 八、里程碑规划

| Phase | 内容 | 关键产出 |
|-------|------|---------|
| **Phase 1** | 分流服务核心 | BucketEngine + 配置API + MySQL模型 |
| **Phase 2** | 实验管理API + 前端 | CRUD接口 + 独立实验管理前端 |
| **Phase 3** | Web SDK | 纯本地分桶 + React Hook |
| **Phase 4** | 数据采集管道 | 事件上报API + Kafka集成 |
| **Phase 5** | 统计分析引擎 | t检验 + CUPED + 报告生成 |

---

## 九、下一步行动

1. **创建Java项目骨架**: `backend/victor-service`
2. **实现MurmurHash3**: 移植高性能哈希算法
3. **实现BucketEngine**: 分桶计算核心逻辑
4. **定义MySQL Schema**: victor_domain/victor_layer/victor_experiment表结构
5. **实现配置下发API**: SDK启动配置拉取
6. **实现victor-sdk Java客户端**: 供其他Java服务集成

> **建议**: 先从Phase 1开始，验证分桶算法正确性后再推进后续模块。