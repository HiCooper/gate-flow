# 监控告警

本文档介绍 GateFlow 的监控和告警配置。

## 监控指标

### 应用指标 (Actuator)

```bash
# 查看所有端点
curl http://localhost:8080/actuator

# 查看健康状态
curl http://localhost:8080/actuator/health

# 查看指标
curl http://localhost:8080/actuator/metrics
```

### 核心指标

| 指标 | 说明 | 阈值建议 |
|------|------|----------|
| http_server_requests_seconds | HTTP 请求延迟 | p99 < 200ms |
| jvm_memory_used_bytes | JVM 内存使用 | < 80% |
| mysql_active | 数据库连接数 | < 80% |
| redis_connected_clients | Redis 连接数 | < 1000 |

## 日志配置

```yaml
# application.yml
logging:
  level:
    com.gateflow: INFO
    org.springframework: WARN
  file:
    name: /var/log/victor/victor.log
    max-size: 100MB
    max-history: 30
```

## 告警规则

### API 可用性告警

- 5分钟内成功率 < 99%
- 触发: 短信/邮件通知

### 延迟告警

- HTTP p99 延迟 > 500ms
- 触发: Slack 通知

### 错误率告警

- 5分钟内错误数 > 100
- 触发: 短信/邮件通知

## 监控工具建议

| 工具 | 用途 |
|------|------|
| Prometheus | 指标收集 |
| Grafana | 可视化面板 |
| ELK Stack | 日志分析 |
| Sentry | 错误追踪 |