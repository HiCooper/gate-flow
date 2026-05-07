import { createContext, useContext } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import GateFlowExpoModule from "./GateFlowExpoModule";
import { DefaultGateFlowOptions } from "./GateFlowOptions";
/**
 * Zustand store for GateFlow SDK state and actions.
 */
export const useGateFlowStore = create((set, get) => ({
    /* -------------------- State -------------------- */
    isConfigured: false,
    isLoading: false,
    configurationError: null,
    user: null,
    activeExperiments: {},
    /* -------------------- Actions -------------------- */
    configure: async (apiUrl, apiKey, options) => {
        set({ isLoading: true, configurationError: null });
        try {
            const mergedOptions = {
                ...DefaultGateFlowOptions,
                ...options,
                logging: {
                    ...DefaultGateFlowOptions.logging,
                    ...options?.logging,
                },
            };
            await GateFlowExpoModule.configure(apiUrl, apiKey, mergedOptions);
            const currentUser = await GateFlowExpoModule.getUserAttributes();
            set({
                isConfigured: true,
                isLoading: false,
                configurationError: null,
                user: currentUser,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            set({
                isLoading: false,
                configurationError: errorMessage,
            });
        }
    },
    identify: async (userId, attrs) => {
        await GateFlowExpoModule.identify(userId, attrs);
        const [currentUser] = await Promise.all([
            GateFlowExpoModule.getUserAttributes(),
        ]);
        set({ user: currentUser });
    },
    reset: async () => {
        await GateFlowExpoModule.reset();
        set({
            user: null,
            activeExperiments: {},
        });
    },
    evaluateExperiment: async (placementKey, params, handlerId = "default") => {
        const result = await GateFlowExpoModule.evaluateExperiment(placementKey, params, handlerId);
        // Update active experiments if matched
        if (result.type === "matched" || result.type === "holdout") {
            const exp = result.experiment;
            set((state) => ({
                activeExperiments: {
                    ...state.activeExperiments,
                    [exp.key]: exp,
                },
            }));
        }
        return result;
    },
    trackEvent: async (event) => {
        const user = get().user;
        if (!user) {
            console.warn("[GateFlow] Cannot track event: no user identified");
            return;
        }
        await GateFlowExpoModule.trackEvent({
            ...event,
            userId: user.userId,
        });
    },
    setUserAttributes: async (attrs) => {
        await GateFlowExpoModule.setUserAttributes(attrs);
        const currentUser = await GateFlowExpoModule.getUserAttributes();
        set({ user: currentUser });
    },
    getUserAttributes: async () => {
        return GateFlowExpoModule.getUserAttributes();
    },
    preloadExperiments: async (placements) => {
        await GateFlowExpoModule.preloadExperiments(placements);
    },
    getExperiment: async (key) => {
        return GateFlowExpoModule.getExperiment(key);
    },
    getAllExperiments: async () => {
        return GateFlowExpoModule.getAllExperiments();
    },
    /* -------------------- Internal -------------------- */
    _initListeners: () => {
        if (get().isConfigured) {
            console.warn("[GateFlow] Listeners already initialized. Skipping.");
            return () => { };
        }
        const subscriptions = [];
        subscriptions.push(GateFlowExpoModule.addListener("onConfigFail", ({ error }) => {
            set({
                configurationError: error,
                isLoading: false,
                isConfigured: false,
            });
        }));
        subscriptions.push(GateFlowExpoModule.addListener("onConfigRefresh", () => {
            set({ configurationError: null });
        }));
        subscriptions.push(GateFlowExpoModule.addListener("onUserReset", () => {
            set({ user: null, activeExperiments: {} });
        }));
        set({ isLoading: false });
        console.log("[GateFlow] Initialized listeners", subscriptions.length);
        return () => {
            console.log("[GateFlow] Cleaning up listeners", subscriptions.length);
            subscriptions.forEach((s) => s.remove());
        };
    },
}));
export const GateFlowContext = createContext(false);
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
export function useGateFlow(selector) {
    const inProvider = useContext(GateFlowContext);
    if (!inProvider) {
        throw new Error("useGateFlow must be used within a GateFlowProvider");
    }
    const identity = (state) => state;
    return useGateFlowStore(selector ? useShallow(selector) : identity);
}
//# sourceMappingURL=useGateFlow.js.map