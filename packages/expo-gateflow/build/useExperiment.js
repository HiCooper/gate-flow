import { useCallback, useId, useState } from "react";
import { useGateFlow } from "./useGateFlow";
import { useGateFlowEvents } from "./useGateFlowEvents";
/**
 * React hook for evaluating GateFlow experiments.
 *
 * Provides a simple API to evaluate placements and react to experiment assignments.
 * The hook manages evaluation state and supports callbacks for different outcomes.
 *
 * Must be used within a `<GateFlowProvider />`.
 *
 * @param callbacks - Optional callbacks for experiment evaluation outcomes.
 * @returns Object with `evaluate` function and current `state`.
 *
 * @example
 * const { evaluate, state } = useExperiment({
 *   onMatched: (exp) => console.log("Matched:", exp.key, exp.variant.key),
 *   onHoldout: () => console.log("In holdout"),
 * });
 *
 * // In your component:
 * const layout = state.status === "matched"
 *   ? state.experiment.variant.params.layout
 *   : "default";
 */
export function useExperiment(callbacks = {}) {
    const id = useId();
    const [state, setState] = useState({ status: "idle" });
    useGateFlowEvents({
        handlerId: id,
        onExperimentMatched: (exp) => {
            setState({ status: "matched", experiment: exp });
            callbacks.onMatched?.(exp);
        },
        onExperimentHoldout: (exp) => {
            setState({ status: "holdout", experiment: exp });
            callbacks.onHoldout?.(exp);
        },
        onExperimentNoMatch: () => {
            setState({ status: "noMatch" });
            callbacks.onNoMatch?.();
        },
        onExperimentError: (error) => {
            setState({ status: "error", error });
            callbacks.onError?.(error);
        },
    });
    const { evaluateExperiment: storeEvaluate } = useGateFlow((s) => ({
        evaluateExperiment: s.evaluateExperiment,
    }));
    const evaluate = useCallback(async ({ placementKey, params }) => {
        const result = await storeEvaluate(placementKey, params, id);
        // Update local state based on result
        if (result.type === "matched") {
            setState({ status: "matched", experiment: result.experiment });
        }
        else if (result.type === "holdout") {
            setState({ status: "holdout", experiment: result.experiment });
        }
        else if (result.type === "noMatch") {
            setState({ status: "noMatch" });
        }
        else if (result.type === "notFound") {
            setState({ status: "noMatch" });
        }
        else if (result.type === "error") {
            setState({ status: "error", error: result.error });
        }
        return result;
    }, [storeEvaluate, id]);
    return {
        evaluate,
        state,
    };
}
//# sourceMappingURL=useExperiment.js.map