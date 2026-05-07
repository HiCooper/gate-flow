# Swift macOS 运行时 SIGILL 崩溃

**类型：** 排坑记录
**范围：** iOS SDK 测试
**前置依赖：** 无
**最后更新：** 2026-05-07

## 摘要（TL;DR）

在 macOS 13.x (Ventura) + Swift 5.9.2 环境下，任何链接 GateFlowKit 的命令行二进制文件在运行时会崩溃（SIGILL / exit code 132），包括纯 Foundation 的独立编译。这不是代码 bug，是 Swift 5.9 在旧版 macOS 上的已知兼容性问题。单元测试无法在该环境执行，需要通过 CI 或更新 macOS/Swift 版本验证。

## 背景

在实现 iOS SDK 后尝试运行 `swift test`，发现任何测试二进制文件都在启动后几毫秒内崩溃，信号 4 (SIGILL - illegal instruction)。

## 详情

### 崩溃表现

- `swift test` → 启动后 SIGILL
- 直接运行编译的二进制 → SIGILL
- 纯 Foundation 独立编译（不链接 GateFlowKit）→ 仍然 SIGILL
- 纯 C 版本相同逻辑 → **正常运行**

### 排查过程

1. 确认 MurmurHash3 逻辑正确（C 版本输出 `hash=1893927761, bucket=7761`）
2. 确认 `swift build` 编译零错误
3. 尝试 `@testable import` → 崩溃
4. 尝试去掉 `@testable` → 崩溃
5. 尝试只编译 MurmurHash3.swift + BucketEngine.swift → 崩溃
6. 确认 `hello.swift` 简单程序也崩溃
7. 结论：**Swift 5.9.2 在此 macOS 版本上的 runtime 问题**

### 环境信息

```
swift --version
swift-driver version: 1.87.3 Apple Swift version 5.9.2 (swiftlang-5.9.2.2.56 clang-1500.1.0.2.5)
Target: x86_64-apple-macosx13.0
```

## 可执行规则

- **应该：** 在 CI 环境（更新版本的 macOS + Swift）上运行 iOS SDK 单元测试
- **应该：** 通过 C/Java 版本交叉验证 MurmurHash3 和 BucketEngine 的正确性
- **应该：** 在 Xcode 模拟器或真机上测试 iOS SDK
- **禁止：** 因为本地 `swift test` 崩溃而认为代码有问题——这是环境限制

## 后果

在本地 macOS 环境无法验证 Swift 单元测试，必须依赖其他测试方式。

## 关联文档

- `01-project-overview/native-sdk-architecture.md` — Native SDK 架构
