package com.gateflow.sdk.dependencies

import android.content.Context
import com.gateflow.sdk.GateFlowOptions
import com.gateflow.sdk.analytics.EventTracker
import com.gateflow.sdk.config.ConfigManager
import com.gateflow.sdk.identity.IdentityManager
import com.gateflow.sdk.network.Network
import com.gateflow.sdk.storage.LocalStorage

/** Container holding all SDK components. Used for testing and internal DI. */
data class DependencyContainer(
    val storage: LocalStorage,
    val network: Network,
    val identityManager: IdentityManager,
    val configManager: ConfigManager,
    val eventTracker: EventTracker,
) {
    companion object {
        fun make(
            context: Context,
            baseUrl: String,
            apiKey: String,
            options: GateFlowOptions = GateFlowOptions(),
        ): DependencyContainer {
            val storage = LocalStorage(context)
            val network = Network(baseUrl, apiKey)
            val identityManager = IdentityManager(storage)
            val configManager = ConfigManager(storage, network, options.cacheTTL)
            val eventTracker = EventTracker(
                storage = storage,
                network = network,
                userIdProvider = { identityManager.state.value.userId },
                batchSize = options.eventBatchSize,
                flushIntervalMs = options.eventFlushInterval,
            )
            return DependencyContainer(
                storage = storage,
                network = network,
                identityManager = identityManager,
                configManager = configManager,
                eventTracker = eventTracker,
            )
        }
    }
}
