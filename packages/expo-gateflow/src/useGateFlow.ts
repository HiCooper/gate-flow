import { createContext, useContext } from "react"
import { create } from "zustand"
import { useShallow } from "zustand/shallow"
import GateFlowExpoModule from "./GateFlowExpoModule"
import type {
  Experiment,
  ExperimentResult,
  GateFlowEvent,
  UserAttributes,
} from "./GateFlowExpoModule.types"
import { DefaultGateFlowOptions, type PartialGateFlowOptions } from "./GateFlowOptions"

/**
 * Defines the structure of the GateFlow store, including state and actions.
 * Managed by Zustand.
 */
export interface GateFlowStore {
  /* -------------------- State -------------------- */
  /** Whether the SDK has been successfully configured */
  isConfigured: boolean
  /** Whether the SDK is currently performing a loading operation */
  isLoading: boolean
  /** Error message if configuration failed, null otherwise */
  configurationError: string | null
  /** Current user attributes, null if no user identified */
  user: UserAttributes | null
  /** Active experiments keyed by experiment key */
  activeExperiments: Record<string, Experiment>

  /* -------------------- Actions -------------------- */
  /**
   * Configure the GateFlow SDK. Must be called before any other methods.
   * @param apiUrl - GateFlow API base URL
   * @param apiKey - Your GateFlow API key
   * @param options - Optional configuration overrides
   */
  configure: (
    apiUrl: string,
    apiKey: string,
    options?: PartialGateFlowOptions,
  ) => Promise<void>

  /**
   * Identify the current user.
   * @param userId - Unique user identifier
   * @param attrs - Optional custom attributes for targeting
   */
  identify: (userId: string, attrs?: Record<string, any>) => Promise<void>

  /** Reset user identity and clear SDK state */
  reset: () => Promise<void>

  /**
   * Evaluate an experiment for a placement.
   * @param placementKey - Placement key defined in GateFlow dashboard
   * @param params - Optional parameters for the evaluation
   * @param handlerId - Optional handler ID for event routing (used internally by useExperiment)
   */
  evaluateExperiment: (
    placementKey: string,
    params?: Record<string, any>,
    handlerId?: string | null,
  ) => Promise<ExperimentResult>

  /**
   * Track a custom event.
   * @param event - Event data (userId is auto-filled from current user)
   */
  trackEvent: (event: Omit<GateFlowEvent, "userId">) => Promise<void>

  /** Set custom user attributes */
  setUserAttributes: (attrs: Record<string, any>) => Promise<void>

  /** Get current user attributes */
  getUserAttributes: () => Promise<Record<string, any>>

  /** Preload experiments for given placements */
  preloadExperiments: (placements: string[]) => Promise<void>

  /** Get a single experiment by key */
  getExperiment: (key: string) => Promise<Experiment | null>

  /** Get all active experiments */
  getAllExperiments: () => Promise<Experiment[]>

  /* -------------------- Internal -------------------- */
  /** Initialize native event listeners. Called internally by GateFlowProvider. */
  _initListeners: () => () => void
}

/**
 * Zustand store for GateFlow SDK state and actions.
 */
export const useGateFlowStore = create<GateFlowStore>((set, get) => ({
  /* -------------------- State -------------------- */
  isConfigured: false,
  isLoading: false,
  configurationError: null,
  user: null,
  activeExperiments: {},

  /* -------------------- Actions -------------------- */
  configure: async (apiUrl, apiKey, options) => {
    set({ isLoading: true, configurationError: null })

    try {
      const mergedOptions = {
        ...DefaultGateFlowOptions,
        ...options,
        logging: {
          ...DefaultGateFlowOptions.logging,
          ...options?.logging,
        },
      }

      await GateFlowExpoModule.configure(apiUrl, apiKey, mergedOptions)

      const currentUser = await GateFlowExpoModule.getUserAttributes()

      set({
        isConfigured: true,
        isLoading: false,
        configurationError: null,
        user: currentUser as UserAttributes,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      set({
        isLoading: false,
        configurationError: errorMessage,
      })
    }
  },

  identify: async (userId, attrs) => {
    await GateFlowExpoModule.identify(userId, attrs)

    const [currentUser] = await Promise.all([
      GateFlowExpoModule.getUserAttributes(),
    ])

    set({ user: currentUser as UserAttributes })
  },

  reset: async () => {
    await GateFlowExpoModule.reset()

    set({
      user: null,
      activeExperiments: {},
    })
  },

  evaluateExperiment: async (placementKey, params, handlerId = "default") => {
    const result = await GateFlowExpoModule.evaluateExperiment(
      placementKey,
      params,
      handlerId,
    )

    // Update active experiments if matched
    if (result.type === "matched" || result.type === "holdout") {
      const exp = result.experiment
      set((state) => ({
        activeExperiments: {
          ...state.activeExperiments,
          [exp.key]: exp,
        },
      }))
    }

    return result
  },

  trackEvent: async (event) => {
    const user = get().user
    if (!user) {
      console.warn("[GateFlow] Cannot track event: no user identified")
      return
    }

    await GateFlowExpoModule.trackEvent({
      ...event,
      userId: user.userId,
    })
  },

  setUserAttributes: async (attrs) => {
    await GateFlowExpoModule.setUserAttributes(attrs)

    const currentUser = await GateFlowExpoModule.getUserAttributes()
    set({ user: currentUser as UserAttributes })
  },

  getUserAttributes: async () => {
    return GateFlowExpoModule.getUserAttributes()
  },

  preloadExperiments: async (placements) => {
    await GateFlowExpoModule.preloadExperiments(placements)
  },

  getExperiment: async (key) => {
    return GateFlowExpoModule.getExperiment(key)
  },

  getAllExperiments: async () => {
    return GateFlowExpoModule.getAllExperiments()
  },

  /* -------------------- Internal -------------------- */
  _initListeners: (): (() => void) => {
    if (get().isConfigured) {
      console.warn("[GateFlow] Listeners already initialized. Skipping.")
      return () => {}
    }

    const subscriptions: { remove: () => void }[] = []

    subscriptions.push(
      GateFlowExpoModule.addListener("onConfigFail", ({ error }) => {
        set({
          configurationError: error,
          isLoading: false,
          isConfigured: false,
        })
      }),
    )

    subscriptions.push(
      GateFlowExpoModule.addListener("onConfigRefresh", () => {
        set({ configurationError: null })
      }),
    )

    subscriptions.push(
      GateFlowExpoModule.addListener("onUserReset", () => {
        set({ user: null, activeExperiments: {} })
      }),
    )

    set({ isLoading: false })
    console.log("[GateFlow] Initialized listeners", subscriptions.length)

    return (): void => {
      console.log("[GateFlow] Cleaning up listeners", subscriptions.length)
      subscriptions.forEach((s) => s.remove())
    }
  },
}))

/**
 * Public interface for the GateFlow store, excluding internal methods.
 */
export type PublicGateFlowStore = Omit<GateFlowStore, "configure" | "reset" | "_initListeners">

export const GateFlowContext = createContext<boolean>(false)

/**
 * Core React hook for interacting with the GateFlow SDK.
 *
 * Must be used within a component that is a descendant of `<GateFlowProvider />`.
 *
 * @template T - Optional type parameter for the selected state. Defaults to the entire store.
 * @param selector - Optional function to select a specific slice of the store's state.
 *   Uses shallow equality checking via `zustand/shallow`.
 * @returns The selected slice of the GateFlow store state, or the entire store if no selector.
 * @throws Error if used outside of a `GateFlowProvider`.
 *
 * @example
 * // Get the entire store
 * const gateflow = useGateFlow();
 * gateflow.trackEvent({ eventType: "page_view", properties: { page: "home" } });
 *
 * @example
 * // Select specific state properties
 * const { user, isConfigured } = useGateFlow(state => ({
 *   user: state.user,
 *   isConfigured: state.isConfigured,
 * }));
 */
export function useGateFlow<T = PublicGateFlowStore>(
  selector?: (state: GateFlowStore) => T,
): T {
  const inProvider = useContext(GateFlowContext)
  if (!inProvider) {
    throw new Error("useGateFlow must be used within a GateFlowProvider")
  }

  const identity = (state: GateFlowStore) => state as unknown as T
  return useGateFlowStore(selector ? useShallow(selector) : identity)
}
