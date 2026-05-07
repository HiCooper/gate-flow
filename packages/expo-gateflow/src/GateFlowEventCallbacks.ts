import type {
  Experiment,
  ExperimentResult,
} from "./GateFlowExpoModule.types"

/**
 * Defines the available callbacks for subscribing to GateFlow native events.
 */
export interface GateFlowEventCallbacks {
  /** Called when SDK configuration succeeds */
  onConfigSuccess?: (apiKey: string) => void
  /** Called when SDK configuration fails */
  onConfigFail?: (error: string) => void
  /** Called when configuration is refreshed */
  onConfigRefresh?: (params: Record<string, any>) => void
  /** Called when user is identified */
  onUserIdentified?: (userId: string, attributes: Record<string, any>) => void
  /** Called when user is reset */
  onUserReset?: () => void
  /** Called when an experiment is evaluated */
  onExperimentEvaluated?: (
    placementKey: string,
    result: ExperimentResult,
  ) => void
  /** Called when an experiment is matched (convenience for onExperimentEvaluated) */
  onExperimentMatched?: (experiment: Experiment) => void
  /** Called when user is assigned to holdout */
  onExperimentHoldout?: (experiment: Experiment) => void
  /** Called when no experiment rules match */
  onExperimentNoMatch?: () => void
  /** Called when experiment evaluation errors */
  onExperimentError?: (error: string) => void
  /** Called when an event is tracked */
  onEventTracked?: (eventType: string, properties: Record<string, any>) => void
  /** Called when user attributes are updated */
  onUserAttributesUpdated?: (attributes: Record<string, any>) => void

  /**
   * Optional identifier used to scope events to a specific useExperiment hook instance.
   * @internal
   */
  handlerId?: string
}
