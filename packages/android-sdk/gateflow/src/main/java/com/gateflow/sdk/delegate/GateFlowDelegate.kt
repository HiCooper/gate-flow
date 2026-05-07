package com.gateflow.sdk.delegate

import com.gateflow.sdk.experiment.ExperimentResult

/** Lifecycle callback interface for the GateFlow SDK. */
interface GateFlowDelegate {
    /** Called when the SDK configuration is successfully loaded. */
    fun onConfigSuccess(apiKey: String) {}

    /** Called when the SDK fails to load configuration. */
    fun onConfigFail(error: Throwable) {}

    /** Called when the user is identified. */
    fun onUserIdentified(userId: String, attributes: Map<String, Any?>) {}

    /** Called when the user is reset to anonymous. */
    fun onUserReset() {}

    /** Called after an experiment is evaluated. */
    fun onExperimentEvaluated(placementKey: String, result: ExperimentResult) {}

    /** Called when an event is tracked. */
    fun onEventTracked(eventType: String) {}

    /** Called when user attributes are updated. */
    fun onUserAttributesUpdated(attributes: Map<String, Any?>) {}
}
