import { NativeModule } from "expo";
import type { Experiment, ExperimentResult, GateFlowEvent, GateFlowModuleEvents } from "./GateFlowExpoModule.types";
declare class GateFlowExpoModule extends NativeModule<GateFlowModuleEvents> {
    /** Initialize the SDK with API URL and key */
    configure(apiUrl: string, apiKey: string, options?: Record<string, any>): Promise<void>;
    /** Identify the current user */
    identify(userId: string, userAttrs?: Record<string, any>): Promise<void>;
    /** Reset user identity and clear state */
    reset(): Promise<void>;
    /** Evaluate an experiment for a placement */
    evaluateExperiment(placementKey: string, params?: Record<string, any>, handlerId?: string | null): Promise<ExperimentResult>;
    /** Get a single experiment by key */
    getExperiment(key: string): Promise<Experiment | null>;
    /** Get all active experiments */
    getAllExperiments(): Promise<Experiment[]>;
    /** Track a custom event */
    trackEvent(event: GateFlowEvent): Promise<void>;
    /** Set custom user attributes */
    setUserAttributes(attrs: Record<string, any>): Promise<void>;
    /** Get current user attributes */
    getUserAttributes(): Promise<Record<string, any>>;
    /** Preload experiments for given placements */
    preloadExperiments(placementKeys: string[]): Promise<void>;
}
declare const _default: GateFlowExpoModule;
export default _default;
//# sourceMappingURL=GateFlowExpoModule.d.ts.map