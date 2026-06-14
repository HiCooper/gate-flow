/**
 * Tests for Expo GateFlow SDK offline modules.
 * Run with: npx jest or npx expo-module test
 */
import { describe, expect, test, beforeEach } from "@jest/globals"

// EventQueue
import {
  enqueueEvent,
  flushEvents,
  retryPending,
  getQueueSize,
  clearQueue,
} from "../offline/EventQueue"

// ConfigCache
import {
  saveConfig,
  loadConfig,
  loadConfigVersion,
  clearConfig,
  getOfflineResult,
} from "../offline/ConfigCache"

import type { GateFlowEvent, Experiment } from "../GateFlowExpoModule.types"

// ---------- Helpers ----------

const mockEvent = (overrides: Partial<GateFlowEvent> = {}): GateFlowEvent => ({
  eventType: "test_event",
  userId: "user_123",
  ...overrides,
})

const mockExperiment = (
  key: string,
  variantKey = "control"
): Experiment => ({
  id: `exp_${key}`,
  key,
  layerId: `layer_${key}`,
  variant: {
    key: variantKey,
    type: variantKey === "control" ? "CONTROL" : "TREATMENT",
    params: {},
  },
})

// ---------- EventQueue Tests ----------

describe("EventQueue", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test("enqueueEvent adds event to queue", async () => {
    await enqueueEvent(mockEvent())
    expect(getQueueSize()).toBe(1)
  })

  test("getQueueSize returns 0 for empty queue", () => {
    expect(getQueueSize()).toBe(0)
  })

  test("clearQueue empties the queue", async () => {
    await enqueueEvent(mockEvent())
    await enqueueEvent(mockEvent({ eventType: "event2" }))
    expect(getQueueSize()).toBe(2)
    await clearQueue()
    expect(getQueueSize()).toBe(0)
  })

  test("enqueueEvent caps queue at MAX size", async () => {
    for (let i = 0; i < 110; i++) {
      await enqueueEvent(mockEvent({ eventType: `event_${i}` }))
    }
    expect(getQueueSize()).toBeLessThanOrEqual(100)
  })

  test("enqueueEvent survives JSON parse errors", async () => {
    localStorage.setItem("gateflow_event_queue", "{invalid json")
    await enqueueEvent(mockEvent())
    expect(getQueueSize()).toBe(1)
  })

  test("flushEvents returns true for empty queue", async () => {
    const result = await flushEvents("https://example.com")
    expect(result).toBe(true)
  })

  test("retryPending handles empty queue", async () => {
    await expect(retryPending("https://example.com")).resolves.not.toThrow()
  })
})

// ---------- ConfigCache Tests ----------

describe("ConfigCache", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test("saveConfig and loadConfig roundtrip", async () => {
    const experiments: Record<string, Experiment> = {
      home_layout: mockExperiment("home_layout", "control"),
      search_bar: mockExperiment("search_bar", "treatment"),
    }
    await saveConfig(
      "https://api.example.com",
      "api_key_123",
      experiments,
      "v2"
    )

    const loaded = await loadConfig()
    expect(loaded).not.toBeNull()
    expect(loaded!.apiUrl).toBe("https://api.example.com")
    expect(loaded!.apiKey).toBe("api_key_123")
    expect(loaded!.version).toBe("v2")
    expect(Object.keys(loaded!.experiments)).toHaveLength(2)
    expect(loaded!.experiments["home_layout"].key).toBe("home_layout")
  })

  test("loadConfig returns null for empty storage", async () => {
    const result = await loadConfig()
    expect(result).toBeNull()
  })

  test("loadConfigVersion returns version", async () => {
    await saveConfig(
      "https://api.example.com",
      "key",
      { home: mockExperiment("home") },
      "v3"
    )
    const version = await loadConfigVersion()
    expect(version).toBe("v3")
  })

  test("loadConfigVersion returns null for empty storage", async () => {
    const version = await loadConfigVersion()
    expect(version).toBeNull()
  })

  test("clearConfig removes stored config", async () => {
    await saveConfig(
      "https://api.example.com",
      "key",
      { home: mockExperiment("home") },
      "v1"
    )
    await clearConfig()
    const loaded = await loadConfig()
    expect(loaded).toBeNull()
    const version = await loadConfigVersion()
    expect(version).toBeNull()
  })

  test("getOfflineResult returns matched for cached experiment", async () => {
    await saveConfig(
      "https://api.example.com",
      "key",
      { home_layout: mockExperiment("home_layout", "control") },
      "v1"
    )
    const result = await getOfflineResult("home_layout")
    expect(result).not.toBeNull()
    expect(result!.type).toBe("matched")
    if (result!.type === "matched") {
      expect(result!.experiment.key).toBe("home_layout")
    }
  })

  test("getOfflineResult returns noMatch for unknown placement", async () => {
    await saveConfig(
      "https://api.example.com",
      "key",
      { home: mockExperiment("home") },
      "v1"
    )
    const result = await getOfflineResult("unknown_placement")
    expect(result).not.toBeNull()
    expect(result!.type).toBe("noMatch")
  })

  test("getOfflineResult returns null when no config cached", async () => {
    const result = await getOfflineResult("home")
    expect(result).toBeNull()
  })

  test("saveConfig survives corrupted localStorage", async () => {
    localStorage.setItem("gateflow_config", "not valid json{{{")
    const before = await loadConfig()
    expect(before).toBeNull()
  })
})
