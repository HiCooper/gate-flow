# SDK 开发

本文档面向 SDK 开发者,介绍 GateFlow SDK 的架构原则和开发规范。

## 架构原则

1. **轻量化核心**: SDK 核心逻辑尽量薄,配置服务端驱动
2. **可移植分桶**: BucketEngine 纯算法部分跨平台一致
3. **事件不丢失**: 事件流可重放,保证数据完整性
4. **配置秒级下发**: 配置变更秒级生效

## 详细内容

- [可移植核心](/dev/sdk-dev/portable-core)
- [平台层](/dev/sdk-dev/platform-layers)
