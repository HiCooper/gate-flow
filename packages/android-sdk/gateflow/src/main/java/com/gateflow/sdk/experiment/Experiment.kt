package com.gateflow.sdk.experiment

import java.util.Date

/** The type of an experiment variant. */
enum class VariantType {
    CONTROL,
    TREATMENT
}

/** A variant within an experiment. */
data class Variant(
    val key: String,
    val type: VariantType,
    val params: Map<String, Any?> = emptyMap(),
) {
    @Suppress("UNCHECKED_CAST")
    fun <T : Any> param(key: String): T? = params[key] as? T
}

/** An active experiment. */
data class Experiment(
    val id: String,
    val key: String,
    val layerId: String,
    val variant: Variant,
)

/** The result of evaluating an experiment placement. */
sealed class ExperimentResult {
    data class Matched(val experiment: Experiment) : ExperimentResult()
    data class Holdout(val experiment: Experiment) : ExperimentResult()
    data object NoMatch : ExperimentResult()
    data object NotFound : ExperimentResult()
    data class Error(val message: String) : ExperimentResult()
}

/** The current state of an experiment evaluation. */
sealed class ExperimentState {
    data object Idle : ExperimentState()
    data class Matched(val experiment: Experiment) : ExperimentState()
    data class Holdout(val experiment: Experiment) : ExperimentState()
    data object NoMatch : ExperimentState()
    data class Error(val message: String) : ExperimentState()
}

/** An event emitted when a placement is evaluated. */
data class PlacementEvent(
    val placementKey: String,
    val result: ExperimentResult,
    val handlerId: String? = null,
)

/** An event tracked by the SDK. */
data class GateFlowEvent(
    val eventType: String,
    val userId: String? = null,
    val experimentId: String? = null,
    val variantKey: String? = null,
    val properties: Map<String, Any?>? = null,
    val timestamp: Date = Date(),
)

/** User identity and attributes. */
data class UserAttributes(
    val userId: String,
    val attributes: Map<String, Any?> = emptyMap(),
)

/** Remote SDK configuration fetched from the server. */
data class ServerConfig(
    val buildId: String,
    val experiments: List<ServerExperiment>,
    val featureFlags: Map<String, Boolean>? = null,
) {
    data class ServerExperiment(
        val id: String,
        val key: String,
        val layerId: String,
        val salt: String,
        val bucketStart: Int,
        val bucketEnd: Int,
        val variants: List<ServerVariant>,
        val holdout: Boolean? = null,
    ) {
        data class ServerVariant(
            val key: String,
            val type: String,
            val bucketStart: Int,
            val bucketEnd: Int,
            val params: Map<String, Any?>? = null,
        )
    }
}
