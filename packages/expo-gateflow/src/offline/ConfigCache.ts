/**
 * @file Local storage cache for experiment configurations.
 * Provides offline access to cached experiment configs via localStorage.
 */

import type { Experiment, ExperimentResult } from "../GateFlowExpoModule.types"

// Storage keys
const CONFIG_STORAGE_KEY = "gateflow_config"
const CONFIG_VERSION_KEY = "gateflow_config_version"

/**
 * Maximum localStorage size (4MB safety threshold).
 * localStorage typically has 5-10MB limit.
 */
const MAX_STORAGE_SIZE = 4 * 1024 * 1024

/**
 * Cached experiment config data structure.
 */
export interface CachedConfig {
  /** API URL used when caching */
  apiUrl: string
  /** API key used when caching */
  apiKey: string
  /** Cached experiments mapped by key */
  experiments: Record<string, CachedExperiment>
  /** Timestamp when cached */
  cachedAt: number
  /** Config version for cache invalidation */
  version: string
}

/**
 * Individual cached experiment.
 */
export interface CachedExperiment {
  id: string
  key: string
  layerId: string
  /** Default variant key when offline */
  defaultVariantKey: string
  /** Variants available in this experiment */
  variants: CachedVariant[]
  updatedAt: number
}

/**
 * Individual cached variant.
 */
export interface CachedVariant {
  key: string
  params: Record<string, any>
}

/**
 * Get the current storage usage estimate.
 *
 * @returns Current storage used in bytes
 */
function getStorageUsed(): number {
  let total = 0
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length + key.length
    }
  }
  return total
}

/**
 * Check if storage has capacity for additional data.
 *
 * @param dataSize - Size of data to store in bytes
 * @returns True if there's enough space
 */
function hasStorageCapacity(dataSize: number): boolean {
  return getStorageUsed() + dataSize < MAX_STORAGE_SIZE
}

/**
 * Save experiment configuration to localStorage.
 *
 * @param apiUrl - API base URL
 * @param apiKey - API key
 * @param experiments - Experiments to cache
 * @param version - Config version
 * @returns Promise that resolves when saved
 *
 * @example
 * await saveConfig('https://api.example.com', 'key123', experiments, 'v1');
 */
export async function saveConfig(
  apiUrl: string,
  apiKey: string,
  experiments: Record<string, Experiment>,
  version: string,
): Promise<void> {
  const config: CachedConfig = {
    apiUrl,
    apiKey,
    experiments: {},
    cachedAt: Date.now(),
    version,
  }

  // Map Experiment objects to CachedExperiment
  for (const key in experiments) {
    const exp = experiments[key]
    config.experiments[key] = {
      id: exp.id,
      key: exp.key,
      layerId: exp.layerId,
      defaultVariantKey: exp.variant.key,
      variants: [{ key: exp.variant.key, params: exp.variant.params }],
      updatedAt: Date.now(),
    }
  }

  const data = JSON.stringify(config)
  const dataSize = new Blob([data]).size

  // Check storage capacity
  if (!hasStorageCapacity(dataSize)) {
    // Try to evict old cache first
    await clearConfig()
    if (!hasStorageCapacity(dataSize)) {
      console.warn(
        "[GateFlow] Storage capacity insufficient, skipping cache",
      )
      return
    }
  }

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, data)
    localStorage.setItem(CONFIG_VERSION_KEY, version)
    console.log(
      "[GateFlow] Config cached successfully",
      Object.keys(config.experiments).length,
      "experiments",
    )
  } catch (error) {
    console.warn("[GateFlow] Failed to save config to localStorage", error)
  }
}

/**
 * Load experiment configuration from localStorage.
 *
 * @returns Cached config or null if not found
 *
 * @example
 * const config = await loadConfig();
 * if (config) {
 *   console.log("Using cached config from", config.cachedAt);
 * }
 */
export async function loadConfig(): Promise<CachedConfig | null> {
  try {
    const data = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!data) {
      return null
    }
    return JSON.parse(data) as CachedConfig
  } catch (error) {
    console.warn("[GateFlow] Failed to load config from localStorage", error)
    return null
  }
}

/**
 * Get the cached config version.
 *
 * @returns Version string or null
 */
export async function loadConfigVersion(): Promise<string | null> {
  return localStorage.getItem(CONFIG_VERSION_KEY)
}

/**
 * Clear cached configuration from localStorage.
 *
 * @returns Promise that resolves when cleared
 *
 * @example
 * await clearConfig();
 */
export async function clearConfig(): Promise<void> {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
    localStorage.removeItem(CONFIG_VERSION_KEY)
    console.log("[GateFlow] Config cache cleared")
  } catch (error) {
    console.warn("[GateFlow] Failed to clear config cache", error)
  }
}

/**
 * Create a default experiment result for offline mode.
 * Returns the default variant based on cached config.
 *
 * @param placementKey - Placement key to look up
 * @returns Default experiment result or null
 *
 * @example
 * const result = await getOfflineResult('home_layout');
 * // Returns: { type: "matched", experiment: {...} } or { type: "noMatch" }
 */
export async function getOfflineResult(
  placementKey: string,
): Promise<ExperimentResult | null> {
  const config = await loadConfig()
  if (!config) {
    return null
  }

  const cachedExp = config.experiments[placementKey]
  if (!cachedExp) {
    return { type: "noMatch" }
  }

  // Find the default variant
  const defaultVariant = cachedExp.variants.find(
    (v) => v.key === cachedExp.defaultVariantKey,
  ) || cachedExp.variants[0]

  if (!defaultVariant) {
    return { type: "noMatch" }
  }

  return {
    type: "matched",
    experiment: {
      id: cachedExp.id,
      key: cachedExp.key,
      layerId: cachedExp.layerId,
      variant: {
        key: defaultVariant.key,
        type: defaultVariant.key === "control" ? "CONTROL" : "TREATMENT",
        params: defaultVariant.params,
      },
    },
  }
}