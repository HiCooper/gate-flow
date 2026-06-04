# 添加新接口

本文档介绍如何在 GateFlow 后端添加新的 REST API 接口。

## 新增接口步骤

### 1. 定义 DTO

在 `victor-domain/src/main/java/com/gateflow/victor/domain/dto/` 下创建请求/响应对象：

```java
// 请求 DTO
@Data
public class CreateExperimentRequest {
    private String name;
    private Long layerId;
    private List<VariantRequest> variants;
}

// 响应 DTO
@Data
public class ExperimentResponse {
    private Long id;
    private String expId;
    private String name;
    private String status;
}
```

### 2. 扩展 Service

在 `victor-service` 中添加业务逻辑：

```java
@Service
@RequiredArgsConstructor
public class ExperimentService {

    private final ExperimentMapper experimentMapper;

    public Experiment createExperiment(CreateExperimentRequest request) {
        Experiment experiment = new Experiment();
        experiment.setName(request.getName());
        // ...
        experimentMapper.insert(experiment);
        return experiment;
    }
}
```

### 3. 实现 Controller

在 `victor-starter/src/main/java/com/gateflow/victor/controller/` 下实现 REST 端点：

```java
@RestController
@RequestMapping("/api/v1/experiments")
@RequiredArgsConstructor
@Tag(name = "Experiment API")
public class ExperimentController {

    private final ExperimentService experimentService;

    @PostMapping
    @RequirePermission(Permission.CREATE_EXPERIMENT)  // 权限校验
    @Operation(summary = "创建实验")
    public ExperimentResponse create(@RequestBody @Valid CreateExperimentRequest request) {
        Experiment experiment = experimentService.createExperiment(request);
        return toResponse(experiment);
    }
}
```

::: tip 权限控制
使用 `@RequirePermission` 注解控制接口访问权限。系统通过 `PermissionInterceptor` 从 JWT Token 中提取用户角色并校验权限。无需认证的接口（`/api/v1/auth/**`、`/api/v1/config/**`、`/api/v1/bucketing/**`）在 `SecurityConfig` 中白名单放行。
:::

### 4. 添加 Swagger 注解

使用 SpringDoc OpenAPI 注解：

```java
@Operation(
    summary = "创建实验",
    description = "创建一个新的 A/B 测试实验"
)
@ApiResponse(
    responseCode = "201",
    description = "创建成功"
)
```

### 5. 编写测试

为新接口编写单元测试：

```java
@WebMvcTest(ExperimentController.class)
class ExperimentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateExperiment() throws Exception {
        mockMvc.perform(post("/api/v1/experiments")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"test\"}"))
            .andExpect(status().isCreated());
    }
}
```

## API 规范

- 路径: `/api/v1/{resource}`
- 请求体: JSON 格式
- 响应: 统一包装或直接返回实体
- 错误: 使用统一异常处理

## 已有 API 列表

| Controller | 路径 | 说明 |
|-----------|------|------|
| AuthController | `/api/v1/auth` | JWT 登录/注册 |
| ExperimentController | `/api/v1/experiments` | 实验管理 |
| ExperimentStatisticsController | `/api/v1/experiments` | 实验统计分析 |
| ExperimentVersionController | `/api/v1/experiments/{expId}/versions` | 实验版本管理 |
| ExperimentReportController | `/api/v1/reports` | 分析报告 |
| LayerController | `/api/v1/layers` | 层级管理 |
| DomainController | `/api/v1/domains` | 业务域管理 |
| BucketController | `/api/v1/buckets` | 分桶/变体管理 |
| BucketingController | `/api/v1/bucketing` | 运行时分流 |
| ConfigController | `/api/v1/config` | SDK 配置拉取 |
| EventController | `/api/v1/events` | 事件上报 |
| MetricsController | `/api/v1/metrics` | 指标查询 |
| BanditController | `/api/v1/bandit` | 多臂老虎机优化 |
| BayesianAnalysisController | `/api/v1/analysis` | 贝叶斯分析 |
| PowerAnalysisController | `/api/v1/power-analysis` | 样本量估算 |
| RampController | `/api/v1/ramp` | 灰度自动推进 |
| TrafficMapController | `/api/v1/traffic` | 流量地图 |
| ExperimentWhitelistController | `/api/v1/whitelist` | 白名单管理 |
| RbacController | `/api/v1/rbac` | 角色权限管理 |
| SubgroupAnalysisController | `/api/v1/subgroup-analysis` | 子群分析 |