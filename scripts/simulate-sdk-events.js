#!/usr/bin/env node
/**
 * SDK 实验分流上报模拟器
 * 模拟 SDK getVariant() 命中后上报分流结果（assignment）到 AB 系统
 *
 * Usage:
 *   node scripts/simulate-sdk-events.js <expId> <bucketIds> [intervalSeconds]
 *
 * Examples:
 *   node scripts/simulate-sdk-events.js 6055368 86355,46956,35700        # 指定实验和分桶ID，默认 2s
 *   node scripts/simulate-sdk-events.js 6055368 86355,46956,35700 1      # 1s 间隔
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

function generateEvent(expId, bucketIds) {
  const bucketId = randomChoice(bucketIds);

  return {
    eventId: generateEventId(),
    userId: generateUserId(),
    timestamp: Date.now(),
    experimentTags: [{ expId, bucket: bucketId, layer: 'default' }],
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
      `bucket=${event.experimentTags[0].bucket} | ` +
      `user=${event.userId} | ` +
      `result=accepted:${result.accepted}, rejected:${result.rejected}`
    );
    return result.accepted === 1;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending event:`, error.message);
    return false;
  }
}

async function runSimulation(expId, bucketIds, intervalSeconds) {
  console.log('='.repeat(60));
  console.log('SDK Event Simulator');
  console.log('='.repeat(60));
  console.log(`Target Experiment: ${expId}`);
  console.log(`Bucket IDs: ${bucketIds.join(', ')}`);
  console.log(`Report Interval: ${intervalSeconds}s`);
  console.log(`API Base: ${API_BASE}`);
  console.log('='.repeat(60));
  console.log('Press Ctrl+C to stop');
  console.log('');

  let totalSent = 0;
  let totalSuccess = 0;
  let totalTracker = 0;
  let tick = 0;
  const intervalMs = Math.max(100, intervalSeconds * 1000);

    const TRACKER_BASE = process.env.TRACKER_BASE || 'http://localhost:8088/api/v1';

  function generateTrackerEvent(expId, userId, bucketId) {
    const isPageView = Math.random() > 0.2;  // 80% page_view, 20% click
    const eventType = isPageView ? 'page_view' : 'click';
    return {
      eventId: `trk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      eventType,
      userId,
      timestamp: Date.now(),
      platform: 'web',
      page: { url: '/pricing', title: 'Pricing Page' },
      data: isPageView
        ? { scrollDepth: randomInt(30, 90), stayDuration: randomInt(5, 60) * 1000 }
        : { elementId: 'cta-button', elementType: 'button', elementText: 'Subscribe Now', clickX: randomInt(100,800), clickY: randomInt(200,600) },
    };
  }

  async function sendTrackerEvent(event) {
    try {
      const res = await fetch(`${TRACKER_BASE}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [event] }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`[${new Date().toISOString()}] Tracker HTTP ${res.status}: ${err.slice(0,100)}`);
        return false;
      }
      if (totalTracker % 10 === 0) {
        console.log(`[${new Date().toISOString()}] Tracker: ${totalTracker} events sent OK`);
      }
      return true;
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Tracker error: ${e.message}`);
      return false;
    }
  }

  const timer = setInterval(() => {
    const event = generateEvent(expId, bucketIds);
    totalSent++;
    sendEvent(event).then(success => { if (success) totalSuccess++; });

    // Also send a tracker behavior event
    const trackerEvt = generateTrackerEvent(expId, event.userId, event.experimentTags[0].bucket);
    totalTracker++;
    sendTrackerEvent(trackerEvt);
  }, intervalMs);

  const shutdown = () => {
    clearInterval(timer);
    console.log('');
    console.log('='.repeat(60));
    console.log('Shutting down...');
    console.log(`Total AB events: ${totalSent} (${totalSuccess} ok), Tracker events: ${totalTracker}`);
    console.log('='.repeat(60));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Parse command line arguments
const args = process.argv.slice(2);
const expId = args[0];
const bucketIds = args[1] ? args[1].split(',') : [];
let intervalSeconds = 2;

if (!expId || bucketIds.length === 0) {
  console.error('Usage: node scripts/simulate-sdk-events.js <expId> <bucketId1,bucketId2,...> [intervalSeconds]');
  console.error('Example: node scripts/simulate-sdk-events.js 6055368 86355,46956,35700');
  process.exit(1);
}

if (args.length > 2) {
  intervalSeconds = parseFloat(args[2]);
  if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
    console.error('Invalid interval. Must be a positive number of seconds.');
    process.exit(1);
  }
}

runSimulation(expId, bucketIds, intervalSeconds);