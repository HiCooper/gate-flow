# Java SDK

本文档介绍如何在 Java 服务端集成 GateFlow SDK。

::: warning 待完善
本文档正在编写中。
:::

## 安装

在 `pom.xml` 中添加依赖:

```xml
<dependency>
    <groupId>com.gateflow</groupId>
    <artifactId>victor-sdk</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

## 快速开始

```java
VictorConfig config = VictorConfig.builder()
    .baseUrl("http://localhost:8080")
    .apiKey("your-api-key")
    .build();

VictorClient client = new VictorClient(config);
```
