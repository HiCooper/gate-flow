#!/usr/bin/env node
/**
 * 事件上报验证脚本
 * 查询ClickHouse中最近上报的事件
 *
 * 用法：
 *   node scripts/verify-events.js [用户ID] [数量]
 */

const API_BASE = process.env.API_BASE || 'http://localhost:8123';

async function verifyEvents(userId = null, limit = 10) {
  console.log('🔍 查询最近上报的事件...');
  console.log('═'.repeat(60));

  let query;
  if (userId) {
    query = `
      SELECT 
        event_id,
        event_type,
        user_id,
        exp_ids,
        variants,
        timestamp,
        properties
      FROM victor.events 
      WHERE user_id = '${userId}'
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;
    console.log(`查询用户: ${userId}`);
  } else {
    query = `
      SELECT 
        event_id,
        event_type,
        user_id,
        exp_ids,
        variants,
        timestamp,
        properties
      FROM victor.events 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;
    console.log('查询所有用户');
  }

  try {
    const response = await fetch(`${API_BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`ClickHouse查询失败: ${response.statusText}`);
    }

    const data = await response.text();
    const lines = data.trim().split('\n');

    if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
      console.log('❌ 没有找到事件记录');
      return;
    }

    console.log(`✅ 找到 ${lines.length - 1} 条事件（表头不计）`);
    console.log('');

    // 解析TSV格式数据
    const headers = lines[0].split('\t');
    console.log('列:', headers.join(', '));
    console.log('');

    lines.slice(1).forEach((line, index) => {
      const values = line.split('\t');
      console.log(`[${index + 1}]`);
      console.log(`  事件ID: ${values[0]}`);
      console.log(`  事件类型: ${values[1]}`);
      console.log(`  用户ID: ${values[2]}`);
      console.log(`  实验ID: ${values[3]}`);
      console.log(`  变体: ${values[4]}`);
      console.log(`  时间: ${values[5]}`);
      console.log(`  属性: ${values[6]}`);
      console.log('');
    });

    // 统计信息
    console.log('═'.repeat(60));
    console.log('📊 事件统计');
    console.log('═'.repeat(60));

    const eventTypes = {};
    lines.slice(1).forEach(line => {
      const values = line.split('\t');
      const eventType = values[1];
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
    });

    console.log('事件类型分布:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    console.error(`❌ 查询失败: ${error.message}`);
    console.log('');
    console.log('提示：');
    console.log('1. 确保ClickHouse正在运行: docker ps | grep clickhouse');
    console.log('2. 确保环境变量正确: export CLICKHOUSE_URL=http://localhost:8123');
    console.log('3. 或者使用API_BASE环境变量: API_BASE=http://your-clickhouse:8123');
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const userId = args[0] || null;
const limit = parseInt(args[1]) || 10;

verifyEvents(userId, limit);
