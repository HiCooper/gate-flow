package com.gateflow.sdk

import android.content.Context
import com.gateflow.sdk.config.ConfigManager
import com.gateflow.sdk.config.ConfigState
import com.gateflow.sdk.delegate.GateFlowDelegate
import com.gateflow.sdk.experiment.BucketEngine
import com.gateflow.sdk.experiment.Experiment
import com.gateflow.sdk.experiment.ExperimentResult
import com.gateflow.sdk.experiment.GateFlowEvent
import com.gateflow.sdk.experiment.Variant
import com.gateflow.sdk.experiment.VariantType
import com.gateflow.sdk.identity.IdentityManager
import com.gateflow.sdk.logger.LogLevel
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger
import com.gateflow.sdk.network.Network
import com.gateflow.sdk.storage.LocalStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** GateFlow SDK options. */
data class GateFlowOptions(
    val logLevel: LogLevel = LogLevel.INFO,
    val cacheTTL: Long = 300_000L,
    val eventBatchSize: Int = 10,
    val eventFlushInterval: Long = 5_000L,
)

/** Main GateFlow SDK entry point. */
class GateFlow private constructor() {

    companion object {
        val instance: GateFlow = GateFlow()

        var initialized: Boolean = false
            private set

        /** Configure the SDK. Must be called before any other method. */
        suspend fun configure(
            context: Context,
            apiUrl: String,
            apiKey: String,
            options: GateFlowOptions = GateFlowOptions(),
        ) {
            instance.doConfigure(context, apiUrl, apiKey, options)
        }
    }

    var isConfigured: Boolean = false
        private set

    private val _configState = MutableStateFlow<ConfigState>(ConfigState.Retrieving)
    val configState: StateFlow<ConfigState> = _configState.asStateFlow()

    private val _activeExperiments = MutableStateFlow<Map<String, Experiment>>(emptyMap())
    val activeExperiments: StateFlow<Map<String, Experiment>> = _activeExperiments.asStateFlow()

    var delegate: GateFlowDelegate? = null

    private lateinit var identityManager: IdentityManager
    private lateinit var configManager: ConfigManager
    private lateinit var network: Network
    private lateinit var storage: LocalStorage
    private lateinit var eventTracker: EventTracker
    private lateinit var options: GateFlowOptions
    private lateinit var apiUrl: String
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private constructor()

    private suspend fun doConfigure(
        context: Context,
        apiUrl: String,
        apiKey: String,
        options: GateFlowOptions,
    ) {
        if (initialized) return

        this.apiUrl = apiUrl
        this.options = options

        Logger.level = options.logLevel

        storage = LocalStorage(context)
        network = Network(baseUrl = apiUrl, apiKey = apiKey)
        identityManager = IdentityManager(storage)
        configManager = ConfigManager(storage, network, options.cacheTTL)
        eventTracker = EventTracker(
            storage = storage,
            network = network,
            userIdProvider = { identityManager.state.value.userId },
            batchSize = options.eventBatchSize,
            flushIntervalMs = options.eventFlushInterval,
        )

        // Fetch config
        configManager.fetchConfiguration()
        val state = configManager.state.value
        _configState.value = state

        if (state is ConfigState.Retrieved) {
            isConfigured = true
            initialized = true
            Logger.debug(
                level = LogLevel.INFO,
                scope = LogScope.GateFlowCore,
                message = "SDK configured",
                info = mapOf("userId" to identityManager.state.value.userId),
            )
        } else if (state is ConfigState.Failed) {
            Logger.debug(
                level = LogLevel.ERROR,
                scope = LogScope.GateFlowCore,
                message = "Config fetch failed: ${state.error}",
            )
        }

        // Configure identity
        val didTrackFirstSeen = storage.read(com.gateflow.sdk.storage.StorageKeys.DidTrackFirstSeen) ?: false
        identityManager.configure(isFirstAppOpen = !didTrackFirstSeen)
        if (!didTrackFirstSeen) {
            storage.write(com.gateflow.sdk.storage.StorageKeys.DidTrackFirstSeen, true)
        }
    }

    /** Identify the user with a server-side userId. */
    suspend fun identify(userId: String) {
        identityManager.identify(userId)
        eventTracker.track(GateFlowEvent(eventType = "user_identified", userId = userId))
    }

    /** Reset to anonymous identity. */
    fun reset() {
        identityManager.reset()
        _activeExperiments.value = emptyMap()
    }

    /** Evaluate an experiment for a given placement. */
    suspend fun evaluate(placementKey: String, params: Map<String, Any?>? = null): ExperimentResult =
        withContext(Dispatchers.IO) {
            val config = configManager.config ?: return@withContext ExperimentResult.Error("SDK not configured")

            val userId = identityManager.state.value.userId
            val specs = configManager.toExperimentSpecs()
            val results = BucketEngine.computeAllBucketResults(userId, specs)

            // Find the experiment matching the placement key
            val match = results.find { result ->
                config.experiments.find { it.id == result.experimentKey }?.key == placementKey
            }

            if (match == null || !match.hit) {
                return@withContext ExperimentResult.NoMatch
            }

            val variantKey = match.variant ?: return@withContext ExperimentResult.NoMatch
            val expConfig = config.experiments.find { it.id == match.experimentKey }
                ?: return@withContext ExperimentResult.NoMatch

            val variantType = if (variantKey == "control") VariantType.CONTROL else VariantType.TREATMENT
            val variantParams = expConfig.variants.find { it.key == variantKey }?.params ?: emptyMap()

            val experiment = Experiment(
                id = expConfig.id,
                key = expConfig.key,
                layerId = expConfig.layerId,
                variant = Variant(key = variantKey, type = variantType, params = variantParams),
            )

            _activeExperiments.value = _activeExperiments.value + (placementKey to experiment)

            if (expConfig.holdout == true) {
                ExperimentResult.Holdout(experiment)
            } else {
                ExperimentResult.Matched(experiment)
            }
        }

    /** Track a custom event. */
    fun track(event: GateFlowEvent) {
        scope.launch { eventTracker.track(event) }
    }

    /** Update user attributes. */
    fun setUserAttributes(attributes: Map<String, Any?>) {
        identityManager.mergeUserAttributes(attributes, shouldTrackMerge = true)
    }

    /** Get current user attributes. */
    fun getUserAttributes(): Map<String, Any?> = identityManager.state.value.enrichedAttributes

    /** Get a single active experiment by placement key. */
    fun getExperiment(key: String): Experiment? = _activeExperiments.value[key]

    /** Get all active experiments. */
    fun getAllExperiments(): List<Experiment> = _activeExperiments.value.values.toList()

    /** Preload experiments (placeholder for future paywall-like rendering). */
    suspend fun preloadExperiments(placementKeys: List<String>) {
        Logger.debug(
            level = LogLevel.INFO,
            scope = LogScope.ExperimentManager,
            message = "Preload requested for ${placementKeys.size} placements",
        )
    }
}
