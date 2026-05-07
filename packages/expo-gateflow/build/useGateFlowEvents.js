import { useEffect, useRef } from "react";
import { subscribeToGateFlowEvents } from "./internal/gateflowEventBridge";
/**
 * React hook for subscribing to GateFlow native events.
 *
 * Event listeners are automatically added on mount and removed on unmount.
 * Callbacks are always invoked with the latest values via ref.
 *
 * @param callbacks - Object mapping event names to callback functions.
 *   If `callbacks.handlerId` is provided, experiment events will be scoped
 *   to that handler. Used internally by `useExperiment`.
 *
 * @example
 * useGateFlowEvents({
 *   onExperimentMatched: (exp) => console.log("Matched experiment:", exp.key),
 *   onConfigFail: (error) => console.error("Config failed:", error),
 * });
 */
export function useGateFlowEvents({ handlerId: trackedHandlerId, ...callbacks } = {}) {
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;
    useEffect(() => {
        return subscribeToGateFlowEvents(trackedHandlerId, () => callbacksRef.current);
    }, [trackedHandlerId]);
}
//# sourceMappingURL=useGateFlowEvents.js.map