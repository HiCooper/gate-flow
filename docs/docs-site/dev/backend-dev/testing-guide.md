# 测试指南

本文档介绍 GateFlow 的测试策略和编写指南。

## 测试框架

| 类型 | 框架 | 说明 |
|------|------|------|
| 单元测试 | JUnit 5 | 基础测试框架 |
| Mock | Mockito | 模拟依赖 |
| 集成测试 | Spring Boot Test | 完整上下文测试 |
| Controller 测试 | @WebMvcTest | API 层测试 |

## 测试目录结构

```
victor-service/src/test/java/com/gateflow/victor/
├── service/
│   ├── experiment/
│   │   └── ExperimentServiceTest.java
│   └── config/
│       └── ConfigServiceTest.java
victor-web/src/test/java/com/gateflow/victor/
└── controller/
    └── ExperimentControllerTest.java
```

## 测试示例

### Service 层测试

```java
@ExtendWith(MockitoExtension.class)
class ExperimentServiceTest {

    @Mock
    private ExperimentMapper experimentMapper;

    @InjectMocks
    private ExperimentService experimentService;

    @Test
    void shouldCreateExperiment() {
        Experiment experiment = new Experiment();
        experiment.setName("Test Experiment");

        when(experimentMapper.insert(any())).thenReturn(1);

        Experiment result = experimentService.createExperiment(experiment);

        assertNotNull(result);
        assertEquals("Test Experiment", result.getName());
    }
}
```

### Controller 层测试

```java
@WebMvcTest(ExperimentController.class)
class ExperimentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExperimentService experimentService;

    @Test
    void shouldReturnExperiment() throws Exception {
        when(experimentService.getById(1L)).thenReturn(experiment);

        mockMvc.perform(get("/api/v1/experiments/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test"));
    }
}
```

## 运行测试

```bash
cd backend/victor-ab

# 运行所有测试
mvn test

# 运行单个模块测试
mvn test -pl victor-bucketing

# 运行单个测试类
mvn test -Dtest=BucketEngineTest
```

## 分桶引擎测试

`victor-bucketing` 模块的测试确保分桶算法跨平台一致性：

```java
@Test
void shouldComputeSameBucketAcrossPlatforms() {
    int bucket = BucketEngine.computeBucket("user_123", "layer_001", "v1");
    assertEquals(7890, bucket); // 所有平台必须一致
}
```

## 覆盖率目标

- 核心业务逻辑: > 80%
- 分桶引擎: 100%
- Controller: > 70%