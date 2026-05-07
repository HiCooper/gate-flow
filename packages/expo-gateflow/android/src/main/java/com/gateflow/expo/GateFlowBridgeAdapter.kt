package com.gateflow.expo

import android.content.Context
import com.gateflow.sdk.GateFlow
import com.gateflow.sdk.GateFlowOptions
import com.gateflow.sdk.delegate.GateFlowDelegate
import com.gateflow.sdk.experiment.Experiment
import com.gateflow.sdk.experiment.ExperimentResult
import com.gateflow.sdk.experiment.GateFlowEvent
import com.gateflow.sdk.logger.LogLevel

/**
 * Bridge adapter that connects the GateFlow Android SDK to the Expo RN module.
 * Forwards RN method calls to the native SDK and sends SDK events back to RN.
 */
class GateFlowBridgeAdapter(
    private val context: Context,
    private val sendEvent: (String, Map<String, Any>) -> Unit
) : GateFlowDelegate {

    suspend fun configure(apiUrl: String, apiKey: String, options: Map<String, Any>?) {
        val sdkOptions = parseOptions(options)
        GateFlow.configure(context, apiUrl, apiKey, sdkOptions)
        GateFlow.instance.delegate = this
        sendEvent("onConfigSuccess", mapOf("apiKey" to apiKey))
    }

    suspend fun identify(userId: String, userAttrs: Map<String, Any>?) {
        GateFlow.instance.identify(userId)
        if (userAttrs != null) {
            GateFlow.instance.setUserAttributes(userAttrs)
        }
        sendEvent("onUserIdentified", mapOf(
            "userId" to userId,
            "attributes" to GateFlow.instance.getUserAttributes()
        ))
    }

    suspend fun reset() {
        GateFlow.instance.reset()
        sendEvent("onUserReset", emptyMap())
    }

    suspend fun evaluateExperiment(
        placementKey: String,
        params: Map<String, Any>?,
        handlerId: String?
    ): Map<String, Any> {
        val result = GateFlow.instance.evaluate(placementKey, params)
        val payload = buildMap<String, Any> {
            put("placementKey", placementKey)
            handlerId?.let { put("handlerId", it) }
            putAll(encodeResult(result))
        }
        sendEvent("onExperimentEvaluated", payload)
        return payload
    }

    suspend fun getExperiment(key: String): Map<String, Any>? {
        val exp = GateFlow.instance.getExperiment(key) ?: return null
        return encodeExperiment(exp)
    }

    suspend fun getAllExperiments(): List<Map<String, Any>> {
        return GateFlow.instance.getAllExperiments().map(::encodeExperiment)
    }

    suspend fun trackEvent(event: Map<String, Any>) {
        val gfEvent = GateFlowEvent(
            eventType = event["eventType"] as? String ?: "unknown",
            userId = event["userId"] as? String,
            experimentId = event["experimentId"] as? String,
            variantKey = event["variantKey"] as? String,
            properties = event["properties"] as? Map<String, Any?>,
        )
        GateFlow.instance.track(gfEvent)
        sendEvent("onEventTracked", mapOf("eventType" to gfEvent.eventType))
    }

    suspend fun setUserAttributes(attrs: Map<String, Any>) {
        GateFlow.instance.setUserAttributes(attrs)
        sendEvent("onUserAttributesUpdated", mapOf("attributes" to attrs))
    }

    suspend fun getUserAttributes(): Map<String, Any> {
        @Suppress("UNCHECKED_CAST")
        return GateFlow.instance.getUserAttributes() as Map<String, Any>
    }

    suspend fun preloadExperiments(placementKeys: List<String>) {
        GateFlow.instance.preloadExperiments(placementKeys)
    }

    // MARK: - Encoding

    private fun encodeResult(result: ExperimentResult): Map<String, Any> = when (result) {
        is ExperimentResult.Matched -> mapOf(
            "type" to "matched",
            "experiment" to encodeExperiment(result.experiment),
        )
        is ExperimentResult.Holdout -> mapOf(
            "type" to "holdout",
            "experiment" to encodeExperiment(result.experiment),
        )
        is ExperimentResult.NoMatch -> mapOf("type" to "noMatch")
        is ExperimentResult.NotFound -> mapOf("type" to "notFound")
        is ExperimentResult.Error -> mapOf("type" to "error", "error" to result.message)
    }

    private fun encodeExperiment(exp: Experiment): Map<String, Any> = mapOf(
        "id" to exp.id,
        "key" to exp.key,
        "layerId" to exp.layerId,
        "variant" to mapOf(
            "key" to exp.variant.key,
            "type" to exp.variant.type.name,
            "params" to (exp.variant.params ?: emptyMap<String, Any?>()),
        ),
    )

    private fun parseOptions(options: Map<String, Any>?): GateFlowOptions {
        if (options == null) return GateFlowOptions()
        return GateFlowOptions(
            logLevel = parseLogLevel(options["logLevel"] as? String),
            cacheTTL = (options["cacheTTL"] as? Number)?.toLong() ?: 300_000L,
            eventBatchSize = (options["eventBatchSize"] as? Number)?.toInt() ?: 10,
            eventFlushInterval = (options["eventFlushInterval"] as? Number)?.toLong() ?: 5_000L,
        )
    }

    private fun parseLogLevel(raw: String?): LogLevel = when (raw?.lowercase()) {
        "debug" -> LogLevel.DEBUG
        "info" -> LogLevel.INFO
        "warn", "warning" -> LogLevel.WARN
        "error" -> LogLevel.ERROR
        else -> LogLevel.INFO
    }
}
