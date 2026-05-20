# 可移植核心

本文档介绍 GateFlow SDK 的可移植核心设计理念。

## 设计原则

`victor-bucketing` 模块是 GateFlow 的核心分桶引擎，遵循以下设计原则：

1. **纯 Java 实现** - 无任何 Spring/框架依赖
2. **跨平台移植** - 可直接移植到 Swift、Kotlin、TypeScript 等平台
3. **算法一致性** - 各平台使用相同的 MurmurHash3 实现

## 核心算法

```java
public class BucketEngine {

    /**
     * 计算用户分桶号
     * bucket = MurmurHash3(userId + "#" + layerId + "#" + salt) % 10000
     */
    public static int computeBucket(String userId, String layerId, String salt) {
        String input = userId + "#" + layerId + "#" + salt;
        int hash = MurmurHash3.hash(input);
        return Math.abs(hash % 10000);
    }

    /**
     * 根据桶号匹配实验变体
     */
    public static String findVariant(int bucket, List<VariantSpec> variants) {
        for (VariantSpec spec : variants) {
            if (bucket >= spec.getBucketStart() && bucket <= spec.getBucketEnd()) {
                return spec.getVariantKey();
            }
        }
        return null;
    }
}
```

## 平台移植清单

| 平台 | 状态 | 关键文件 |
|------|------|----------|
| Java | 完成 | `BucketEngine.java` |
| Kotlin | 完成 | Android SDK |
| Swift | 开发中 | iOS SDK |
| TypeScript | 完成 | Expo SDK |

## 移植要求

1. 实现 MurmurHash3 算法（保证与 Java 版输出一致）
2. 使用相同的输入格式：`userId#layerId#salt`
3. 验证测试向量：
   - Input: `userId="user_123", layerId="layer_001", salt="v1"`
   - Output: `bucket=7890`（所有平台必须一致）

## 测试向量

用于验证各平台分桶一致性的标准输入输出：

| userId | layerId | salt | bucket |
|--------|---------|------|--------|
| user_123 | layer_001 | v1 | 7890 |
| user_456 | layer_001 | v1 | 2341 |
| user_789 | layer_002 | v1 | 5678 |