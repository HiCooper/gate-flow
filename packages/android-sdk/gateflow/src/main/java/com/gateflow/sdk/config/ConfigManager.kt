package com.gateflow.sdk.config

import com.gateflow.sdk.experiment.ExperimentSpec
import com.gateflow.sdk.experiment.ServerConfig
import com.gateflow.sdk.experiment.VariantSpec
import com.gateflow.sdk.logger.LogLevel
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger
import com.gateflow.sdk.network.Network
import com.gateflow.sdk.storage.LocalStorage
import com.gateflow.sdk.storage.StorageKeys
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** State of the SDK configuration. */
sealed class ConfigState {
    data object Retrieving : ConfigState()
    data class Retrieved(val config: ServerConfig) : ConfigState()
    data class Failed(val error: String) : ConfigState()

    fun getConfig(): ServerConfig? = when (this) {
        is Retrieved -> config
        else -> null
    }
}

/** Manages SDK configuration: fetching, caching, and serving experiment specs. */
class ConfigManager(
    private val storage: LocalStorage,
    private val network: Network,
    private val cacheTTL: Long = 300_000L, // 5 minutes in ms
) {
    private val _state = MutableStateFlow<ConfigState>(ConfigState.Retrieving)
    val state: StateFlow<ConfigState> = _state.asStateFlow()

    val config: ServerConfig? get() = _state.value.getConfig()

    /** Fetch configuration, using cache if available and fresh. */
    suspend fun fetchConfiguration() {
        // Try cached config first
        val cached = loadCachedConfig()
        if (cached != null && isCacheFresh()) {
            _state.value = ConfigState.Retrieved(cached)
            // Refresh in background (caller can decide whether to launch this)
            return
        }

        // Fetch from server
        try {
            val config = network.fetchConfig()
            saveCachedConfig(config)
            _state.value = ConfigState.Retrieved(config)
        } catch (e: Exception) {
            if (cached != null) {
                _state.value = ConfigState.Retrieved(cached)
                Logger.debug(
                    level = LogLevel.WARN,
                    scope = LogScope.ConfigManager,
                    message = "Using stale cached config",
                    error = e,
                )
            } else {
                _state.value = ConfigState.Failed(e.message ?: "Unknown error")
                Logger.debug(
                    level = LogLevel.ERROR,
                    scope = LogScope.ConfigManager,
                    message = "Failed to fetch config",
                    error = e,
                )
            }
        }
    }

    /** Refresh configuration from server. */
    suspend fun refreshConfiguration() {
        val oldConfig = _state.value.getConfig() ?: return
        try {
            val newConfig = network.fetchConfig()
            saveCachedConfig(newConfig)
            _state.value = ConfigState.Retrieved(newConfig)
            Logger.debug(
                level = LogLevel.INFO,
                scope = LogScope.ConfigManager,
                message = "Configuration refreshed",
                info = mapOf(
                    "oldBuildId" to oldConfig.buildId,
                    "newBuildId" to newConfig.buildId,
                ),
            )
        } catch (e: Exception) {
            Logger.debug(
                level = LogLevel.WARN,
                scope = LogScope.ConfigManager,
                message = "Configuration refresh failed",
                error = e,
            )
        }
    }

    /** Get experiment specs from the current config as bucketing input. */
    fun toExperimentSpecs(): List<ExperimentSpec> {
        val config = _state.value.getConfig() ?: return emptyList()
        return config.experiments.map { exp ->
            ExperimentSpec(
                expId = exp.id,
                layerId = exp.layerId,
                salt = exp.salt,
                bucketStart = exp.bucketStart,
                bucketEnd = exp.bucketEnd,
                variants = exp.variants.map { v ->
                    VariantSpec(
                        variantKey = v.key,
                        bucketStart = v.bucketStart,
                        bucketEnd = v.bucketEnd,
                    )
                },
            )
        }
    }

    private fun loadCachedConfig(): ServerConfig? {
        val json = storage.read(StorageKeys.LatestConfig) ?: return null
        return try {
            val moshi = com.squareup.moshi.Moshi.Builder()
                .add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory())
                .build()
            val adapter = moshi.adapter(ServerConfig::class.java)
            adapter.fromJson(json)
        } catch (e: Exception) {
            Logger.debug(
                level = LogLevel.WARN,
                scope = LogScope.Storage,
                message = "Failed to decode cached config",
                error = e,
            )
            null
        }
    }

    private fun saveCachedConfig(config: ServerConfig) {
        val moshi = com.squareup.moshi.Moshi.Builder()
            .add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory())
            .build()
        val adapter = moshi.adapter(ServerConfig::class.java)
        val json = adapter.toJson(config)
        storage.write(StorageKeys.LatestConfig, json)
        storage.write(StorageKeys.LatestConfigFetchedAt, System.currentTimeMillis())
    }

    private fun isCacheFresh(): Boolean {
        val fetchedAt = storage.read(StorageKeys.LatestConfigFetchedAt) ?: return false
        return System.currentTimeMillis() - fetchedAt < cacheTTL
    }
}
