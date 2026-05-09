#!/usr/bin/env node
/**
 * SDK Event Simulator
 * Simulates SDK event reporting to the Events API
 *
 * Usage:
 *   node scripts/simulate-sdk-events.js [expId] [intervalSeconds]
 *
 * Examples:
 *   node scripts/simulate-sdk-events.js                    # Default: random exp, 2-5s interval
 *   node scripts/simulate-sdk-events.js 6053720             # Target exp 6053720, 2-5s interval
 *   node scripts/simulate-sdk-events.js 6053720 3           # Target exp 6053720, 3s interval
 */

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

// Default experiments to simulate events for
const EXPERIMENTS = ['6053720', 'exp_001', 'exp_002', 'exp_e2e_001'];

// Event types
const EVENT_TYPES = ['exposure', 'click', 'conversion', 'page_view'];

// Platforms
const PLATFORMS = ['ios', 'android', 'web'];

// Variants
const VARIANTS = ['control', 'treatment', 'treatment_a', 'treatment_b'];

// Layers
const LAYERS = ['layer_001', 'layer_ui', 'layer_payment'];

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

function generateProperties(eventType, variant) {
  if (eventType === 'exposure') {
    return { page: 'paywall', position: randomInt(1, 5) };
  } else if (eventType === 'click') {
    return { button: randomChoice(['subscribe', 'upgrade', 'trial', 'cancel']), variant };
  } else if (eventType === 'conversion') {
    return { plan: randomChoice(['monthly', 'yearly']), amount: randomInt(9, 99) };
  }
  return {};
}

function generateEvent(expId) {
  const eventType = randomChoice(EVENT_TYPES);
  const variant = randomChoice(VARIANTS);
  const layer = randomChoice(LAYERS);

  // Generate timestamp within last hour (epoch milliseconds for backend)
  const timestamp = Date.now() - randomInt(0, 3600 * 1000);

  return {
    eventId: generateEventId(),
    eventType,
    userId: generateUserId(),
    timestamp,  // epoch milliseconds
    experimentTags: [
      {
        expId,
        variant,
        layer,
      }
    ],
    platform: randomChoice(PLATFORMS),
    deviceId: generateDeviceId(),
    sessionId: generateSessionId(),
    properties: generateProperties(eventType, variant),
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
      `[${new Date().toISOString()}] Sent event: ${event.eventType} | ` +
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

  const sendOneEvent = async () => {
    const event = generateEvent(expId);
    totalSent++;
    const success = await sendEvent(event);
    if (success) totalSuccess++;

    // Schedule next event with random jitter
    const jitter = randomInt(-1000, 1000); // ±1 second
    const nextInterval = Math.max(500, (intervalSeconds * 1000) + jitter);

    setTimeout(sendOneEvent, nextInterval);
  };

  // Start sending events
  sendOneEvent();

  // Handle shutdown
  const shutdown = () => {
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

// Parse command line arguments
const args = process.argv.slice(2);
let expId = randomChoice(EXPERIMENTS);
let intervalSeconds = 2;

if (args.length > 0) {
  expId = args[0];
}

if (args.length > 1) {
  intervalSeconds = parseInt(args[1], 10);
  if (isNaN(intervalSeconds) || intervalSeconds < 1) {
    console.error('Invalid interval. Must be a positive number of seconds.');
    process.exit(1);
  }
}

runSimulation(expId, intervalSeconds);