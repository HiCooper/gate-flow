# Victor Pipeline & Stats Engine 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development 或 superpowers:executing-plans

**Goal:** 实现Kafka数据采集管道和统计分析引擎

**Architecture:** 
- victor-pipeline: SDK埋点 → HTTP API → Kafka → ClickHouse
- victor-stats: SRM检验 → CUPED方差缩减 → BH校正 → mSPRT序贯检验

**Tech Stack:** Spring Boot 3.4.0, Kafka, ClickHouse, Apache Commons Math3

---

## 文件结构

### victor-pipeline模块
```
backend/victor-service/victor-pipeline/
├── pom.xml
├── src/main/java/com/gateflow/victor/pipeline/
│   ├── ingestion/
│   │   ├── EventController.java
│   │   ├── EventKafkaProducer.java
│   │   └── dto/EventRequest.java, EventResponse.java, EventDTO.java, ExperimentTagDTO.java
│   ├── consumer/
│   │   ├── EventConsumer.java
│   │   └── ClickHouseWriter.java
│   ├── storage/
│   │   ├── ClickHouseConfig.java
│   │   ├── EventRecord.java
│   │   └── EventRepository.java
│   └── config/PipelineProperties.java
├── src/main/resources/
│   └── application-pipeline.yml
└── src/test/java/...单元测试
```

### victor-stats模块
```
backend/victor-service/victor-stats/
├── pom.xml
├── src/main/java/com/gateflow/victor/stats/
│   ├── model/
│   │   ├── SampleStatistics.java
│   │   ├── TestResult.java
│   │   ├── LiftEstimate.java
│   │   ├── ConfidenceInterval.java
│   │   ├── MetricType.java
│   │   ├── SequentialTestResult.java
│   │   ├── SequentialStatus.java
│   │   ├── Recommendation.java
│   │   ├── ExperimentReport.java
│   │   └── DateRange.java
│   ├── algorithm/
│   │   ├── SRMTest.java
│   │   ├── WelchTTest.java
│   │   ├── ZTest.java
│   │   ├── CUPED.java
│   │   ├── BHCorrection.java
│   │   └── mSPRT.java
│   ├── engine/
│   │   └── StatsEngine.java
│   └── config/StatsProperties.java
└── src/test/java/...单元测试
```

---

## Part A: victor-pipeline 数据采集管道

### Task A1: 创建victor-pipeline模块结构

**Files:**
- Create: `backend/victor-service/victor-pipeline/pom.xml`
- Modify: `backend/victor-service/pom.xml` (添加module)

- [ ] **Step 1: 创建pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.gateflow</groupId>
        <artifactId>victor-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>victor-pipeline</artifactId>
    <name>Victor Pipeline</name>
    <description>数据采集管道 - Kafka消息队列、ClickHouse存储</description>

    <dependencies>
        <dependency>
            <groupId>com.gateflow</groupId>
            <artifactId>victor-common</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <dependency>
            <groupId>com.clickhouse</groupId>
            <artifactId>clickhouse-jdbc</artifactId>
            <version>0.6.0</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 修改父pom.xml添加module**

在 `<modules>` 中添加 `<module>victor-pipeline</module>`

- [ ] **Step 3: 验证模块创建**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/victor-service/victor-pipeline/pom.xml backend/victor-service/pom.xml
git commit -m "feat: add victor-pipeline module structure"
```

---

### Task A2: 实现事件DTO模型

**Files:**
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/dto/EventDTO.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/dto/ExperimentTagDTO.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/dto/EventRequest.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/dto/EventResponse.java`

- [ ] **Step 1: 创建EventDTO**

```java
package com.gateflow.victor.pipeline.ingestion.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    @NotBlank(message = "eventId不能为空")
    private String eventId;
    
    @NotBlank(message = "eventType不能为空")
    private String eventType;
    
    @NotBlank(message = "userId不能为空")
    private String userId;
    
    @NotNull(message = "timestamp不能为空")
    private Long timestamp;
    
    private String platform;
    private String deviceId;
    private String sessionId;
    
    private List<ExperimentTagDTO> experimentTags;
    private Map<String, Object> properties;
}
```

- [ ] **Step 2: 创建ExperimentTagDTO**

```java
package com.gateflow.victor.pipeline.ingestion.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentTagDTO {
    private String expId;
    private String variant;
    private String layer;
}
```

- [ ] **Step 3: 创建EventRequest**

```java
package com.gateflow.victor.pipeline.ingestion.dto;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
public class EventRequest {
    @Valid
    @Size(max = 100, message = "单次最多上报100条事件")
    private List<EventDTO> events;
}
```

- [ ] **Step 4: 创建EventResponse**

```java
package com.gateflow.victor.pipeline.ingestion.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class EventResponse {
    private int accepted;
    private int rejected;
    private List<String> errors;
}
```

- [ ] **Step 5: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 6: Commit**

```bash
git add backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/dto/
git commit -m "feat: add event DTO models for pipeline"
```

---

### Task A3: 实现EventController

**Files:**
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/EventController.java`

- [ ] **Step 1: 创建EventController**

```java
package com.gateflow.victor.pipeline.ingestion;

import com.gateflow.victor.pipeline.ingestion.dto.EventRequest;
import com.gateflow.victor.pipeline.ingestion.dto.EventResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {
    
    private final EventKafkaProducer kafkaProducer;

    @PostMapping
    public ResponseEntity<EventResponse> collectEvents(@Valid @RequestBody EventRequest request) {
        log.debug("Received {} events", request.getEvents().size());
        
        List<String> errors = new ArrayList<>();
        int accepted = 0;
        int rejected = 0;

        for (var event : request.getEvents()) {
            try {
                // 时间戳校验
                if (event.getTimestamp() == null || event.getTimestamp() <= 0) {
                    errors.add("Event " + event.getEventId() + ": invalid timestamp");
                    rejected++;
                    continue;
                }
                
                kafkaProducer.sendEvent(event);
                accepted++;
            } catch (Exception e) {
                log.error("Failed to send event: {}", event.getEventId(), e);
                errors.add("Event " + event.getEventId() + ": " + e.getMessage());
                rejected++;
            }
        }

        return ResponseEntity.ok(EventResponse.builder()
            .accepted(accepted)
            .rejected(rejected)
            .errors(errors)
            .build());
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功（EventKafkaProducer尚未实现，先创建空类）

- [ ] **Step 3: Commit**

```bash
git add backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/EventController.java
git commit -m "feat: add EventController for event collection"
```

---

### Task A4: 实现EventKafkaProducer

**Files:**
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/ingestion/EventKafkaProducer.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/config/PipelineProperties.java`

- [ ] **Step 1: 创建PipelineProperties**

```java
package com.gateflow.victor.pipeline.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "victor.pipeline")
public class PipelineProperties {
    private String kafkaTopic = "victor-events";
    private int batchSize = 100;
}
```

- [ ] **Step 2: 创建EventKafkaProducer**

```java
package com.gateflow.victor.pipeline.ingestion;

import com.gateflow.victor.pipeline.config.PipelineProperties;
import com.gateflow.victor.pipeline.ingestion.dto.EventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventKafkaProducer {
    
    private final KafkaTemplate<String, EventDTO> kafkaTemplate;
    private final PipelineProperties properties;

    public void sendEvent(EventDTO event) {
        String topic = properties.getKafkaTopic();
        String key = event.getUserId();
        
        kafkaTemplate.send(topic, key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to send event to Kafka: {}", event.getEventId(), ex);
                } else {
                    log.debug("Event sent successfully: {}", event.getEventId());
                }
            });
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/
git commit -m "feat: add Kafka producer and pipeline config"
```

---

### Task A5: 实现ClickHouse存储层

**Files:**
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/storage/ClickHouseConfig.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/storage/EventRecord.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/storage/EventRepository.java`

- [ ] **Step 1: 创建ClickHouseConfig**

```java
package com.gateflow.victor.pipeline.storage;

import com.clickhouse.jdbc.ClickHouseDataSource;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.SQLException;
import java.util.Properties;

@Data
@Configuration
@ConfigurationProperties(prefix = "victor.clickhouse")
public class ClickHouseConfig {
    private String url = "jdbc:clickhouse://localhost:8123/victor";
    private String user = "victor";
    private String password = "victor123";

    @Bean
    public ClickHouseDataSource clickHouseDataSource() throws SQLException {
        Properties props = new Properties();
        props.setProperty("user", user);
        props.setProperty("password", password);
        return new ClickHouseDataSource(url, props);
    }
}
```

- [ ] **Step 2: 创建EventRecord**

```java
package com.gateflow.victor.pipeline.storage;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EventRecord {
    private LocalDateTime eventDate;
    private String eventId;
    private String eventType;
    private String userId;
    private LocalDateTime timestamp;
    private String platform;
    private String deviceId;
    private String sessionId;
    private List<String> expIds;
    private List<String> variants;
    private List<String> layers;
    private String properties;
    private LocalDateTime receivedAt;
}
```

- [ ] **Step 3: 创建EventRepository**

```java
package com.gateflow.victor.pipeline.storage;

import com.clickhouse.jdbc.ClickHouseDataSource;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateflow.victor.pipeline.ingestion.dto.EventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class EventRepository {
    
    private final ClickHouseDataSource dataSource;
    private final ObjectMapper objectMapper;

    public void insert(EventDTO event) {
        String sql = """
            INSERT INTO victor.events (
                event_date, event_id, event_type, user_id, timestamp,
                platform, device_id, session_id, exp_ids, variants, layers,
                properties, received_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now64(3))
            """;
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            LocalDateTime timestamp = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(event.getTimestamp()), ZoneId.systemDefault()
            );
            
            ps.setDate(1, java.sql.Date.valueOf(timestamp.toLocalDate()));
            ps.setString(2, event.getEventId());
            ps.setString(3, event.getEventType());
            ps.setString(4, event.getUserId());
            ps.setTimestamp(5, java.sql.Timestamp.valueOf(timestamp));
            ps.setString(6, event.getPlatform());
            ps.setString(7, event.getDeviceId());
            ps.setString(8, event.getSessionId());
            
            // 实验标签数组
            if (event.getExperimentTags() != null) {
                ps.setArray(9, conn.createArrayOf("String",
                    event.getExperimentTags().stream().map(t -> t.getExpId()).toArray()));
                ps.setArray(10, conn.createArrayOf("String",
                    event.getExperimentTags().stream().map(t -> t.getVariant()).toArray()));
                ps.setArray(11, conn.createArrayOf("String",
                    event.getExperimentTags().stream().map(t -> t.getLayer()).toArray()));
            } else {
                ps.setArray(9, conn.createArrayOf("String", new String[0]));
                ps.setArray(10, conn.createArrayOf("String", new String[0]));
                ps.setArray(11, conn.createArrayOf("String", new String[0]));
            }
            
            // properties JSON
            ps.setString(12, event.getProperties() != null ? 
                objectMapper.writeValueAsString(event.getProperties()) : "{}");
            
            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to insert event to ClickHouse: {}", event.getEventId(), e);
            throw new RuntimeException("ClickHouse insert failed", e);
        }
    }
}
```

- [ ] **Step 4: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/storage/
git commit -m "feat: add ClickHouse storage layer"
```

---

### Task A6: 实现EventConsumer和ClickHouseWriter

**Files:**
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/consumer/EventConsumer.java`
- Create: `backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/consumer/ClickHouseWriter.java`

- [ ] **Step 1: 创建ClickHouseWriter**

```java
package com.gateflow.victor.pipeline.consumer;

import com.gateflow.victor.pipeline.ingestion.dto.EventDTO;
import com.gateflow.victor.pipeline.storage.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickHouseWriter {
    
    private final EventRepository eventRepository;

    public void writeBatch(List<EventDTO> events) {
        for (EventDTO event : events) {
            try {
                eventRepository.insert(event);
            } catch (Exception e) {
                log.error("Failed to write event: {}", event.getEventId(), e);
            }
        }
        log.info("Written {} events to ClickHouse", events.size());
    }
}
```

- [ ] **Step 2: 创建EventConsumer**

```java
package com.gateflow.victor.pipeline.consumer;

import com.gateflow.victor.pipeline.ingestion.dto.EventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventConsumer {
    
    private final ClickHouseWriter writer;

    @KafkaListener(
        topics = "${victor.pipeline.kafka-topic:victor-events}",
        groupId = "victor-consumer",
        batch = "true"
    )
    public void consumeBatch(List<ConsumerRecord<String, EventDTO>> records) {
        log.debug("Received {} events from Kafka", records.size());
        
        List<EventDTO> events = new ArrayList<>();
        for (ConsumerRecord<String, EventDTO> record : records) {
            events.add(record.value());
        }
        
        writer.writeBatch(events);
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/victor-service/victor-pipeline/src/main/java/com/gateflow/victor/pipeline/consumer/
git commit -m "feat: add Kafka consumer and ClickHouse writer"
```

---

### Task A7: 添加Docker基础设施配置

**Files:**
- Create: `backend/victor-service/docker/docker-compose.yml`
- Create: `backend/victor-service/docker/init-db/01-create-events-table.sql`

- [ ] **Step 1: 创建docker-compose.yml**

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data

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
      - "8123:8123"
      - "9000:9000"
    environment:
      CLICKHOUSE_DB: victor
      CLICKHOUSE_USER: victor
      CLICKHOUSE_PASSWORD: victor123
    volumes:
      - clickhouse-data:/var/lib/clickhouse
      - ./init-db:/docker-entrypoint-initdb.d

volumes:
  zookeeper-data:
  kafka-data:
  clickhouse-data:
```

- [ ] **Step 2: 创建ClickHouse表DDL**

```sql
CREATE DATABASE IF NOT EXISTS victor;

CREATE TABLE IF NOT EXISTS victor.events (
    event_date Date DEFAULT toDate(timestamp),
    event_id String,
    event_type String,
    user_id String,
    timestamp DateTime64(3),
    platform String,
    device_id String,
    session_id String,
    exp_ids Array(String),
    variants Array(String),
    layers Array(String),
    properties String,
    received_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(event_date)
ORDER BY (event_date, event_type, user_id, timestamp)
SETTINGS index_granularity = 8192;
```

- [ ] **Step 3: Commit**

```bash
git add backend/victor-service/docker/
git commit -m "feat: add Docker infrastructure for Kafka and ClickHouse"
```

---

## Part B: victor-stats 统计分析引擎

### Task B1: 创建victor-stats模块结构

**Files:**
- Create: `backend/victor-service/victor-stats/pom.xml`
- Modify: `backend/victor-service/pom.xml` (添加module)

- [ ] **Step 1: 创建pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.gateflow</groupId>
        <artifactId>victor-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>victor-stats</artifactId>
    <name>Victor Stats</name>
    <description>统计分析引擎 - SRM检验、CUPED方差缩减、t/z检验、BH校正、mSPRT序贯检验</description>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-math3</artifactId>
            <version>3.6.1</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 修改父pom添加module**

- [ ] **Step 3: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-stats`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/victor-service/victor-stats/pom.xml backend/victor-service/pom.xml
git commit -m "feat: add victor-stats module structure"
```

---

### Task B2: 实现统计模型类

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/SampleStatistics.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/TestResult.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/LiftEstimate.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/ConfidenceInterval.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/SequentialTestResult.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/SequentialStatus.java`
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/Recommendation.java`

- [ ] **Step 1-7: 创建所有模型类**

```java
// SampleStatistics.java
package com.gateflow.victor.stats.model;
import lombok.Data;
import lombok.Builder;
import java.util.List;

@Data
@Builder
public class SampleStatistics {
    private long n;
    private double mean;
    private double variance;
    private double sum;
    
    public static SampleStatistics fromProportion(long successes, long trials) {
        double p = (double) successes / trials;
        return SampleStatistics.builder()
            .n(trials).mean(p).variance(p * (1 - p)).sum(successes).build();
    }
    
    public static SampleStatistics fromValues(List<Double> values) {
        long n = values.size();
        double sum = values.stream().mapToDouble(d -> d).sum();
        double mean = sum / n;
        double variance = values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2)).sum() / (n - 1);
        return SampleStatistics.builder().n(n).mean(mean).variance(variance).sum(sum).build();
    }
}

// TestResult.java
package com.gateflow.victor.stats.model;
import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class TestResult {
    private String testName;
    private double statistic;
    private double pValue;
    private double adjustedPValue;
    private double degreesOfFreedom;
    private boolean significant;
    private boolean passed;
    private LiftEstimate lift;
    private ConfidenceInterval confidenceInterval;
    private String message;
}

// LiftEstimate.java
package com.gateflow.victor.stats.model;
import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor(staticName = "of")
public class LiftEstimate {
    private double value;
    private double confidenceIntervalLower;
    private double confidenceIntervalUpper;
}

// ConfidenceInterval.java
package com.gateflow.victor.stats.model;
import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor(staticName = "of")
public class ConfidenceInterval {
    private double lower;
    private double upper;
    private double confidenceLevel;
}

// SequentialTestResult.java
package com.gateflow.victor.stats.model;
import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class SequentialTestResult {
    private String testName;
    private double lambda;
    private double upperBound;
    private double lowerBound;
    private SequentialStatus status;
    private int cumulativeObservations;
    private String message;
}

// SequentialStatus.java
package com.gateflow.victor.stats.model;
public enum SequentialStatus {
    STOP_NEGATIVE, STOP_SAFE, CONTINUE
}

// Recommendation.java
package com.gateflow.victor.stats.model;
public enum Recommendation {
    LAUNCH, DO_NOT_LAUNCH, CONTINUE_EXPERIMENT, INCONCLUSIVE
}
```

- [ ] **Step 8: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-stats`
Expected: 编译成功

- [ ] **Step 9: Commit**

```bash
git add backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/model/
git commit -m "feat: add stats model classes"
```

---

### Task B3: 实现SRM检验算法

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/algorithm/SRMTest.java`
- Create: `backend/victor-service/victor-stats/src/test/java/com/gateflow/victor/stats/algorithm/SRMTestTest.java`

- [ ] **Step 1: 写失败测试**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SRMTestTest {
    @Test
    void shouldPassWhenRatioMatchesExpected() {
        SRMTest srm = new SRMTest();
        double[] expected = {0.5, 0.5};
        long[] observed = {5000, 5000};
        
        TestResult result = srm.execute(expected, observed);
        assertTrue(result.isPassed());
        assertTrue(result.getPValue() > 0.01);
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=SRMTestTest`
Expected: FAIL - SRMTest不存在

- [ ] **Step 3: 实现SRMTest**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import org.apache.commons.math3.distribution.ChiSquaredDistribution;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
public class SRMTest {
    private static final double ALPHA = 0.01;

    public TestResult execute(double[] expected, long[] observed) {
        long total = Arrays.stream(observed).sum();
        double[] expectedCounts = new double[expected.length];
        for (int i = 0; i < expected.length; i++) {
            expectedCounts[i] = expected[i] * total;
        }
        
        double chiSquare = 0.0;
        for (int i = 0; i < observed.length; i++) {
            double diff = observed[i] - expectedCounts[i];
            chiSquare += (diff * diff) / expectedCounts[i];
        }
        
        int df = expected.length - 1;
        ChiSquaredDistribution dist = new ChiSquaredDistribution(df);
        double pValue = 1 - dist.cumulativeProbability(chiSquare);
        
        boolean passed = pValue >= ALPHA;
        return TestResult.builder()
            .testName("SRM")
            .statistic(chiSquare)
            .pValue(pValue)
            .significant(!passed)
            .passed(passed)
            .message(passed ? "SRM检验通过" : "SRM检验失败，分流比例异常")
            .build();
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=SRMTestTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-stats/src/
git commit -m "feat: implement SRM test algorithm"
```

---

### Task B4: 实现z检验算法

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/algorithm/ZTest.java`
- Create: `backend/victor-service/victor-stats/src/test/java/com/gateflow/victor/stats/algorithm/ZTestTest.java`

- [ ] **Step 1: 写失败测试**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ZTestTest {
    @Test
    void shouldDetectSignificantDifference() {
        ZTest zTest = new ZTest();
        // 对照组: 500/10000 = 5%, 实验组: 600/10000 = 6%
        TestResult result = zTest.executeProportion(500, 10000, 600, 10000);
        assertTrue(result.isSignificant());
        assertTrue(result.getPValue() < 0.05);
    }
    
    @Test
    void shouldNotDetectInsignificantDifference() {
        ZTest zTest = new ZTest();
        // 对照组: 500/10000 = 5%, 实验组: 503/10000 = 5.03%
        TestResult result = zTest.executeProportion(500, 10000, 503, 10000);
        assertFalse(result.isSignificant());
        assertTrue(result.getPValue() > 0.05);
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=ZTestTest`
Expected: FAIL - ZTest不存在

- [ ] **Step 3: 实现ZTest**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import com.gateflow.victor.stats.model.LiftEstimate;
import com.gateflow.victor.stats.model.ConfidenceInterval;
import org.apache.commons.math3.distribution.NormalDistribution;
import org.springframework.stereotype.Component;

@Component
public class ZTest {
    private static final double ALPHA = 0.05;
    private static final double Z_CRITICAL = 1.96;

    public TestResult executeProportion(
        long controlSuccess, long controlTotal,
        long treatmentSuccess, long treatmentTotal
    ) {
        double pControl = (double) controlSuccess / controlTotal;
        double pTreatment = (double) treatmentSuccess / treatmentTotal;
        
        double pPooled = (double) (controlSuccess + treatmentSuccess) / 
            (controlTotal + treatmentTotal);
        
        double se = Math.sqrt(
            pPooled * (1 - pPooled) * (1.0 / controlTotal + 1.0 / treatmentTotal)
        );
        
        double z = (pTreatment - pControl) / se;
        
        NormalDistribution normal = new NormalDistribution();
        double pValue = 2 * (1 - normal.cumulativeProbability(Math.abs(z)));
        
        double seUnpooled = Math.sqrt(
            pControl * (1 - pControl) / controlTotal +
            pTreatment * (1 - pTreatment) / treatmentTotal
        );
        double diff = pTreatment - pControl;
        double ciLower = diff - Z_CRITICAL * seUnpooled;
        double ciUpper = diff + Z_CRITICAL * seUnpooled;
        
        double lift = pControl != 0 ? diff / pControl : 0;
        double liftCiLower = pControl != 0 ? ciLower / pControl : 0;
        double liftCiUpper = pControl != 0 ? ciUpper / pControl : 0;
        
        return TestResult.builder()
            .testName("z_test")
            .statistic(z)
            .pValue(pValue)
            .significant(pValue < ALPHA)
            .lift(LiftEstimate.of(lift, liftCiLower, liftCiUpper))
            .confidenceInterval(ConfidenceInterval.of(ciLower, ciUpper, 0.95))
            .build();
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=ZTestTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-stats/src/
git commit -m "feat: implement z-test algorithm"
```

---

### Task B5: 实现CUPED方差缩减

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/algorithm/CUPED.java`
- Create: `backend/victor-service/victor-stats/src/test/java/com/gateflow/victor/stats/algorithm/CUPEDTest.java`

- [ ] **Step 1: 写失败测试**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.SampleStatistics;
import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class CUPEDTest {
    @Test
    void shouldReduceVariance() {
        CUPED cuped = new CUPED();
        List<Double> y = Arrays.asList(10.0, 11.0, 12.0, 9.0, 8.0);
        List<Double> x = Arrays.asList(9.5, 10.5, 11.5, 8.5, 7.5);
        double meanX = 9.5;
        
        SampleStatistics result = cuped.adjust(y, x, meanX);
        // CUPED调整后方差应小于原方差
        assertTrue(result.getVariance() < 2.5); // 原方差约2.5
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=CUPEDTest`
Expected: FAIL - CUPED不存在

- [ ] **Step 3: 实现CUPED**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.SampleStatistics;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class CUPED {
    
    public SampleStatistics adjust(
        List<Double> experimentValues,
        List<Double> preExperimentValues,
        double overallMeanX
    ) {
        int n = experimentValues.size();
        
        double meanY = experimentValues.stream().mapToDouble(d -> d).average().orElse(0);
        double varY = calculateVariance(experimentValues, meanY);
        
        double meanX = preExperimentValues.stream().mapToDouble(d -> d).average().orElse(0);
        double varX = calculateVariance(preExperimentValues, meanX);
        
        double covXY = calculateCovariance(experimentValues, preExperimentValues, meanY, meanX);
        double theta = covXY / varX;
        
        List<Double> cupedValues = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            double yCuped = experimentValues.get(i) - theta * (preExperimentValues.get(i) - overallMeanX);
            cupedValues.add(yCuped);
        }
        
        double meanCuped = cupedValues.stream().mapToDouble(d -> d).average().orElse(0);
        double varCuped = calculateVariance(cupedValues, meanCuped);
        
        return SampleStatistics.builder()
            .n(n)
            .mean(meanCuped)
            .variance(varCuped)
            .build();
    }
    
    private double calculateVariance(List<Double> values, double mean) {
        return values.stream().mapToDouble(v -> Math.pow(v - mean, 2)).sum() / (values.size() - 1);
    }
    
    private double calculateCovariance(List<Double> y, List<Double> x, double meanY, double meanX) {
        double sum = 0;
        for (int i = 0; i < y.size(); i++) {
            sum += (y.get(i) - meanY) * (x.get(i) - meanX);
        }
        return sum / (y.size() - 1);
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=CUPEDTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-stats/src/
git commit -m "feat: implement CUPED variance reduction"
```

---

### Task B6: 实现BH校正算法

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/algorithm/BHCorrection.java`
- Create: `backend/victor-service/victor-stats/src/test/java/com/gateflow/victor/stats/algorithm/BHCorrectionTest.java`

- [ ] **Step 1: 写失败测试**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import com.gateflow.victor.stats.model.LiftEstimate;
import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class BHCorrectionTest {
    @Test
    void shouldCorrectMultiplePValues() {
        BHCorrection bh = new BHCorrection();
        List<TestResult> results = Arrays.asList(
            TestResult.builder().testName("m1").pValue(0.01).lift(LiftEstimate.of(0.1,0,0)).build(),
            TestResult.builder().testName("m2").pValue(0.04).lift(LiftEstimate.of(0.05,0,0)).build(),
            TestResult.builder().testName("m3").pValue(0.06).lift(LiftEstimate.of(0.02,0,0)).build()
        );
        
        List<TestResult> corrected = bh.correct(results);
        // p=0.01和p=0.04应该校正后显著，p=0.06不显著
        assertTrue(corrected.get(0).isSignificant());
        assertTrue(corrected.get(1).isSignificant());
        assertFalse(corrected.get(2).isSignificant());
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=BHCorrectionTest`
Expected: FAIL - BHCorrection不存在

- [ ] **Step 3: 实现BHCorrection**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.TestResult;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class BHCorrection {
    private static final double ALPHA = 0.05;

    public List<TestResult> correct(List<TestResult> testResults) {
        int m = testResults.size();
        
        List<TestResult> sorted = testResults.stream()
            .sorted(Comparator.comparingDouble(TestResult::getPValue))
            .collect(Collectors.toList());
        
        // 找最大k满足 p(k) <= (k/m) * α
        int k = -1;
        for (int i = m - 1; i >= 0; i--) {
            double threshold = (i + 1) / (double) m * ALPHA;
            if (sorted.get(i).getPValue() <= threshold) {
                k = i;
                break;
            }
        }
        
        List<TestResult> corrected = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            TestResult original = sorted.get(i);
            double adjustedP = Math.min(original.getPValue() * m / (i + 1), 1.0);
            if (i > 0 && corrected.size() > 0) {
                adjustedP = Math.min(adjustedP, corrected.get(i-1).getAdjustedPValue());
            }
            
            corrected.add(TestResult.builder()
                .testName(original.getTestName())
                .pValue(original.getPValue())
                .adjustedPValue(adjustedP)
                .significant(i <= k)
                .lift(original.getLift())
                .confidenceInterval(original.getConfidenceInterval())
                .message(i <= k ? "BH校正后显著" : "BH校正后不显著")
                .build());
        }
        return corrected;
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=BHCorrectionTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-stats/src/
git commit -m "feat: implement BH-FDR correction"
```

---

### Task B7: 实现mSPRT序贯检验

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/algorithm/mSPRT.java`
- Create: `backend/victor-service/victor-stats/src/test/java/com/gateflow/victor/stats/algorithm/mSPRTTest.java`

- [ ] **Step 1: 写失败测试**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.SampleStatistics;
import com.gateflow.victor.stats.model.SequentialTestResult;
import com.gateflow.victor.stats.model.SequentialStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class mSPRTTest {
    @Test
    void shouldContinueWhenNoDifference() {
        mSPRT msprt = new mSPRT();
        SampleStatistics control = SampleStatistics.builder().n(1000).mean(50).variance(100).build();
        SampleStatistics treatment = SampleStatistics.builder().n(1000).mean(50).variance(100).build();
        
        SequentialTestResult result = msprt.execute(control, treatment, 1);
        assertEquals(SequentialStatus.CONTINUE, result.getStatus());
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=mSPRTTest`
Expected: FAIL - mSPRT不存在

- [ ] **Step 3: 实现mSPRT**

```java
package com.gateflow.victor.stats.algorithm;

import com.gateflow.victor.stats.model.SampleStatistics;
import com.gateflow.victor.stats.model.SequentialTestResult;
import com.gateflow.victor.stats.model.SequentialStatus;
import org.springframework.stereotype.Component;

@Component
public class mSPRT {
    private static final double ALPHA = 0.05;
    private static final double TAU = 0.5;

    public SequentialTestResult execute(
        SampleStatistics control, SampleStatistics treatment, int cumulativeObs
    ) {
        double delta = treatment.getMean() - control.getMean();
        double sigma2 = treatment.getVariance() + control.getVariance();
        double n = treatment.getN();
        
        double denominator = sigma2 + n * TAU * TAU;
        double lambda = Math.sqrt(sigma2 / denominator) * 
            Math.exp(n * delta * delta / (2 * denominator));
        
        double upperBound = 1 / ALPHA;
        double lowerBound = ALPHA;
        
        SequentialStatus status;
        String message;
        if (lambda > upperBound) {
            status = SequentialStatus.STOP_NEGATIVE;
            message = "护栏指标显著恶化，建议停止实验";
        } else if (lambda < lowerBound) {
            status = SequentialStatus.STOP_SAFE;
            message = "护栏指标安全";
        } else {
            status = SequentialStatus.CONTINUE;
            message = "继续监测";
        }
        
        return SequentialTestResult.builder()
            .testName("mSPRT")
            .lambda(lambda)
            .upperBound(upperBound)
            .lowerBound(lowerBound)
            .status(status)
            .cumulativeObservations(cumulativeObs)
            .message(message)
            .build();
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend/victor-service && mvn test -pl victor-stats -Dtest=mSPRTTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/victor-service/victor-stats/src/
git commit -m "feat: implement mSPRT sequential test"
```

---

### Task B8: 实现StatsEngine整合所有算法

**Files:**
- Create: `backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/engine/StatsEngine.java`

- [ ] **Step 1: 创建StatsEngine**

```java
package com.gateflow.victor.stats.engine;

import com.gateflow.victor.stats.algorithm.*;
import com.gateflow.victor.stats.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsEngine {
    private final SRMTest srmTest;
    private final ZTest zTest;
    private final CUPED cuped;
    private final BHCorrection bhCorrection;
    private final mSPRT msprt;

    public TestResult runSRM(double[] expected, long[] observed) {
        return srmTest.execute(expected, observed);
    }

    public TestResult runZTest(long cSuccess, long cTotal, long tSuccess, long tTotal) {
        return zTest.executeProportion(cSuccess, cTotal, tSuccess, tTotal);
    }

    public SampleStatistics runCUPED(List<Double> y, List<Double> x, double meanX) {
        return cuped.adjust(y, x, meanX);
    }

    public List<TestResult> runBHCorrection(List<TestResult> results) {
        return bhCorrection.correct(results);
    }

    public SequentialTestResult runmSPRT(SampleStatistics c, SampleStatistics t, int obs) {
        return msprt.execute(c, t, obs);
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd backend/victor-service && mvn compile -pl victor-stats`
Expected: 编译成功

- [ ] **Step 3: Commit**

```bash
git add backend/victor-service/victor-stats/src/main/java/com/gateflow/victor/stats/engine/
git commit -m "feat: implement StatsEngine orchestrating all algorithms"
```

---

### Task B9: 全模块测试验证

- [ ] **Step 1: 运行所有测试**

Run: `cd backend/victor-service && mvn test -pl victor-stats`
Expected: 所有测试通过

- [ ] **Step 2: 运行pipeline编译**

Run: `cd backend/victor-service && mvn compile -pl victor-pipeline`
Expected: 编译成功

- [ ] **Step 3: 运行全项目编译**

Run: `cd backend/victor-service && mvn compile`
Expected: 所有模块编译成功

- [ ] **Step 4: Final Commit**

```bash
git add -A
git commit -m "feat: complete victor-pipeline and victor-stats modules"
```

---

## 验收标准

### victor-pipeline
- HTTP API可接收事件并推送到Kafka
- Kafka消费者可批量写入ClickHouse
- Docker配置可启动Kafka+ClickHouse

### victor-stats
- SRM检验可检测分流异常
- z检验可判断比例差异显著性
- CUPED可实现方差缩减
- BH校正可处理多重比较
- mSPRT可实现序贯检验
- 所有单元测试通过