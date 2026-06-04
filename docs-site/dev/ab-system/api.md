# REST API 参考

GateFlow 提供 RESTful API，供前端应用和下游服务调用。

## 接口分组

| 分组 | 路径前缀 | Controller |
|------|---------|------------|
| 认证授权 | `/api/v1/auth` | AuthController（JWT 登录/注册） |
| 实验管理 | `/api/v1/experiments` | ExperimentController、ExperimentStatisticsController、ExperimentVersionController |
| 分析报告 | `/api/v1/reports` | ExperimentReportController |
| 层级管理 | `/api/v1/layers` | LayerController |
| 域管理 | `/api/v1/domains` | DomainController |
| 分桶管理 | `/api/v1/buckets` | BucketController |
| 运行时分流 | `/api/v1/bucketing` | BucketingController |
| 配置管理 | `/api/v1/config` | ConfigController |
| 事件上报 | `/api/v1/events` | EventController（在 victor-service 中） |
| 指标查询 | `/api/v1/metrics` | MetricsController |
| Bandit 优化 | `/api/v1/bandit` | BanditController |
| 贝叶斯分析 | `/api/v1/analysis` | BayesianAnalysisController |
| 样本量估算 | `/api/v1/power-analysis` | PowerAnalysisController |
| 灰度推进 | `/api/v1/ramp` | RampController |
| 流量地图 | `/api/v1/traffic` | TrafficMapController |
| 白名单管理 | `/api/v1/whitelist` | ExperimentWhitelistController |
| 角色权限 | `/api/v1/rbac` | RbacController |
| 子群分析 | `/api/v1/subgroup-analysis` | SubgroupAnalysisController |

## 访问方式

启动后端服务后，可通过以下地址查看交互式文档：

- **Swagger UI**: http://localhost:8081/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8081/v3/api-docs

## 认证

GateFlow 使用 JWT（JSON Web Token）进行身份认证。

### 登录获取 Token

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

响应包含 JWT Token，后续请求在 Header 中携带：

```
Authorization: Bearer <jwt-token>
```

### 无需认证的接口

以下接口在 `SecurityConfig` 中白名单放行：
- `/api/v1/auth/login` — 登录
- `/api/v1/auth/register` — 注册
- `/api/v1/config/**` — SDK 配置拉取
- `/api/v1/bucketing/**` — 运行时分流

## RBAC 权限模型

系统通过 `@RequirePermission` 注解控制接口访问。`PermissionInterceptor` 从 JWT Token 提取用户角色并校验权限。

### 角色

| 角色 | 说明 |
|------|------|
| `ADMIN` | 系统管理员，全部权限（含用户管理） |
| `OPERATOR` | 实验运营，可创建/编辑/审批/查看实验和分析 |
| `VIEWER` | 只读用户，仅可查看实验和分析 |
| `SDK_CLIENT` | SDK 客户端，仅限分流/配置/事件 API |

### 权限

| 权限 | 说明 |
|------|------|
| `CREATE_EXPERIMENT` | 创建实验 |
| `EDIT_EXPERIMENT` | 编辑实验 |
| `DELETE_EXPERIMENT` | 删除实验 |
| `VIEW_EXPERIMENT` | 查看实验 |
| `APPROVE_EXPERIMENT` | 审批实验 |
| `SUBMIT_APPROVAL` | 提交审批 |
| `VIEW_TRAFFIC` | 查看流量地图 |
| `VIEW_ANALYSIS` | 查看分析报告 |
| `POWER_ANALYSIS` | 样本量/功效分析 |
| `MANAGE_USERS` | 管理用户（仅 ADMIN） |

::: warning 注意
API 文档目前正在完善中，更多详细接口请参考 Swagger UI。
:::
