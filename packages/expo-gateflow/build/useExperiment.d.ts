import type { Experiment, ExperimentResult, ExperimentState } from "./GateFlowExpoModule.types";
/**
 * Callbacks for the useExperiment hook.
 */
export interface ExperimentCallbacks {
    /** Called when the user is matched to an experiment */
    onMatched?: (experiment: Experiment) => void;
    /** Called when the user is assigned to a holdout group */
    onHoldout?: (experiment: Experiment) => void;
    /** Called when no experiment rules match */
    onNoMatch?: () => void;
    /** Called when experiment evaluation errors */
    onError?: (error: string) => void;
}
/**
 * Arguments for the evaluate function.
 */
export interface EvaluateArgs {
    /** Placement key defined in GateFlow dashboard */
    placementKey: string;
    /** Optional parameters for evaluation */
    params?: Record<string, any>;
}
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
export declare function useExperiment(callbacks?: ExperimentCallbacks): {
    readonly evaluate: ({ placementKey, params }: EvaluateArgs) => Promise<ExperimentResult>;
    readonly state: ExperimentState;
};
//# sourceMappingURL=useExperiment.d.ts.map