# Java SDK

本文档介绍如何在 Java 服务端集成 GateFlow SDK。

## 快速开始

### 安装

在 `pom.xml` 中添加依赖:

```xml
<dependency>
    <groupId>com.gateflow</groupId>
    <artifactId>victor-sdk</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

### 初始化

```java
VictorConfig config = VictorConfig.builder()
    .baseUrl("http://localhost:8081")
    .apiKey("your-api-key")
    .build();

VictorClient client = new VictorClient(config);
```

### 获取实验变体

```java
// 获取用户的实验变体
Variant variant = client.getVariant("user_123", "exp_001");

if (variant != null) {
    String params = variant.getParams(); // 如: {"button_color": "red"}
    // 根据 variant 做业务逻辑
}
```

### 曝光上报

```java
// 上报用户进入了某个变体
client.trackExposure("user_123", "exp_001", variant.getVariantKey());
```

## API 列表

| 方法 | 说明 |
|------|------|
| `getVariant(userId, expId)` | 获取用户分桶结果 |
| `getVariants(userId)` | 获取用户所有实验分桶结果 |
| `trackExposure(userId, expId, variantKey)` | 上报曝光事件 |
| `trackClick(userId, expId, variantKey)` | 上报点击事件 |
| `refresh()` | 强制刷新配置 |

## 配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| baseUrl | API 基础地址 | 必需 |
| apiKey | API 密钥 | 必需 |
| refreshInterval | 配置刷新间隔(ms) | 60000 |
| maxCacheSize | 本地缓存最大条目 | 10000 |

## 本地缓存

SDK 内置 Caffeine 本地缓存，减少网络请求：

```java
VictorConfig config = VictorConfig.builder()
    .baseUrl("http://localhost:8081")
    .apiKey("api-key")
    .maxCacheSize(5000)      // 缓存 5000 条
    .refreshInterval(30000)   // 30秒刷新一次
    .build();
```

## 线程安全

`VictorClient` 是线程安全的，可在多线程环境中使用。