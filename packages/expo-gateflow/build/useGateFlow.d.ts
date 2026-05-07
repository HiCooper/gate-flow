import type { Experiment, ExperimentResult, GateFlowEvent, UserAttributes } from "./GateFlowExpoModule.types";
import { type PartialGateFlowOptions } from "./GateFlowOptions";
/**
 * Defines the structure of the GateFlow store, including state and actions.
 * Managed by Zustand.
 */
export interface GateFlowStore {
    /** Whether the SDK has been successfully configured */
    isConfigured: boolean;
    /** Whether the SDK is currently performing a loading operation */
    isLoading: boolean;
    /** Error message if configuration failed, null otherwise */
    configurationError: string | null;
    /** Current user attributes, null if no user identified */
    user: UserAttributes | null;
    /** Active experiments keyed by experiment key */
    activeExperiments: Record<string, Experiment>;
    /**
     * Configure the GateFlow SDK. Must be called before any other methods.
     * @param apiUrl - GateFlow API base URL
     * @param apiKey - Your GateFlow API key
     * @param options - Optional configuration overrides
     */
    configure: (apiUrl: string, apiKey: string, options?: PartialGateFlowOptions) => Promise<void>;
    /**
     * Identify the current user.
     * @param userId - Unique user identifier
     * @param attrs - Optional custom attributes for targeting
     */
    identify: (userId: string, attrs?: Record<string, any>) => Promise<void>;
    /** Reset user identity and clear SDK state */
    reset: () => Promise<void>;
    /**
     * Evaluate an experiment for a placement.
     * @param placementKey - Placement key defined in GateFlow dashboard
     * @param params - Optional parameters for the evaluation
     * @param handlerId - Optional handler ID for event routing (used internally by useExperiment)
     */
    evaluateExperiment: (placementKey: string, params?: Record<string, any>, handlerId?: string | null) => Promise<ExperimentResult>;
    /**
     * Track a custom event.
     * @param event - Event data (userId is auto-filled from current user)
     */
    trackEvent: (event: Omit<GateFlowEvent, "userId">) => Promise<void>;
    /** Set custom user attributes */
    setUserAttributes: (attrs: Record<string, any>) => Promise<void>;
    /** Get current user attributes */
    getUserAttributes: () => Promise<Record<string, any>>;
    /** Preload experiments for given placements */
    preloadExperiments: (placements: string[]) => Promise<void>;
    /** Get a single experiment by key */
    getExperiment: (key: string) => Promise<Experiment | null>;
    /** Get all active experiments */
    getAllExperiments: () => Promise<Experiment[]>;
    /** Initialize native event listeners. Called internally by GateFlowProvider. */
    _initListeners: () => () => void;
}
/**
 * Zustand store for GateFlow SDK state and actions.
 */
export declare const useGateFlowStore: import("zustand").UseBoundStore<import("zustand").StoreApi<GateFlowStore>>;
/**
 * Public interface for the GateFlow store, excluding internal methods.
 */
export type PublicGateFlowStore = Omit<GateFlowStore, "configure" | "reset" | "_initListeners">;
export declare const GateFlowContext: import("react").Context<boolean>;
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
export declare function useGateFlow<T = PublicGateFlowStore>(selector?: (state: GateFlowStore) => T): T;
//# sourceMappingURL=useGateFlow.d.ts.map