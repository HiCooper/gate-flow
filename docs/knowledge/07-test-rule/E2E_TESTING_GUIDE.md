# GateFlow 前后端端到端测试指南

## 概述

本文档记录了 GateFlow 项目前后端端到端（E2E）测试的标准流程、最佳实践和自动化规范。

**适用场景：**
- 新 API 接口开发完成后的联调测试
- 前端页面集成真实 API 的验证
- 全链路功能测试（CRUD、状态变更、版本管理等）
- CORS 配置验证
- 数据一致性检查

---

## 标准测试流程

### Phase 1: 后端 API 测试

**目标：** 验证后端接口功能正常，数据返回符合预期

**工具：** curl（PowerShell 环境）

**测试步骤：**

```powershell
# 1. 测试列表接口（分页）
curl -s "http://localhost:8081/api/v1/experiments?current=1&size=10" | ConvertFrom-Json

# 2. 测试创建接口
curl -s -X POST http://localhost:8081/api/v1/experiments `
  -H "Content-Type: application/json" `
  -d '{
    "name": "测试实验",
    "description": "E2E测试",
    "layerId": 1,
    "bucketStart": 0,
    "bucketEnd": 99,
    "variants": [
      {"variantKey": "control", "name": "对照组", "bucketStart": 0, "bucketEnd": 49},
      {"variantKey": "treatment", "name": "实验组", "bucketStart": 50, "bucketEnd": 99}
    ]
  }' | ConvertFrom-Json

# 3. 测试详情接口
curl -s http://localhost:8081/api/v1/experiments/{id} | ConvertFrom-Json

# 4. 测试状态变更（启动/停止）
curl -s -X POST http://localhost:8081/api/v1/experiments/{id}/start | ConvertFrom-Json
curl -s -X POST http://localhost:8081/api/v1/experiments/{id}/stop | ConvertFrom-Json

# 5. 测试版本管理
curl -s http://localhost:8081/api/v1/experiments/{id}/versions | ConvertFrom-Json
curl -s http://localhost:8081/api/v1/experiments/{id}/versions/active | ConvertFrom-Json

# 6. 数据一致性验证
curl -s http://localhost:8081/api/v1/experiments?current=1&size=100 | ConvertFrom-Json | Select-Object id, name, status | Format-Table
```

**验证要点：**
- ✅ HTTP 状态码 200
- ✅ 返回数据结构符合 Swagger 定义
- ✅ 业务逻辑正确（状态机、版本控制等）
- ✅ 数据库数据与 API 返回一致

---

### Phase 2: 前端集成测试

**目标：** 验证前端页面能正确调用 API 并展示数据

**工具：** Browser Agent（自动化浏览器操作）

**测试步骤：**

#### 2.1 启动前端服务

```bash
# 启动开发服务器
pnpm --filter @gate-flow/admin dev

# 预期输出：
# VITE v5.4.21  ready in 854 ms
# ➜  Local:   http://localhost:3003/
```

#### 2.2 设置预览浏览器

使用 `run_preview` 工具配置预览：
```
name: GateFlow Admin Console
url: http://localhost:3003
```

#### 2.3 自动化验证流程

**步骤 1：页面加载验证**
- 打开 http://localhost:3003
- 等待 3 秒
- 截图记录初始状态
- 检查控制台是否有错误

**步骤 2：导航到目标页面**
- 查找并点击"Experiments"或"实验"菜单
- 等待页面加载完成
- 截图记录

**步骤 3：数据加载验证**
- 检查是否显示真实 API 数据（非 mock 数据）
- 验证数据字段完整性
- 截图记录

**步骤 4：功能交互测试**
- 点击"创建实验"按钮
- 填写表单并提交
- 验证创建成功提示
- 刷新页面验证数据持久化
- 截图记录每个关键步骤

**步骤 5：控制台检查**
- 打开浏览器开发者工具
- 切换到 Console 标签
- 检查是否有红色错误
- 切换到 Network 标签
- 验证 API 请求状态（200 OK）
- 截图记录

---

### Phase 3: 端到端联调

**目标：** 完整验证前后端数据流转

**测试场景：**

#### 场景 1：创建实验完整流程

```
1. 前端：点击"创建实验"
2. 前端：填写表单（名称、描述、流量分配）
3. 前端：点击"提交"
4. 前端：发送 POST /api/v1/experiments
5. 后端：接收请求，创建实验
6. 后端：返回实验数据（含 expId）
7. 前端：显示成功提示
8. 前端：刷新列表
9. 验证：curl 检查数据库
10. 验证：前端显示新实验
```

**验证命令：**
```powershell
# 后端验证
curl -s "http://localhost:8081/api/v1/experiments?current=1&size=1" | ConvertFrom-Json

# 前端验证（Browser Agent 截图）
```

#### 场景 2：更新实验版本

```
1. 前端：点击实验详情
2. 前端：修改变体配置
3. 前端：点击"保存"
4. 后端：创建新版本（version timestamp）
5. 后端：标记旧版本 isActive=false
6. 前端：显示版本历史
7. 验证：查询版本列表 API
```

#### 场景 3：启动/停止实验

```
1. 前端：点击"启动"按钮
2. 后端：状态从 draft → running
3. 前端：按钮变为"停止"
4. 验证：curl 检查状态
5. 前端：点击"停止"
6. 后端：状态从 running → paused
7. 验证：curl 检查状态
```

---

## 关键经验与最佳实践

### 1. CORS 配置规范

**问题：** 首次加载出现 CORS 错误，刷新后正常

**原因：** 后端刚重启，CORS 配置需要预热

**解决方案：**

```java
// WebConfig.java
@Configuration
public class WebConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // 允许所有开发端口
        config.addAllowedOrigin("http://localhost:5173");  // Vite 默认
        config.addAllowedOrigin("http://localhost:3000");  // Next.js 默认
        config.addAllowedOrigin("http://localhost:3001");  // 备用端口
        config.addAllowedOrigin("http://localhost:3002");  // 备用端口
        config.addAllowedOrigin("http://localhost:3003");  // 当前使用
        
        config.addAllowedMethod("GET", "POST", "PUT", "DELETE", "OPTIONS");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        
        return new CorsFilter(source);
    }
}
```

**注意事项：**
- 修改 CORS 配置后**必须重启后端**
- 首次访问失败时，刷新页面即可
- 生产环境应使用具体域名，不使用 `*`

---

### 2. 前端降级策略

**原则：** API 失败时不阻断用户操作

**实现：**

```typescript
// experimentStore.ts
fetchExperiments: async () => {
  set({ loading: true, error: null });
  try {
    const apiExperiments = await experimentApi.list(1, 100);
    const experiments = apiExperiments.map(mapApiToExperiment);
    set({ experiments, loading: false });
  } catch (error) {
    console.error('Failed to fetch experiments:', error);
    // 降级到 mock 数据
    set({ 
      experiments: mockExperiments.map(e => ({ ...e })), 
      loading: false, 
      error: 'API 连接失败，使用演示数据' 
    });
  }
}
```

**优势：**
- 开发阶段：后端未启动时仍可演示
- 生产环境：网络抖动时显示缓存数据
- 用户体验：不出现白屏或错误页面

---

### 3. 数据映射层

**问题：** 后端字段名与前端期望不一致

**示例：**
```
后端: expId (string)      → 前端: paywallId (string)
后端: bucketStart (int)   → 前端: trafficAllocation (percentage)
后端: createdAt (string)  → 前端: startDate (string)
```

**解决方案：**

```typescript
// 创建专门的映射函数
function mapApiToExperiment(apiExp: ApiExperiment): Experiment {
  return {
    id: apiExp.id.toString(),
    name: apiExp.name,
    paywallId: apiExp.expId,
    paywallName: apiExp.name,
    status: apiExp.status as ExperimentStatus,
    hypothesis: apiExp.description || '待补充假设',
    primaryMetric: 'conversion_rate',
    targetingRules: [],
    startDate: apiExp.createdAt,
    variants: [],
    trafficAllocation: Math.round(((apiExp.bucketEnd - apiExp.bucketStart + 1) / 100) * 100),
    results: { confidence: 0, totalImpressions: 0, totalConversions: 0 },
    createdAt: apiExp.createdAt,
  };
}
```

**注意事项：**
- 映射函数单独维护，不耦合业务逻辑
- 处理 null/undefined 情况
- 处理类型转换（number ↔ string）

---

### 4. 环境变量管理

**配置文件：**

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

```typescript
// api/experimentApi.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
```

**优势：**
- 避免硬编码
- 支持多环境配置（development, staging, production）
- TypeScript 类型提示

---

### 5. 自动化验证技巧

#### 5.1 使用 Browser Agent 截图

```
任务描述：
1. 打开页面 → 等待 3 秒 → 截图
2. 点击按钮 → 等待加载 → 截图
3. 检查控制台 → 截图
4. 返回所有截图路径
```

#### 5.2 数据对比验证

```powershell
# 步骤 1：curl 获取后端数据
curl -s http://localhost:8081/api/v1/experiments | ConvertFrom-Json | Select-Object id, name

# 步骤 2：Browser Agent 截图前端显示
# 步骤 3：对比两者是否一致
```

#### 5.3 网络请求监控

在 Browser Agent 任务中包含：
```
- 打开开发者工具
- 切换到 Network 标签
- 筛选 XHR 请求
- 检查状态码（200, 400, 500）
- 检查响应时间
- 截图记录
```

---

### 6. 依赖管理规范

**自动安装策略：**

```bash
# 发现缺失依赖时直接安装
pnpm add recharts --filter @gate-flow/admin
pnpm add axios --filter @gate-flow/admin

# 安装后检查 Vite 热更新日志
# 预期：[vite] ✨ new dependencies optimized: recharts
```

**注意事项：**
- 在 monorepo 中使用 `--filter` 指定包
- 安装后 Vite 会自动优化依赖
- 无需手动重启前端服务

---

### 7. 服务重启自动化

#### 检测端口占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :8081

# 输出示例：
# TCP    [::1]:8081    [::1]:51468    ESTABLISHED    17016
```

#### 停止进程

```powershell
# 强制停止进程
taskkill /F /PID 17016

# 如果遇到权限问题，使用任务管理器手动结束
```

#### 重启服务

```bash
# 后端
cd d:\Projects\gate-flow\backend\victor-service
mvn spring-boot:run -pl victor-web

# 前端（新终端）
pnpm --filter @gate-flow/admin dev
```

---

## 测试清单模板

### API 测试清单

- [ ] **列表接口**
  - [ ] 分页参数正确（current, size）
  - [ ] 筛选参数正确（layerId, status）
  - [ ] 返回数据总数正确
  - [ ] 空数据时返回 []

- [ ] **详情接口**
  - [ ] 返回完整实验信息
  - [ ] 包含变体列表
  - [ ] 包含版本信息
  - [ ] 404 处理（不存在的 ID）

- [ ] **创建接口**
  - [ ] 必填字段验证
  - [ ] 自动生成 expId
  - [ ] 创建初始版本
  - [ ] 返回完整对象

- [ ] **更新接口**
  - [ ] 部分更新支持
  - [ ] 版本创建逻辑
  - [ ] 并发更新处理

- [ ] **状态变更**
  - [ ] draft → running
  - [ ] running → paused
  - [ ] paused → running
  - [ ] 非法状态转换拒绝

- [ ] **版本管理**
  - [ ] 版本历史查询
  - [ ] 活跃版本查询
  - [ ] 版本回滚
  - [ ] 版本对比

---

### 前端测试清单

- [ ] **页面加载**
  - [ ] 无控制台错误
  - [ ] 加载状态显示（spinner）
  - [ ] 数据正确渲染
  - [ ] 空状态处理

- [ ] **导航功能**
  - [ ] 菜单点击正常
  - [ ] 路由切换正常
  - [ ] 面包屑更新
  - [ ] 浏览器后退/前进

- [ ] **列表页面**
  - [ ] 数据表格渲染
  - [ ] 分页控件工作
  - [ ] 筛选功能正常
  - [ ] 排序功能正常

- [ ] **详情页面**
  - [ ] 所有字段显示
  - [ ] 变体列表渲染
  - [ ] 版本历史显示
  - [ ] 操作按钮可用

- [ ] **表单交互**
  - [ ] 字段验证
  - [ ] 错误提示
  - [ ] 提交加载状态
  - [ ] 成功提示

- [ ] **状态管理**
  - [ ] Zustand store 更新
  - [ ] 组件重新渲染
  - [ ] 缓存策略
  - [ ] 错误边界

---

## 常见问题排查

### 问题 1：CORS 错误

**症状：**
```
Access to fetch at 'http://localhost:8081/api/v1/experiments' from origin 
'http://localhost:3003' has been blocked by CORS policy
```

**排查步骤：**
1. 检查 WebConfig.java 是否包含当前端口
2. 确认后端已重启
3. 清除浏览器缓存
4. 刷新页面重试

---

### 问题 2：端口冲突

**症状：**
```
Port 8081 was already in use.
```

**排查步骤：**
```powershell
# 1. 查找占用进程
netstat -ano | findstr :8081

# 2. 停止进程
taskkill /F /PID <进程ID>

# 3. 重启服务
```

---

### 问题 3：前端显示 mock 数据

**症状：** 页面显示中文测试数据，而非后端真实数据

**排查步骤：**
1. 打开浏览器控制台 → Network 标签
2. 检查 `/api/v1/experiments` 请求状态
3. 如果失败，检查 CORS 配置
4. 如果成功，检查数据映射函数
5. 刷新页面重试

---

### 问题 5：暂停后无法恢复实验

**症状：**
```
com.gateflow.victor.common.exception.VictorException: Only draft experiment can be started
```

**原因：**
后端状态机只允许从 `draft` 状态启动实验，但暂停后的实验状态是 `paused`

**修复：**
```java
// ExperimentService.java
// 修改前
if (!ExperimentStatus.DRAFT.getCode().equals(experiment.getStatus())) {
    throw new VictorException("Only draft experiment can be started");
}

// 修改后
String status = experiment.getStatus();
if (!ExperimentStatus.DRAFT.getCode().equals(status) && 
    !ExperimentStatus.PAUSED.getCode().equals(status)) {
    throw new VictorException("Only draft or paused experiment can be started");
}
```

**注意事项：**
- 修改后需要重新编译 victor-service 模块
- 使用 `mvn clean install -DskipTests -pl victor-service -am`
- 然后重启 victor-web

---

**症状：**
```
[vite] Internal server error: Failed to resolve import "recharts"
```

**排查步骤：**
```bash
# 1. 确认依赖已安装
pnpm list recharts --filter @gate-flow/admin

# 2. 重新安装
pnpm add recharts --filter @gate-flow/admin

# 3. 检查 Vite 日志
# 预期：[vite] ✨ new dependencies optimized: recharts
```

---

## 工具参考

### curl 常用命令

```powershell
# GET 请求
curl -s http://localhost:8081/api/v1/experiments | ConvertFrom-Json

# POST 请求（JSON body）
curl -s -X POST http://localhost:8081/api/v1/experiments `
  -H "Content-Type: application/json" `
  -d '{"name": "test"}' | ConvertFrom-Json

# 查看请求详情
curl -v http://localhost:8081/api/v1/experiments

# 仅显示 HTTP 状态码
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/v1/experiments
```

### Browser Agent 任务模板

```
任务：测试 [功能名称]

步骤：
1. 打开 http://localhost:3003/[路径]
2. 等待页面加载完成（3秒）
3. 截图记录初始状态
4. [执行具体操作]
5. 等待操作完成（2秒）
6. 截图记录结果
7. 打开开发者工具 → Console → 截图
8. 打开开发者工具 → Network → 截图
9. 返回所有截图路径和详细描述

验证要点：
- 是否显示真实 API 数据
- 是否有任何错误提示
- 网络请求状态码
- 数据一致性
```

---

## 总结

### 核心原则

1. **全自动化执行** - 不需要人工干预
2. **完整闭环验证** - 前端 → API → 数据库 → 返回
3. **截图记录** - 每个关键步骤都截图
4. **数据对比** - curl 验证 vs 前端显示
5. **问题直接修复** - 发现 bug 立即解决

### 工作流程

```
后端 API 测试 (curl)
  ↓
前端集成测试 (Browser Agent)
  ↓
端到端联调 (完整流程)
  ↓
问题排查与修复
  ↓
验证通过 ✅
```

### 文档维护

- 新增 API 时更新测试清单
- 遇到新问题时更新常见问题排查
- 定期 review 并优化流程
- 保持示例代码最新

---

**最后更新：** 2026-05-06  
**维护者：** GateFlow 团队
