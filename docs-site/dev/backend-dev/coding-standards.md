# 编码规范

本文档介绍 GateFlow 后端的编码规范。

## Java 编码规范

### 基础规范

- 遵循阿里巴巴 Java 开发手册
- 使用 JDK 17+ 的语法特性（如 records、sealed classes）
- 文件编码统一使用 UTF-8

### 项目约束

| 规范 | 说明 |
|------|------|
| Lombok | 使用 `@Data`、`@Getter` 等简化代码 |
| MapStruct | DTO 与实体转换使用 MapStruct |
| 日志 | 使用 Slf4j + Lombok `@Slf4j` |

### 代码示例

**实体类**:
```java
@Data
@TableName("victor_experiment")
public class Experiment {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("exp_id")
    private String expId;

    private String name;
}
```

**Service 层**:
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ExperimentService {

    private final ExperimentMapper experimentMapper;

    public Experiment getById(Long id) {
        return experimentMapper.selectById(id);
    }
}
```

### 模块依赖原则

严格遵循自底向上的依赖关系：

```
victor-common → victor-domain → victor-service → victor-starter
victor-common ← victor-sdk (可嵌入 BucketEngine)
```

- `victor-common`: 纯 Java 工具库（含 BucketEngine 分桶引擎），无 Spring 依赖
- `victor-domain`: 实体、DTO，无业务逻辑
- `victor-service`: 业务逻辑层 + 数据访问 + 管道 + 统计分析
- `victor-sdk`: Java 客户端 SDK（可独立内嵌 victor-common 的分桶算法）
- `victor-starter`: Spring Boot 启动 + REST 控制器 + 安全配置

### 异常处理

使用统一的异常体系：

```java
throw new VictorException(ErrorCode.EXP_NOT_FOUND, expId);
```

### REST API 规范

- 使用 `/api/v1/` 前缀
- 使用名词而非动词：`/experiments` 而非 `/getExperiments`
- HTTP 方法语义正确：GET 查询、POST 创建、PUT 更新、DELETE 删除