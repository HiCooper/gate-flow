# 全链路分布式追踪

本文档描述 victor-ab 全链路分布式追踪的技术方案、配置与使用方式。

## 技术选型

采用 **Micrometer Tracing + Brave** 方案：

| 组件 | 说明 |
|------|------|
| Micrometer Tracing | Spring Boot 3.x 原生追踪抽象层 |
| Brave | Zipkin 出身的埋点库，与 Spring Boot 集成最成熟 |
| Zipkin Reporter | 可选导出器，配置 `ZIPKIN_ENDPOINT` 后自动上报 |

**选型依据：** 相比直接使用 OpenTelemetry SDK，Micrometer Tracing + Brave 在 Spring Boot 3.4 中零配置即可获得 HTTP、JDBC、Kafka、Redis、`@Scheduled` 的全自动 Span 埋点。

## 架构

```mermaid
graph TB
    subgraph victor-starter
        HTTP[HTTP API]
        KafkaP[Kafka Producer]
        JDBC1[JDBC/MySQL]
        Redis1[Redis]
    end

    subgraph Kafka
        Topic[victor-events]
    end

    subgraph victor-service
        Sched[@Scheduled Jobs]
        JDBC2[JDBC/MySQL]
        CH[ClickHouse]
        Redis2[Redis]
    end

    subgraph Export
        Zipkin[Zipkin Server<br/>可选]
    end

    HTTP -->|traceId 自动注入| KafkaP
    KafkaP -->|traceId 写入 W3C header| Topic
    Topic -->|traceId 提取| JDBC2
    JDBC1 -.->|上报| Zipkin
    JDBC2 -.->|上报| Zipkin
```

## Span 覆盖范围

所有组件通过 Spring Boot 自动装配生成 Span，无需手动埋点：

| 组件 | Span 名称 | 激活方式 |
|------|----------|----------|
| HTTP 请求 | `http_server_requests` | WebMvc 自动装配 |
| MySQL | `jdbc_query` | DataSource Observation 自动装配 |
| Redis | `lettuce_command` | Lettuce Observation 自动装配 |
| Kafka Producer | `spring_kafka_template` | `template.observation-enabled: true` |
| Kafka Consumer | `spring_kafka_listener` | `listener.observation-enabled: true` |
| @Scheduled | `@Scheduled` 方法名 | Micrometer Observation 自动装配 |

> **Kafka 跨进程传播：** Spring Kafka 自动将 `traceId`/`spanId` 写入消息的 W3C Trace Context header，消费者端自动提取并创建父子 Span 关联。

## 配置

### 依赖

victor-starter 和 victor-service 的 `pom.xml` 中均已添加：

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-brave</artifactId>
</dependency>
```

两个依赖的版本均由 Spring Boot 3.4 BOM 管理，无需手动指定。

### application.yml

```yaml
# 开发环境：全量采样
management:
  tracing:
    sampling:
      probability: 1.0
  # Zipkin 默认不启用（endpoint 为空）
  zipkin:
    tracing:
      endpoint: ${ZIPKIN_ENDPOINT:}

# Kafka 观察
spring:
  kafka:
    listener:
      observation-enabled: true
    template:
      observation-enabled: true

# 日志中显示 traceId/spanId
logging:
  pattern:
    level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

### 采样策略建议

| 环境 | `sampling.probability` | 说明 |
|------|----------------------|------|
| 开发 | 1.0 | 全部保留，便于调试 |
| 测试 | 0.5 | 覆盖足够场景 |
| 生产 | 0.1 | 每秒 1000 req 时存 100 条 span，控制存储成本 |

## 日志效果

配置生效后，日志格式从：

```
DEBUG [victor-service] Processing experiment exp_001
```

变为：

```
DEBUG [victor-service,6635a8f2c3d4e5a6,a3b2c1d4] Processing experiment exp_001
```

其中 `6635a8f2c3d4e5a6` 是 traceId，`a3b2c1d4` 是 spanId。同一次请求的所有日志携带相同 traceId。

## 生产环境部署 Zipkin

> **注意：** Zipkin Server 仅用于可视化查询调用链，**不影响** traceId 生成与日志输出。不部署 Zipkin 时，traceId 依然在日志中显示、跨服务传播也正常工作——只是不能按调用链维度在 UI 中搜索。

```bash
# 启动 Zipkin Server
docker run -d --name zipkin -p 9411:9411 openzipkin/zipkin

# 配置环境变量
export ZIPKIN_ENDPOINT=http://zipkin-host:9411/api/v2/spans
```

Zipkin UI 访问 `http://localhost:9411`，可按 traceId 或服务名搜索调用链。

## 自定义 Span

需要为特定业务逻辑创建 Span 时，注入 `ObservationRegistry`：

```java
@Component
public class BucketingService {
    private final ObservationRegistry registry;

    public BucketResult compute(String userId, ExperimentSpec exp) {
        return Observation.createNotStarted("bucketing.compute", registry)
            .lowCardinalityKeyValue("layerId", exp.getLayerId())
            .observe(() -> BucketEngine.computeBucketResult(userId, exp));
    }
}
```

`Observation.observe()` 自动创建 Span、记录异常、记录耗时，无需手动 `try-finally`。
