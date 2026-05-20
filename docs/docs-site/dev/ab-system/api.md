# REST API 参考

GateFlow 提供 RESTful API,供前端应用和下游服务调用。

## 接口分组

| 分组 | 路径前缀 | 说明 |
|------|---------|------|
| 实验管理 | `/api/v1/experiments` | 实验 CRUD、启停操作 |
| 层级管理 | `/api/v1/layers` | 实验层级管理 |
| 变体管理 | `/api/v1/variants` | 实验变体配置 |
| 流量分配 | `/api/v1/bucket` | 运行时分桶请求 |
| 配置管理 | `/api/v1/config` | SDK 配置获取 |
| 事件上报 | `/api/v1/events` | 事件数据采集 |

## 访问方式

启动后端服务后,可通过以下地址查看交互式文档:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## 认证

所有 API 请求需在 Header 中携带 API Key:

```
Authorization: Bearer <your-api-key>
```

::: warning 注意
API 文档目前正在完善中,更多详细接口请参考 Swagger UI。
:::
