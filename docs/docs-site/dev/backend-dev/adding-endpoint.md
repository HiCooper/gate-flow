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

在 `victor-web` 中实现 REST 端点：

```java
@RestController
@RequestMapping("/api/v1/experiments")
@RequiredArgsConstructor
@Tag(name = "Experiment API")
public class ExperimentController {

    private final ExperimentService experimentService;

    @PostMapping
    @Operation(summary = "创建实验")
    public ExperimentResponse create(@RequestBody @Valid CreateExperimentRequest request) {
        Experiment experiment = experimentService.createExperiment(request);
        return toResponse(experiment);
    }
}
```

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
| ExperimentController | /api/v1/experiments | 实验管理 |
| LayerController | /api/v1/layers | 层级管理 |
| VariantController | /api/v1/variants | 变体管理 |
| ConfigController | /api/v1/config | SDK 配置 |
| EventController | /api/v1/events | 事件上报 |