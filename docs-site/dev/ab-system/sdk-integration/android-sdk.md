# Android SDK

本文档介绍如何在 Android 应用中集成 GateFlow SDK。

## 安装

### Gradle

```groovy
// app/build.gradle
dependencies {
    implementation 'com.gateflow:gateflow-android:1.0.0'
}
```

## 核心功能

Android SDK 实现相对完整，包括：

- 分桶引擎
- 配置管理
- 事件上报
- 本地缓存

## 使用示例

### 初始化

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        GateFlow.init(this, Config.Builder()
            .baseUrl("http://localhost:8081")
            .apiKey("your-api-key")
            .build())
    }
}
```

### 获取变体

```kotlin
val variant = GateFlow.getVariant("user_123", "exp_001")

if (variant != null) {
    val params = variant.params // Map<String, Any>
    // 根据 variant 做业务逻辑
}
```

### 事件追踪

```kotlin
GateFlow.trackExposure("user_123", "exp_001", variant.key)
GateFlow.trackClick("user_123", "exp_001", variant.key)
```

## Kotlin 协程支持

```kotlin
suspend fun fetchVariant() {
    val variant = GateFlow.getVariantAsync("user_123", "exp_001")
    // 处理结果
}
```

## 混淆配置

```proguard
# GateFlow SDK
-keep class com.gateflow.gateflow.** { *; }
```

## 分桶一致性

Android SDK 使用与后端相同的 MurmurHash3 算法，确保分桶结果一致。