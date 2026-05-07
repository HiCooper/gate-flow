/**
 * @file Core data types for the GateFlow Expo SDK.
 * Defines experiment models, evaluation results, user attributes, and event structures.
 */

// -------------------- Experiment Models --------------------

/**
 * Type of experiment variant.
 * - `CONTROL`: User is in the control group (baseline experience).
 * - `TREATMENT`: User is in a treatment group (exposed to experiment variation).
 */
export type VariantType = "CONTROL" | "TREATMENT"

/**
 * A single variant within an experiment.
 */
export interface Variant {
  /** Variant key, e.g. "control", "treatment_a" */
  key: string
  /** Whether this is a control or treatment variant */
  type: VariantType
  /** Experiment parameters driving UI/behavior changes, e.g. { layout: "grid" } */
  params: Record<string, any>
}

/**
 * Represents an A/B experiment and the user's assignment.
 */
export interface Experiment {
  /** Unique experiment identifier */
  id: string
  /** Human-readable experiment key, e.g. "exp_book_layout" */
  key: string
  /** Layer ID for orthogonal traffic bucketing */
  layerId: string
  /** The variant assigned to this user */
  variant: Variant
}

// -------------------- Evaluation Results --------------------

/**
 * Result of evaluating an experiment for a user.
 * Discriminated union on `type`.
 */
export type ExperimentResult =
  | { type: "matched"; experiment: Experiment }
  | { type: "holdout"; experiment: Experiment }
  | { type: "noMatch" }
  | { type: "notFound" }
  | { type: "error"; error: string }

// -------------------- Experiment State --------------------

/**
 * Current state of a `useExperiment` hook instance.
 */
export type ExperimentState =
  | { status: "idle" }
  | { status: "matched"; experiment: Experiment }
  | { status: "holdout"; experiment: Experiment }
  | { status: "noMatch" }
  | { status: "error"; error: string }

// -------------------- User Attributes --------------------

/**
 * User identity and custom attributes.
 */
export interface UserAttributes {
  /** Unique user identifier */
  userId: string
  /** Custom attributes for audience targeting */
  [key: string]: any
}

// -------------------- Events --------------------

/**
 * Event tracked by the GateFlow SDK.
 */
export interface GateFlowEvent {
  /** Event type, e.g. "page_view", "button_click", "purchase_complete" */
  eventType: string
  /** User who triggered the event */
  userId: string
  /** Associated experiment ID (auto-filled if in an active experiment) */
  experimentId?: string
  /** Associated variant key */
  variantKey?: string
  /** Arbitrary event properties */
  properties?: Record<string, any>
  /** ISO 8601 timestamp. Defaults to now if omitted */
  timestamp?: string
}

// -------------------- Configuration Status --------------------

/**
 * SDK configuration status.
 */
export type ConfigurationStatus = "not_configured" | "configuring" | "configured" | "failed"

// -------------------- Native Module Events --------------------

/**
 * Events emitted by the native GateFlow module.
 * Subscribe via `GateFlowExpoModule.addListener(eventName, callback)`.
 */
export type GateFlowModuleEvents = {
  /** SDK configuration succeeded */
  onConfigSuccess: (params: { apiKey: string }) => void
  /** SDK configuration failed */
  onConfigFail: (params: { error: string }) => void
  /** Configuration was refreshed (e.g. remote config update) */
  onConfigRefresh: (params: Record<string, any>) => void
  /** User was identified */
  onUserIdentified: (params: { userId: string; attributes: Record<string, any> }) => void
  /** User was reset */
  onUserReset: (params: Record<string, never>) => void
  /** An experiment was evaluated */
  onExperimentEvaluated: (params: {
    placementKey: string
    result: ExperimentResult
    handlerId?: string
  }) => void
  /** An event was tracked */
  onEventTracked: (params: { eventType: string; properties: Record<string, any> }) => void
  /** User attributes were updated */
  onUserAttributesUpdated: (params: { attributes: Record<string, any> }) => void
}
