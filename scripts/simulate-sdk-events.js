#!/usr/bin/env node
/**
 * SDK 实验分流上报模拟器
 * 模拟 SDK getVariant() 命中后上报分流结果（assignment）到 AB 系统
 * 行为埋点（exposure/click/page_view 等）由 tracker-service 独立采集
 *
 * Usage:
 *   node scripts/simulate-sdk-events.js [expId] [intervalSeconds]
 *
 * Examples:
 *   node scripts/simulate-sdk-events.js                    # 自动发现运行中的实验
 *   node scripts/simulate-sdk-events.js 6059434             # 指定实验，默认 2s 间隔
 *   node scripts/simulate-sdk-events.js 6059434 1           # 指定实验，1s 间隔
 */

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin123';

// 实验分流上报 — 仅 exposure，行为埋点由 tracker-service 独立采集

// Platforms
const PLATFORMS = ['ios', 'android', 'web'];

/** Fetch running experiment IDs from the API */
async function fetchRunningExperiments() {
  try {
    const loginResp = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: AUTH_USERNAME, password: AUTH_PASSWORD }),
    });
    if (!loginResp.ok) return [];
    const { token } = await loginResp.json();

    const expResp = await fetch(`${API_BASE}/experiments?current=1&size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!expResp.ok) return [];
    const experiments = await expResp.json();
    return experiments
      .filter(e => e.status === 'running')
      .map(e => ({ expId: e.expId, variants: [] }));
  } catch {
    return [];
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEventId() {
  return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateUserId() {
  return `user_sim_${randomInt(1, 100)}`;
}

function generateDeviceId() {
  return `device_sim_${randomInt(1, 50)}`;
}

function generateSessionId() {
  return `session_${Math.random().toString(36).substring(2, 12)}`;
}

function generateEvent(expId) {
  const variant = randomChoice(['control', 'treatment']);
  const layer = 'default';

  return {
    eventId: generateEventId(),
    userId: generateUserId(),
    timestamp: Date.now(),
    experimentTags: [{ expId, variant, layer }],
    platform: randomChoice(PLATFORMS),
    deviceId: generateDeviceId(),
    sessionId: generateSessionId(),
    properties: {},
  };
}

async function sendEvent(event) {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: [event],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[${new Date().toISOString()}] Failed to send event: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(
      `[${new Date().toISOString()}] Sent: exposure | ` +
      `exp=${event.experimentTags[0].expId} | ` +
      `variant=${event.experimentTags[0].variant} | ` +
      `user=${event.userId} | ` +
      `result=accepted:${result.accepted}, rejected:${result.rejected}`
    );
    return result.accepted === 1;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending event:`, error.message);
    return false;
  }
}

async function runSimulation(expId, intervalSeconds) {
  console.log('='.repeat(60));
  console.log('SDK Event Simulator');
  console.log('='.repeat(60));
  console.log(`Target Experiment: ${expId}`);
  console.log(`Report Interval: ${intervalSeconds}s (random ±1s)`);
  console.log(`API Base: ${API_BASE}`);
  console.log('='.repeat(60));
  console.log('Press Ctrl+C to stop');
  console.log('');

  let totalSent = 0;
  let totalSuccess = 0;
  const intervalMs = Math.max(100, intervalSeconds * 1000);

  const timer = setInterval(() => {
    const event = generateEvent(expId);
    totalSent++;
    sendEvent(event).then(success => { if (success) totalSuccess++; });
  }, intervalMs);

  const shutdown = () => {
    clearInterval(timer);
    console.log('');
    console.log('='.repeat(60));
    console.log('Shutting down...');
    console.log(`Total sent: ${totalSent}, Successful: ${totalSuccess}`);
    console.log('='.repeat(60));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Parse command line arguments & auto-detect running experiments
const args = process.argv.slice(2);
let expId = args.length > 0 ? args[0] : null;
let intervalSeconds = 2;

if (args.length > 1) {
  intervalSeconds = parseFloat(args[1]);
  if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
    console.error('Invalid interval. Must be a positive number of seconds.');
    process.exit(1);
  }
}

(async () => {
  if (!expId) {
    console.log('No experiment specified, fetching running experiments from API...');
    const running = await fetchRunningExperiments();
    if (running.length > 0) {
      expId = running[0].expId;
      console.log(`Auto-selected experiment: ${expId}`);
    } else {
      console.error('No running experiments found. Start an experiment first, or specify one:');
      console.error('  node scripts/simulate-sdk-events.js <expId>');
      process.exit(1);
    }
  }
  runSimulation(expId, intervalSeconds);
})();