                                           
⏺ GateFlow SDK 测试开发进度总结                                                                                                                                                             
                                                                                                                                  
  一、整体架构                                                                                                                                                                              
                                                                                                                                                                                            
  ┌────────────────────────────────────────────────────────────┐                                                                                                                            
  │  React Native App                                          │                                                                                                                            
  │  (packages/expo-gateflow/example/)                         │                                                                                                                            
  │  ┌──────────────────────────────────────────────────────┐  │                                                                                                                            
  │  │  TypeScript Layer (Zustand Store + Hooks)            │  │                                                                                                                            
  │  │  GateFlowProvider, useGateFlow, useExperiment        │  │                                                                                                                            
  │  └──────────────────────────────────────────────────────┘  │                                                                                                                            
  │                           ↕ Expo Modules Core               │                                                                                                                           
  │  ┌──────────────────────────────────────────────────────┐  │                                                                                                                            
  │  │  iOS Bridge (Swift)  │  Android Bridge (Kotlin)      │  │                                                                                                                            
  │  │  GateFlowBridgeAdapter.swift │ GateFlowBridgeAdapter.kt││                                                                                                                            
  │  └──────────────────────────────────────────────────────┘  │                                                                                                                            
  │                           ↕ import                          │                                                                                                                           
  │  ┌──────────────────────────────────────────────────────┐  │                                                                                                                            
  │  │  iOS SDK (SPM)         │  Android SDK (Gradle)       │  │                                                                                                                            
  │  │  GateFlowKit           │  com.gateflow.sdk           │  │                                                                                                                            
  │  └──────────────────────────────────────────────────────┘  │                                                                                                                            
  └────────────────────────────────────────────────────────────┘                                                                                                                            
                                                                                                                                                                                            
  二、各模块状态                                                                                                                                                                            
                                                                                                                                                                                            
  1. iOS SDK — packages/ios-sdk/                                                                                                                                                            
                                                            
  ┌──────────────┬─────────────┬───────────────────────────────────────────────────────────┐                                                                                                
  │     项目     │    状态     │                           备注                            │
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ 编译         │ ✅ 通过     │ swift build 零错误                                        │
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ MurmurHash3  │ ✅ 已验证   │ C 版本输出 hash=1893927761, bucket=7761，与 Java 后端一致 │                                                                                                
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ BucketEngine │ ✅ 代码就绪 │ 1:1 映射后端 victor-bucketing 逻辑                        │                                                                                                
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ 单元测试     │ ❌ 无法执行 │ macOS 13.x + Swift 5.9.2 运行时 SIGILL 崩溃               │
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ Podspec      │ ✅ 已创建   │ GateFlowKit.podspec                                       │
  ├──────────────┼─────────────┼───────────────────────────────────────────────────────────┤                                                                                                
  │ 分发方式     │ SPM         │ Package.swift，支持 iOS 15+ / macOS 12+                   │
  └──────────────┴─────────────┴───────────────────────────────────────────────────────────┘                                                                                                
                                                            
  2. Android SDK — packages/android-sdk/                                                                                                                                                    
                                                            
  ┌─────────────┬───────────┬───────────────────────────────────────────────┐                                                                                                               
  │    项目     │   状态    │                     备注                      │
  ├─────────────┼───────────┼───────────────────────────────────────────────┤                                                                                                               
  │ 编译        │ ⚠️  未验证 │ 环境未安装 Android SDK                        │
  ├─────────────┼───────────┼───────────────────────────────────────────────┤                                                                                                               
  │ Gradle 配置 │ ✅ 已创建 │ gateflow/build.gradle.kts                     │                                                                                                               
  ├─────────────┼───────────┼───────────────────────────────────────────────┤                                                                                                               
  │ 单元测试    │ ⚠️  未验证 │ JUnit 测试文件存在，但无 Android SDK 无法运行 │                                                                                                               
  ├─────────────┼───────────┼───────────────────────────────────────────────┤                                                                                                               
  │ 分发方式    │ Gradle    │ Android Library Module                        │
  └─────────────┴───────────┴───────────────────────────────────────────────┘                                                                                                               
                                                            
  3. Expo RN Bridge — packages/expo-gateflow/                                                                                                                                               
                                                            
  ┌──────────────────────┬─────────────────────┬─────────────────────────────────────────────────┐                                                                                          
  │         项目         │        状态         │                      备注                       │
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ TypeScript           │ ✅ typecheck 零错误 │ tsc --noEmit 通过                               │
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ expo-module prepare  │ ✅ 通过             │ pnpm install 后自动执行                         │                                                                                          
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ iOS Bridge           │ ✅ 代码就绪         │ import GateFlowKit                              │                                                                                          
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ Android Bridge       │ ✅ 代码就绪         │ import com.gateflow.sdk                         │
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ android/build.gradle │ ✅ 已创建           │ expo-modules-core + gateflow 依赖               │
  ├──────────────────────┼─────────────────────┼─────────────────────────────────────────────────┤                                                                                          
  │ iOS Podspec          │ ✅ 已创建           │ GateFlowExpo.podspec → 本地路径引用 GateFlowKit │
  └──────────────────────┴─────────────────────┴─────────────────────────────────────────────────┘                                                                                          
                                                            
  4. Example RN App — packages/expo-gateflow/example/                                                                                                                                       
                                                            
  ┌──────────────┬───────────┬──────────────────────────────────────────────┐                                                                                                               
  │     项目     │   状态    │                     备注                     │
  ├──────────────┼───────────┼──────────────────────────────────────────────┤                                                                                                               
  │ prebuild iOS │ ✅ 完成   │ npx expo prebuild --platform ios 已生成 ios/ │
  ├──────────────┼───────────┼──────────────────────────────────────────────┤                                                                                                               
  │ CocoaPods    │ ❌ 未安装 │ macOS 缺少 CocoaPods CLI                     │                                                                                                               
  ├──────────────┼───────────┼──────────────────────────────────────────────┤                                                                                                               
  │ 运行时验证   │ ❌ 未执行 │ 需要 pod install + run:ios                   │                                                                                                               
  └──────────────┴───────────┴──────────────────────────────────────────────┘                                                                                                               
                                                            
  三、当前环境限制                                                                                                                                                                          
                                                            
  ┌───────────────────────────┬────────────────────────────────────────────┬─────────────────────────────────────────┐                                                                      
  │           限制            │                    原因                    │                解决方案                 │
  ├───────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                      
  │ Swift 单元测试无法运行    │ macOS 13.x + Swift 5.9.2 运行时 SIGILL bug │ 在 CI 或更新 macOS 上测试               │
  ├───────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                      
  │ Android 编译/测试无法运行 │ 未安装 Android SDK                         │ 设置 ANDROID_HOME 或安装 Android Studio │                                                                      
  ├───────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                      
  │ CocoaPods 未安装          │ Ruby 2.6 版本过低，gem/homebrew 都失败     │ 升级 Ruby 后 gem install cocoapods      │                                                                      
  └───────────────────────────┴────────────────────────────────────────────┴─────────────────────────────────────────┘                                                                      
                                                            
  四、在其他机器上继续测试的步骤                                                                                                                                                            
                                                            
  iOS SDK 测试                                                                                                                                                                              
                                                            
  cd packages/ios-sdk                                                                                                                                                                       
                                                                                                                                                                                            
  # 编译验证（已确认通过）                                                                                                                                                                  
  swift build                                                                                                                                                                               
                                                                                                                                                                                            
  # 单元测试（需要 macOS 14+ / Swift 6+）                                                                                                                                                   
  swift test
  # 或直接打开 Xcode                                                                                                                                                                        
  xed .                                                                                                                                                                                     
                                                                                                                                                                                            
  Android SDK 测试                                                                                                                                                                          
                                                            
  cd packages/android-sdk                                                                                                                                                                   
                                                                                                                                                                                            
  # 设置 Android SDK 环境变量                                                                                                                                                               
  export ANDROID_HOME=/path/to/Android/sdk                                                                                                                                                  
                                                                                                                                                                                            
  # 生成 Gradle wrapper（如果缺失）                                                                                                                                                         
  gradle wrapper --gradle-version=8.2                                                                                                                                                       
                                                                                                                                                                                            
  # 运行测试                                                                                                                                                                                
  ./gradlew :gateflow:test                                                                                                                                                                  
                                                                                                                                                                                            
  Expo RN App 端到端测试                                                                                                                                                                    
                                                                                                                                                                                            
  # 1. 安装 CocoaPods（需要先升级 Ruby）                                                                                                                                                    
  brew install ruby                                                                                                                                                                         
  export PATH="/usr/local/opt/ruby/bin:$PATH"                                                                                                                                               
  gem install cocoapods                                                                                                                                                                     
                                                                                                                                                                                            
  # 2. 安装依赖                                                                                                                                                                             
  cd packages/expo-gateflow                                                                                                                                                                 
  pnpm install                                                                                                                                                                              
  cd example                                                                                                                                                                                
  npm install  # pnpm workspace 不处理嵌套 package.json                                                                                                                                     
                                                                                                                                                                                            
  # 3. 生成原生项目（如果 example/ios 不存在）                                                                                                                                              
  npx expo prebuild --platform ios                                                                                                                                                          
                                                                                                                                                                                            
  # 4. 安装 CocoaPods 依赖                                                                                                                                                                  
  cd ios && pod install && cd ..                                                                                                                                                            
                                                                                                                                                                                            
  # 5. 运行                                                                                                                                                                                 
  npx expo run:ios                                                                                                                                                                          
                                                                                                                                                                                            
  五、已验证的关键结论                                                                                                                                                                      
                                                                                                                                                                                            
  1. MurmurHash3 跨平台一致性 — C 版本验证正确（hash=1893927761, bucket=7761），与 Java 后端一致                                                                                            
  2. TypeScript 编译 — expo-gateflow 和 example app 都通过 typecheck
  3. iOS SDK 编译 — swift build 零错误                                                                                                                                                      
  4. Expo prebuild — 成功生成 iOS 原生项目结构  

  ## 关键文件路径

| 模块 | 路径 |
|------|------|
| iOS SDK 源码 | `packages/ios-sdk/Sources/GateFlowKit/` |
| iOS SDK Package.swift | `packages/ios-sdk/Package.swift` |
| iOS SDK Podspec | `packages/ios-sdk/GateFlowKit.podspec` |
| Android SDK 源码 | `packages/android-sdk/gateflow/src/main/java/com/gateflow/sdk/` |
| Expo RN TypeScript 源码 | `packages/expo-gateflow/src/` |
| Expo iOS Bridge | `packages/expo-gateflow/ios/` |
| Expo Android Bridge | `packages/expo-gateflow/android/` |
| Example RN App | `packages/expo-gateflow/example/` |

## 关联文档

- `01-project-overview/native-sdk-architecture.md` — Native SDK 架构设计
- `05-historical-lessons/2026-05-07_swift-macos-runtime-crash.md` — Swift macOS 运行时崩溃排坑
- `06-api-reference/expo-gateflow-api.md` — Expo SDK API 参考
