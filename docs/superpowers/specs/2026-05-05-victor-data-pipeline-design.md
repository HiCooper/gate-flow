# Victor 数据采集管道设计文档

## 1. 概述

本文档描述Victor AB实验平台的数据采集管道设计，用于收集用户行为事件并存储到ClickHouse进行分析。

### 1.1 设计目标

- 支持SDK埋点事件采集
- 使用Kafka作为消息缓冲
- ClickHouse作为OLAP存储
- 轻量级架构，易于部署和维护

### 1.2 技术选型

| 组件 | 技术 | 版本 |
|------|------|------|
| 消息队列 | Apache Kafka | 3.x |
| 数据库 | ClickHouse | 24.x |
| 框架 | Spring Boot | 3.4.0 |
| Kafka客户端 | spring-kafka | 3.1.3 |

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Victor Data Pipeline                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐    ┌─────────────────┐    ┌─────────┐    ┌──────────────┐  │
│  │   SDK   │───▶│  HTTP API      │───▶│  Kafka  │───▶│  ClickHouse  │  │
│  │ (Web/   │    │  (Event        │    │  Topic  │    │  Storage     │  │
│  │  Mobile)│    │   Collector)   │    │         │    │              │  │
│  └─────────┘    └─────────────────┘    └─────────┘    └──────────────┘  │
│       │                 │                   │                 │         │
│       │                 │                   │                 ▼         │
│       │                 │                   │         ┌──────────────┐  │
│       │                 │                   │         │  Stats       │  │
│       │                 │                   │         │  Engine      │  │
│       │                 │                   │         │  (Future)    │  │
│       └─────────────────┴───────────────────┴─────────┴──────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 数据流说明

1. **SDK埋点**: 客户端(Web/Mobile)通过SDK采集用户行为事件
2. **HTTP API**: 接收SDK上报的事件，进行基础验证
3. **Kafka**: 作为消息缓冲，解耦采集和存储
4. **ClickHouse**: 存储事件数据，支持高性能OLAP查询

---

## 3. 模块结构

所有功能放在单一模块 `victor-pipeline` 中：

```
victor-pipeline/
├── src/main/java/com/gateflow/victor/pipeline/
│   ├── ingestion/                    # 事件采集
│   │   ├── EventController.java      # HTTP API入口
│   │   ├── EventKafkaProducer.java   # Kafka生产者
│   │   └── dto/
│   │       ├── EventRequest.java     # 事件请求DTO
│   │       └── EventResponse.java     # 事件响应DTO
│   │
│   ├── consumer/                     # 事件消费
│   │   ├── EventConsumer.java        # Kafka消费者
│   │   └── ClickHouseWriter.java     # ClickHouse写入器
│   │
│   ├── storage/                      # ClickHouse集成
│   │   ├── ClickHouseConfig.java     # ClickHouse配置
│   │   ├── EventRecord.java          # 事件记录实体
│   │   └── EventRepository.java      # 数据访问层
│   │
│   └── migration/                    # DDL迁移
│       └── V1__create_events_table.sql
│
└── pom.xml
```

---

## 4. 事件Schema设计

### 4.1 事件JSON格式

```json
{
  "eventId": "evt_20260505_abc123",
  "eventType": "click",
  "userId": "user_12345",
  "timestamp": 1714900000000,
  "platform": "web",
  "deviceId": "device_xyz",
  "sessionId": "session_001",
  "experimentTags": [
    {
      "expId": "exp_recommend_v2",
      "variant": "treatment_a",
      "layer": "recommend"
    }
  ],
  "properties": {
    "pageId": "home",
    "elementId": "buy_button"
  }
}
```

### 4.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| eventId | String | 是 | 事件唯一ID，格式: evt_日期_随机串 |
| eventType | String | 是 | 事件类型: click, view, convert等 |
| userId | String | 是 | 用户ID |
| timestamp | Long | 是 | 事件时间戳(毫秒) |
| platform | String | 否 | 平台: web, ios, android |
| deviceId | String | 否 | 设备ID |
| sessionId | String | 否 | 会话ID |
| experimentTags | Array | 否 | 实验标签数组 |
| properties | Object | 否 | 自定义属性 |

### 4.3 实验标签格式

```json
{
  "expId": "实验ID",
  "variant": "变体标识",
  "layer": "流量层"
}
```

---

## 5. ClickHouse表结构

### 5.1 事件表DDL

```sql
CREATE DATABASE IF NOT EXISTS victor;

CREATE TABLE IF NOT EXISTS victor.events (
    -- 分区和排序
    event_date Date DEFAULT toDate(timestamp),
    event_id String,
    event_type String,
    user_id String,
    timestamp DateTime64(3),
    platform String,
    device_id String,
    session_id String,

    -- 实验标签 (数组存储，便于查询)
    exp_ids Array(String),
    variants Array(String),
    layers Array(String),

    -- 自定义属性 (JSON字符串)
    properties String,

    -- 系统字段
    received_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(event_date)
ORDER BY (event_date, event_type, user_id, timestamp)
SETTINGS index_granularity = 8192;

-- 索引优化
ALTER TABLE victor.events ADD INDEX idx_user_id user_id TYPE bloom_filter(0.01) GRANULARITY 4;
ALTER TABLE victor.events ADD INDEX idx_event_type event_type TYPE set(100) GRANULARITY 4;
```

### 5.2 查询优化说明

- **分区策略**: 按日期分区，便于数据管理和过期删除
- **排序键**: (event_date, event_type, user_id, timestamp)
- **索引**: bloom_filter加速user_id查询，set索引加速event_type过滤

---

## 6. HTTP API设计

### 6.1 事件上报接口

**POST /api/v1/events**

请求体:
```json
{
  "events": [
    {
      "eventId": "evt_20260505_abc123",
      "eventType": "click",
      "userId": "user_12345",
      "timestamp": 1714900000000,
      "platform": "web",
      "deviceId": "device_xyz",
      "sessionId": "session_001",
      "experimentTags": [...],
      "properties": {...}
    }
  ]
}
```

响应体:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accepted": 10,
    "rejected": 0
  }
}
```

### 6.2 API特性

- 支持批量上报（单次最多100条）
- 异步处理，快速响应
- 基础校验：必填字段、时间戳有效性

---

## 7. Kafka配置

### 7.1 Topic配置

```yaml
# application.yml
kafka:
  topic:
    events: victor-events
    partitions: 6
    replication-factor: 3
```

### 7.2 生产者配置

```yaml
spring:
  kafka:
    producer:
      bootstrap-servers: localhost:9092
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
      batch-size: 16384
      buffer-memory: 33554432
      linger-ms: 5
      compression-type: lz4
```

### 7.3 消费者配置

```yaml
spring:
  kafka:
    consumer:
      bootstrap-servers: localhost:9092
      group-id: victor-consumer
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false
      max-poll-records: 500
      properties:
        spring.json.trusted.packages: "com.gateflow.victor.pipeline.dto"
```

---

## 8. Docker基础设施

### 8.1 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    volumes:
      - kafka-data:/var/lib/kafka/data

  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    ports:
      - "8123:8123"   # HTTP接口
      - "9000:9000"   # Native接口
    environment:
      CLICKHOUSE_DB: victor
      CLICKHOUSE_USER: victor
      CLICKHOUSE_PASSWORD: victor123
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
    volumes:
      - clickhouse-data:/var/lib/clickhouse
      - clickhouse-logs:/var/log/clickhouse-server
      - ./init-db:/docker-entrypoint-initdb.d

volumes:
  zookeeper-data:
  zookeeper-logs:
  kafka-data:
  clickhouse-data:
  clickhouse-logs:
```

### 8.2 初始化脚本

```sql
-- init-db/01-create-database.sql
CREATE DATABASE IF NOT EXISTS victor;

-- init-db/02-create-events-table.sql
-- 见第5节ClickHouse表结构
```

---

## 9. 依赖配置

### 9.1 pom.xml依赖

```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Kafka -->
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>

    <!-- ClickHouse JDBC -->
    <dependency>
        <groupId>com.clickhouse</groupId>
        <artifactId>clickhouse-jdbc</artifactId>
        <version>0.6.0</version>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## 10. 后续扩展

### 10.1 短期计划

- [ ] 实现统计分析引擎核心算法
- [ ] 添加数据质量监控
- [ ] 实现数据回填机制

### 10.2 长期规划

- [ ] 支持Flink实时计算
- [ ] 添加数据脱敏功能
- [ ] 实现多租户隔离

---

## 附录

### A. 事件类型枚举

| 类型 | 说明 |
|------|------|
| view | 页面浏览 |
| click | 点击事件 |
| convert | 转化事件 |
| exposure | 曝光事件 |
| custom | 自定义事件 |

### B. 错误码定义

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |