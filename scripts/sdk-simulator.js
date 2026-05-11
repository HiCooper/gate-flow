#!/usr/bin/env node
/**
 * GateFlow SDK 模拟器 - 完整版本
 * 模拟真实SDK调用，包括分桶计算和埋点上报
 *
 * 功能：
 * 1. 从后端拉取SDK配置（实验列表、分桶规则）
 * 2. 本地执行分桶计算（MurmurHash）
 * 3. 模拟用户行为事件上报
 * 4. 支持白名单用户测试
 * 5. 批量上报支持
 * 6. 实时统计和监控
 *
 * 使用方式：
 *   # 基础模式：指定实验ID，自动拉取配置
 *   node scripts/sdk-simulator.js --exp 6055989
 *
 *   # 批量模式：多个用户并发模拟
 *   node scripts/sdk-simulator.js --exp 6055989 --users 10 --interval 2
 *
 *   # 白名单测试：验证白名单用户分桶
 *   node scripts/sdk-simulator.js --exp 6055989 --whitelist test_user_001,test_user_004
 *
 *   # 批量上报：每次上报多个事件
 *   node scripts/sdk-simulator.js --exp 6055989 --batch-size 5
 *
 *   # 压力测试：高频上报
 *   node scripts/sdk-simulator.js --exp 6055989 --users 50 --interval 0.5
 */

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

// ============================================
// MurmurHash3 实现（与后端BucketEngine一致）
// ============================================

function murmurHash3(key, seed = 0) {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;

  let hash = seed;
  const len = key.length;
  const bytes = [];

  for (let i = 0; i < len; i++) {
    bytes.push(key.charCodeAt(i) & 0xff);
  }

  const numBlocks = Math.floor(len / 4);

  for (let i = 0; i < numBlocks; i++) {
    let k = bytes[i * 4] |
            (bytes[i * 4 + 1] << 8) |
            (bytes[i * 4 + 2] << 16) |
            (bytes[i * 4 + 3] << 24);

    k = Math.imul(k, c1);
    k = (k << r1) | (k >>> (32 - r1));
    k = Math.imul(k, c2);

    hash ^= k;
    hash = (hash << r2) | (hash >>> (32 - r2));
    hash = Math.imul(hash, m) + n;
  }

  let k1 = 0;
  const tail = numBlocks * 4;

  switch (len - tail) {
    case 3:
      k1 ^= bytes[tail + 2] << 16;
    case 2:
      k1 ^= bytes[tail + 1] << 8;
    case 1:
      k1 ^= bytes[tail];
      k1 = Math.imul(k1, c1);
      k1 = (k1 << r1) | (k1 >>> (32 - r1));
      k1 = Math.imul(k1, c2);
      hash ^= k1;
  }

  hash ^= len;
  hash = fmix32(hash);

  return hash >>> 0;
}

function fmix32(hash) {
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

// 计算分桶（与后端BucketEngine.computeBucket一致）
function computeBucket(userId, layerId, salt) {
  const hashInput = `${userId}#${layerId}#${salt}`;
  const hash = murmurHash3(hashInput);
  return hash % 10000;
}

// 根据桶号找到对应的变体
function findVariant(bucketNumber, variants) {
  for (const variant of variants) {
    if (bucketNumber >= variant.bucketStart && bucketNumber <= variant.bucketEnd) {
      return variant;
    }
  }
  return null;
}

// ============================================
// 配置和状态管理
// ============================================

class SDKSimulator {
  constructor(options) {
    this.expId = options.expId;
    this.userCount = options.userCount || 1;
    this.intervalSeconds = options.intervalSeconds || 2;
    this.batchSize = options.batchSize || 1;
    this.whitelistUsers = options.whitelistUsers || [];
    this.users = [];
    this.experimentConfig = null;
    this.variants = [];
    this.stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      startTime: null,
      eventsByType: {},
      eventsByVariant: {},
    };
  }

  // 初始化SDK模拟器
  async init() {
    console.log('🚀 初始化 GateFlow SDK 模拟器');
    console.log('═'.repeat(60));

    // 1. 拉取实验配置
    await this.fetchExperimentConfig();

    // 2. 生成用户列表
    this.generateUsers();

    // 3. 为每个用户计算分桶结果
    await this.computeUserVariants();

    console.log('═'.repeat(60));
    console.log(`✅ 初始化完成: ${this.users.length} 个用户, ${this.variants.length} 个变体`);
    console.log('═'.repeat(60));
    console.log('');
  }

  // 从后端拉取实验配置
  async fetchExperimentConfig() {
    console.log('📡 拉取实验配置...');

    try {
      // 获取实验详情
      const expResponse = await fetch(`${API_BASE}/experiments`);
      const experiments = await expResponse.json();
      const experiment = experiments.find(e => e.expId === this.expId);

      if (!experiment) {
        throw new Error(`实验 ${this.expId} 不存在`);
      }

      console.log(`  实验: ${experiment.name}`);
      console.log(`  状态: ${experiment.status}`);
      console.log(`  层级: ${experiment.layerId}`);

      // 获取变体列表（注意：需要使用数据库ID，不是业务expId）
      const variantsResponse = await fetch(`${API_BASE}/variants/experiment/${experiment.id}`);
      const allVariants = await variantsResponse.json();
      
      // 只使用激活的变体
      this.variants = allVariants.filter(v => v.isActive);

      if (this.variants.length === 0) {
        throw new Error('实验没有激活的变体');
      }

      console.log(`  变体数量: ${this.variants.length} (总 ${allVariants.length} 个)`);
      this.variants.forEach(v => {
        console.log(`    - ${v.name}: [${v.bucketStart}, ${v.bucketEnd}] (桶ID: ${v.bucketId})`);
      });

      this.experimentConfig = experiment;

    } catch (error) {
      console.error(`❌ 拉取配置失败: ${error.message}`);
      throw error;
    }
  }

  // 生成模拟用户
  generateUsers() {
    console.log('');
    console.log('👥 生成用户列表...');

    // 如果有白名单用户，优先使用
    if (this.whitelistUsers.length > 0) {
      console.log('  使用白名单用户:');
      this.whitelistUsers.forEach(userId => {
        console.log(`    - ${userId} (白名单)`);
        this.users.push({
          userId,
          deviceId: `device_${userId}`,
          sessionId: this.generateSessionId(),
          platform: this.randomChoice(['web', 'ios', 'android']),
          isWhitelist: true,
        });
      });
    } else {
      // 生成普通模拟用户
      for (let i = 1; i <= this.userCount; i++) {
        const userId = `sim_user_${String(i).padStart(4, '0')}`;
        this.users.push({
          userId,
          deviceId: `device_${userId}`,
          sessionId: this.generateSessionId(),
          platform: this.randomChoice(['web', 'ios', 'android']),
          isWhitelist: false,
        });
      }
      console.log(`  生成 ${this.userCount} 个模拟用户`);
    }
  }

  // 为每个用户计算分桶
  async computeUserVariants() {
    console.log('');
    console.log('🎯 计算用户分桶...');

    const layerId = this.experimentConfig.layerId;
    const salt = this.expId; // 使用expId作为salt

    for (const user of this.users) {
      // 先检查白名单（模拟后端逻辑）
      if (user.isWhitelist) {
        // 白名单用户需要调用后端API获取分配的桶
        const bucketId = await this.getWhitelistBucket(user.userId);
        if (bucketId) {
          const variant = this.variants.find(v => v.bucketId === bucketId);
          if (variant) {
            user.variant = variant;
            user.bucketNumber = -1; // 白名单不计算桶号
            console.log(`  ${user.userId} -> ${variant.name} (白名单强制分配)`);
            continue;
          }
        }
      }

      // 普通用户：本地计算分桶
      const bucketNumber = computeBucket(user.userId, layerId, salt);
      const variant = findVariant(bucketNumber, this.variants);

      user.bucketNumber = bucketNumber;
      user.variant = variant;

      if (variant) {
        console.log(`  ${user.userId} -> ${variant.name} (桶号: ${bucketNumber})`);
      } else {
        console.log(`  ${user.userId} -> 未命中实验 (桶号: ${bucketNumber})`);
      }
    }
  }

  // 获取白名单用户的分桶
  async getWhitelistBucket(userId) {
    try {
      const response = await fetch(`${API_BASE}/whitelist/users/${userId}/check`);
      const result = await response.json();

      if (result && result.bucketId) {
        return result.bucketId;
      }
    } catch (error) {
      // 白名单查询失败，继续使用hash分桶
    }
    return null;
  }

  // 生成事件并上报
  async startEventSimulation() {
    console.log('');
    console.log('📊 开始事件上报...');
    console.log('─'.repeat(60));

    this.stats.startTime = Date.now();

    const sendBatch = async () => {
      // 为每个用户生成事件
      const events = [];

      for (const user of this.users) {
        if (!user.variant) continue; // 未命中实验的用户不生成事件

        // 根据批量大小生成事件
        for (let i = 0; i < this.batchSize; i++) {
          const event = this.generateEvent(user);
          events.push(event);
        }
      }

      // 批量上报
      if (events.length > 0) {
        await this.sendEvents(events);
      }

      // 统计信息
      this.printStats();

      // 调度下次上报
      const jitter = (Math.random() - 0.5) * 1000; // ±0.5秒抖动
      const interval = Math.max(100, this.intervalSeconds * 1000 + jitter);
      setTimeout(sendBatch, interval);
    };

    // 开始循环
    sendBatch();

    // 处理优雅退出
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  // 生成单个事件
  generateEvent(user) {
    const eventType = this.randomChoice([
      'exposure', 'exposure', 'exposure', // 曝光事件权重更高
      'click', 'click',
      'conversion',
      'page_view',
    ]);

    const properties = this.generateProperties(eventType, user.variant);

    return {
      eventId: this.generateEventId(),
      eventType,
      userId: user.userId,
      timestamp: Date.now(),
      experimentTags: [
        {
          expId: this.expId,
          variant: user.variant.bucketId || user.variant.name,
          layer: `layer_${this.experimentConfig.layerId}`,
        }
      ],
      platform: user.platform,
      deviceId: user.deviceId,
      sessionId: user.sessionId,
      properties,
    };
  }

  // 生成事件属性
  generateProperties(eventType, variant) {
    switch (eventType) {
      case 'exposure':
        return {
          page: this.randomChoice(['home', 'paywall', 'settings', 'profile']),
          position: this.randomInt(1, 5),
          variant: variant.name,
        };
      case 'click':
        return {
          button: this.randomChoice(['subscribe', 'upgrade', 'trial', 'cancel', 'learn_more']),
          variant: variant.name,
          element_id: `btn_${this.randomInt(1, 10)}`,
        };
      case 'conversion':
        return {
          plan: this.randomChoice(['monthly', 'yearly', 'lifetime']),
          amount: this.randomInt(9, 199),
          currency: 'USD',
          variant: variant.name,
        };
      case 'page_view':
        return {
          page: this.randomChoice(['home', 'paywall', 'settings', 'profile', 'checkout']),
          referrer: this.randomChoice(['google', 'direct', 'social', 'email']),
          duration: this.randomInt(1, 300),
        };
      default:
        return {};
    }
  }

  // 批量上报事件
  async sendEvents(events) {
    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      const result = await response.json();

      this.stats.totalEvents += events.length;
      this.stats.successfulEvents += result.accepted || 0;
      this.stats.failedEvents += result.rejected || 0;

      // 统计事件类型
      events.forEach(event => {
        this.stats.eventsByType[event.eventType] =
          (this.stats.eventsByType[event.eventType] || 0) + 1;

        this.stats.eventsByVariant[event.experimentTags[0].variant] =
          (this.stats.eventsByVariant[event.experimentTags[0].variant] || 0) + 1;
      });

      // 打印上报结果
      if (result.rejected > 0) {
        console.log(`❌ 批量上报: accepted=${result.accepted}, rejected=${result.rejected}`);
        if (result.errors) {
          result.errors.forEach(err => console.log(`   错误: ${err}`));
        }
      }

    } catch (error) {
      this.stats.totalEvents += events.length;
      this.stats.failedEvents += events.length;
      console.error(`❌ 上报失败: ${error.message}`);
    }
  }

  // 打印统计信息
  printStats() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const rate = elapsed > 0 ? (this.stats.successfulEvents / elapsed).toFixed(2) : 0;

    console.log('');
    console.log('📈 实时统计');
    console.log('─'.repeat(40));
    console.log(`  运行时间: ${elapsed.toFixed(1)}s`);
    console.log(`  总事件: ${this.stats.totalEvents}`);
    console.log(`  成功: ${this.stats.successfulEvents} | 失败: ${this.stats.failedEvents}`);
    console.log(`  速率: ${rate} events/s`);
    console.log('');
    console.log('  事件类型分布:');
    Object.entries(this.stats.eventsByType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    console.log('');
    console.log('  变体分布:');
    Object.entries(this.stats.eventsByVariant).forEach(([variant, count]) => {
      console.log(`    ${variant}: ${count}`);
    });
    console.log('─'.repeat(40));
    console.log('');
  }

  // 优雅退出
  shutdown() {
    console.log('');
    console.log('═'.repeat(60));
    console.log('🛑 停止 SDK 模拟器');
    console.log('═'.repeat(60));
    this.printStats();
    console.log('');
    console.log('最终统计:');
    console.log(`  总事件数: ${this.stats.totalEvents}`);
    console.log(`  成功率: ${(this.stats.successfulEvents / this.stats.totalEvents * 100).toFixed(2)}%`);
    console.log('═'.repeat(60));
    process.exit(0);
  }

  // 工具函数
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  generateSessionId() {
    return `session_${Math.random().toString(36).substring(2, 14)}`;
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// ============================================
// 命令行参数解析
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    expId: null,
    userCount: 5,
    intervalSeconds: 2,
    batchSize: 1,
    whitelistUsers: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--exp':
      case '-e':
        options.expId = args[++i];
        break;
      case '--users':
      case '-u':
        options.userCount = parseInt(args[++i], 10);
        break;
      case '--interval':
      case '-i':
        options.intervalSeconds = parseFloat(args[++i]);
        break;
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i], 10);
        break;
      case '--whitelist':
      case '-w':
        options.whitelistUsers = args[++i].split(',').map(s => s.trim());
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`未知参数: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  if (!options.expId) {
    console.error('❌ 必须指定实验ID (--exp)');
    printHelp();
    process.exit(1);
  }

  return options;
}

function printHelp() {
  console.log(`
GateFlow SDK 模拟器

用法:
  node scripts/sdk-simulator.js --exp <实验ID> [选项]

选项:
  --exp, -e <id>          实验ID（必填）
  --users, -u <count>     模拟用户数量（默认: 5）
  --interval, -i <sec>    上报间隔秒数（默认: 2）
  --batch-size, -b <size> 每次批量上报事件数（默认: 1）
  --whitelist, -w <ids>   白名单用户列表，逗号分隔
  --help, -h              显示帮助

示例:
  # 基础模式：5个用户，2秒间隔
  node scripts/sdk-simulator.js --exp 6055989

  # 批量模式：10个用户，1秒间隔，每次5个事件
  node scripts/sdk-simulator.js --exp 6055989 --users 10 --interval 1 --batch-size 5

  # 白名单测试：验证指定用户的分桶
  node scripts/sdk-simulator.js --exp 6055989 --whitelist test_user_001,test_user_004

  # 压力测试：50个用户，0.5秒间隔
  node scripts/sdk-simulator.js --exp 6055989 --users 50 --interval 0.5

环境变量:
  API_BASE                API基础URL（默认: http://localhost:8081/api/v1）
  `);
}

// ============================================
// 主程序入口
// ============================================

async function main() {
  const options = parseArgs();
  const simulator = new SDKSimulator(options);

  try {
    await simulator.init();
    await simulator.startEventSimulation();
  } catch (error) {
    console.error(`❌ 启动失败: ${error.message}`);
    process.exit(1);
  }
}

main();
