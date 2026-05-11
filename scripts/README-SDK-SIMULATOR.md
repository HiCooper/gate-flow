# GateFlow SDK 模拟器

完整功能的SDK模拟器，模拟真实客户端行为，包括本地分桶计算和事件上报。

## 功能特性

✅ **真实分桶计算** - 使用MurmurHash3算法，与后端BucketEngine完全一致  
✅ **配置自动拉取** - 从后端API获取实验配置和变体信息  
✅ **白名单支持** - 验证白名单用户的强制分桶  
✅ **批量上报** - 支持单次上报多个事件  
✅ **多用户模拟** - 并发模拟多个用户行为  
✅ **实时监控** - 显示事件类型分布和变体分布统计  
✅ **优雅退出** - Ctrl+C显示完整统计报告  

## 快速开始

### 基础用法

```bash
# 模拟5个用户，2秒间隔上报
node scripts/sdk-simulator.js --exp 6052040

# 指定用户数量和上报间隔
node scripts/sdk-simulator.js --exp 6052040 --users 10 --interval 1

# 批量上报（每次5个事件）
node scripts/sdk-simulator.js --exp 6052040 --batch-size 5
```

### 白名单测试

```bash
# 验证白名单用户分桶
node scripts/sdk-simulator.js --exp 6055989 --whitelist test_user_001,test_user_004
```

### 压力测试

```bash
# 50个用户，0.5秒高频上报
node scripts/sdk-simulator.js --exp 6052040 --users 50 --interval 0.5
```

## 命令行参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--exp` | `-e` | 实验业务ID（必填） | - |
| `--users` | `-u` | 模拟用户数量 | 5 |
| `--interval` | `-i` | 上报间隔（秒） | 2 |
| `--batch-size` | `-b` | 每次批量上报事件数 | 1 |
| `--whitelist` | `-w` | 白名单用户列表（逗号分隔） | [] |
| `--help` | `-h` | 显示帮助信息 | - |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_BASE` | API基础URL | `http://localhost:8081/api/v1` |

## 完整示例

### 示例1：基本事件上报

```bash
# 启动模拟器
node scripts/sdk-simulator.js --exp 6052040 --users 5 --interval 2
```

输出示例：
```
🚀 初始化 GateFlow SDK 模拟器
════════════════════════════════════════════════════════════
📡 拉取实验配置...
  实验: SDK模拟器测试实验
  状态: running
  层级: 1
  变体数量: 2 (总 4 个)
    - 对照组: [0, 4999] (桶ID: 32688)
    - 实验组: [5000, 9999] (桶ID: 97630)

👥 生成用户列表...
  生成 5 个模拟用户

🎯 计算用户分桶...
  sim_user_0001 -> 对照组 (桶号: 1372)
  sim_user_0002 -> 对照组 (桶号: 202)
  sim_user_0003 -> 实验组 (桶号: 5206)
  sim_user_0004 -> 实验组 (桶号: 9370)
  sim_user_0005 -> 实验组 (桶号: 8428)
```

### 示例2：白名单验证

```bash
# 1. 先给实验添加白名单用户
curl -X POST "http://localhost:8081/api/v1/whitelist/experiments/6055989/buckets/55669/users?userIds=test_user_001,test_user_002"

# 2. 运行模拟器验证分桶
node scripts/sdk-simulator.js --exp 6055989 --whitelist test_user_001,test_user_002
```

输出会显示白名单用户被强制分配到指定分桶。

### 示例3：批量事件上报

```bash
# 每次上报5个事件，1秒间隔
node scripts/sdk-simulator.js --exp 6052040 --users 10 --batch-size 5 --interval 1
```

这会模拟10个用户，每秒上报50个事件（10用户 × 5事件/用户）。

## 事件类型

模拟器生成以下事件类型：

| 事件类型 | 权重 | 说明 | 示例属性 |
|----------|------|------|----------|
| `exposure` | 60% | 曝光事件 | page, position, variant |
| `click` | 30% | 点击事件 | button, variant, element_id |
| `conversion` | 5% | 转化事件 | plan, amount, currency |
| `page_view` | 5% | 页面浏览 | page, referrer, duration |

## 技术实现

### 分桶算法

使用MurmurHash3算法，与后端完全一致：

```javascript
function computeBucket(userId, layerId, salt) {
  const hashInput = `${userId}#${layerId}#${salt}`;
  const hash = murmurHash3(hashInput);
  return hash % 10000;
}
```

### 白名单优先级

1. 先检查用户是否在白名单（调用后端API）
2. 如果在白名单，直接使用分配的bucketId
3. 如果不在白名单，使用本地MurmurHash3计算

### 批量上报

```javascript
// 批量上报事件
await fetch(`${API_BASE}/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ events: [...] }), // 最多100条
});
```

## 验证事件上报

### 查看上报的事件

```bash
# 查看Kafka消息（如果配置了Kafka）
docker exec -it docker-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic victor-events \
  --from-beginning

# 或直接查询ClickHouse
docker exec -it docker-clickhouse-1 clickhouse-client \
  --query "SELECT * FROM victor.events ORDER BY timestamp DESC LIMIT 10"
```

### 使用现有模拟脚本

项目还有一个简化的模拟脚本：

```bash
# 简单模式：随机实验，2-5秒间隔
node scripts/simulate-sdk-events.js

# 指定实验ID
node scripts/simulate-sdk-events.js 6052040
```

## 故障排除

### 问题：实验没有配置变体

确保实验已创建并添加了变体：

```bash
# 创建实验并添加变体
curl -X POST http://localhost:8081/api/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试实验",
    "layerId": 1,
    "variants": [
      {"variantKey": "control", "name": "对照组", "trafficPercentage": 50},
      {"variantKey": "treatment", "name": "实验组", "trafficPercentage": 50}
    ]
  }'
```

### 问题：事件上报失败

检查后端服务是否运行：

```bash
# 检查健康状态
curl http://localhost:8081/actuator/health

# 检查Kafka和ClickHouse
docker ps | grep -E "kafka|clickhouse"
```

### 问题：分桶结果不一致

确保：
1. 实验状态为 `running`
2. 变体配置正确（bucketStart, bucketEnd）
3. 层级ID与实验配置匹配

## 与现有脚本的区别

| 特性 | sdk-simulator.js（新） | simulate-sdk-events.js（旧） |
|------|------------------------|------------------------------|
| 分桶计算 | ✅ 本地MurmurHash3 | ❌ 随机分配 |
| 配置拉取 | ✅ 从API拉取 | ❌ 硬编码 |
| 白名单支持 | ✅ 完整支持 | ❌ 不支持 |
| 批量上报 | ✅ 可配置 | ❌ 单条上报 |
| 实时监控 | ✅ 详细统计 | ⚠️ 基础日志 |
| 多用户 | ✅ 可配置 | ⚠️ 固定100用户 |
| 事件类型权重 | ✅ 符合真实场景 | ❌ 均匀分布 |

## 贡献

如需添加新功能或修复bug，请提交Issue或Pull Request。
