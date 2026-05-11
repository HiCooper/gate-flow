#!/bin/bash
# SDK模拟器完整测试演示
# 运行此脚本将执行所有测试场景

set -e  # 遇到错误时退出

API_BASE=${API_BASE:-http://localhost:8081/api/v1}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          GateFlow SDK 模拟器 - 完整测试演示              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 检查后端是否运行
echo "🔍 检查后端服务..."
if curl -s -f "${API_BASE}/experiments" > /dev/null 2>&1; then
  echo "✅ 后端服务运行正常"
else
  echo "❌ 后端服务未运行，请先启动后端"
  exit 1
fi
echo ""

# 测试场景1：创建测试实验
echo "══════════════════════════════════════════════════════════"
echo "📝 测试场景1: 创建测试实验"
echo "══════════════════════════════════════════════════════════"
echo ""

EXPERIMENT_ID=$(curl -s -X POST "${API_BASE}/experiments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SDK模拟器演示实验",
    "description": "演示SDK模拟器的完整功能",
    "layerId": 1,
    "variants": [
      {
        "variantKey": "control",
        "name": "对照组",
        "trafficPercentage": 50,
        "params": "{\"button_color\": \"blue\", \"text\": \"原始版本\"}"
      },
      {
        "variantKey": "treatment",
        "name": "实验组",
        "trafficPercentage": 50,
        "params": "{\"button_color\": \"red\", \"text\": \"优化版本\"}"
      }
    ]
  }' | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['expId'])")

echo "✅ 实验创建成功: $EXPERIMENT_ID"
echo ""

# 启动实验
echo "🚀 启动实验..."
curl -s -X POST "${API_BASE}/experiments/$(curl -s "${API_BASE}/experiments" | python3 -c "import sys, json; exps=json.load(sys.stdin); exp=[e for e in exps if e['expId']=='$EXPERIMENT_ID'][0]; print(exp['id'])")/start" > /dev/null
echo "✅ 实验已启动"
echo ""

# 测试场景2：基础事件上报
echo "══════════════════════════════════════════════════════════"
echo "📊 测试场景2: 基础事件上报（5个用户，3秒间隔）"
echo "══════════════════════════════════════════════════════════"
echo ""

node "${SCRIPT_DIR}/sdk-simulator.js" --exp "$EXPERIMENT_ID" --users 5 --interval 3 &
PID1=$!
sleep 8
kill $PID1 2>/dev/null || true
wait $PID1 2>/dev/null || true
echo ""

# 测试场景3：白名单测试
echo "══════════════════════════════════════════════════════════"
echo "🎯 测试场景3: 白名单用户测试"
echo "══════════════════════════════════════════════════════════"
echo ""

# 获取变体信息
VARIANTS=$(curl -s "${API_BASE}/variants/experiment/$(curl -s "${API_BASE}/experiments" | python3 -c "import sys, json; exps=json.load(sys.stdin); exp=[e for e in exps if e['expId']=='$EXPERIMENT_ID'][0]; print(exp['id'])")" | python3 -c "import sys, json; variants=[v for v in json.load(sys.stdin) if v.get('isActive')]; print(' '.join([v['bucketId'] for v in variants]))")
CONTROL_BUCKET=$(echo $VARIANTS | cut -d' ' -f1)
TREATMENT_BUCKET=$(echo $VARIANTS | cut -d' ' -f2)

echo "对照组桶ID: $CONTROL_BUCKET"
echo "实验组桶ID: $TREATMENT_BUCKET"
echo ""

# 添加白名单用户
echo "添加白名单用户..."
curl -s -X POST "${API_BASE}/whitelist/experiments/${EXPERIMENT_ID}/buckets/${CONTROL_BUCKET}/users?userIds=whitelist_user_001,whitelist_user_002" > /dev/null
curl -s -X POST "${API_BASE}/whitelist/experiments/${EXPERIMENT_ID}/buckets/${TREATMENT_BUCKET}/users?userIds=whitelist_user_003" > /dev/null
echo "✅ 白名单用户已添加"
echo ""

# 运行白名单测试
echo "运行白名单测试..."
node "${SCRIPT_DIR}/sdk-simulator.js" --exp "$EXPERIMENT_ID" --whitelist "whitelist_user_001,whitelist_user_003" --interval 2 &
PID2=$!
sleep 5
kill $PID2 2>/dev/null || true
wait $PID2 2>/dev/null || true
echo ""

# 测试场景4：批量上报
echo "══════════════════════════════════════════════════════════"
echo "📦 测试场景4: 批量事件上报（10用户，批量大小5）"
echo "══════════════════════════════════════════════════════════"
echo ""

node "${SCRIPT_DIR}/sdk-simulator.js" --exp "$EXPERIMENT_ID" --users 10 --batch-size 5 --interval 2 &
PID3=$!
sleep 6
kill $PID3 2>/dev/null || true
wait $PID3 2>/dev/null || true
echo ""

# 查询ClickHouse验证事件
echo "══════════════════════════════════════════════════════════"
echo "✅ 验证事件上报结果"
echo "══════════════════════════════════════════════════════════"
echo ""

echo "查询ClickHouse中最近的事件..."
docker exec -i docker-clickhouse-1 clickhouse-client --query "
SELECT 
  count() as event_count,
  uniq(user_id) as user_count,
  uniq(event_type) as type_count
FROM victor.events 
WHERE exp_ids = ['$EXPERIMENT_ID']
" 2>/dev/null | column -t || echo "（无法查询ClickHouse，请手动检查）"

echo ""
echo "最近5条事件详情:"
docker exec -i docker-clickhouse-1 clickhouse-client --query "
SELECT 
  event_type,
  user_id,
  variants,
  toString(timestamp) as time
FROM victor.events 
WHERE exp_ids = ['$EXPERIMENT_ID']
ORDER BY timestamp DESC 
LIMIT 5
" 2>/dev/null | column -t || echo "（无法查询ClickHouse）"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "🎉 测试完成！"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "实验ID: $EXPERIMENT_ID"
echo ""
echo "后续操作："
echo "1. 查看实验详情: curl ${API_BASE}/experiments | python3 -m json.tool"
echo "2. 查看变体列表: curl ${API_BASE}/variants/experiment/<数据库ID> | python3 -m json.tool"
echo "3. 查看白名单: curl ${API_BASE}/whitelist/experiments/${EXPERIMENT_ID} | python3 -m json.tool"
echo "4. 单独运行模拟器: node scripts/sdk-simulator.js --exp $EXPERIMENT_ID"
echo ""
