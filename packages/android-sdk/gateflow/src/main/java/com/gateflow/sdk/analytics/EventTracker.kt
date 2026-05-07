package com.gateflow.sdk.analytics

import com.gateflow.sdk.experiment.GateFlowEvent
import com.gateflow.sdk.logger.LogLevel
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger
import com.gateflow.sdk.network.Network
import com.gateflow.sdk.storage.LocalStorage
import com.gateflow.sdk.storage.StorageKeys
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.*

/** Tracks and batches events for server delivery. */
class EventTracker(
    private val storage: LocalStorage,
    private val network: Network,
    private val userIdProvider: () -> String,
    private val batchSize: Int = 10,
    private val flushIntervalMs: Long = 5_000L,
) {
    private val buffer = mutableListOf<GateFlowEvent>()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val listAdapter = moshi.adapter(List::class.java)

    private var flushJob: Job? = null

    init {
        startFlushTimer()
    }

    fun track(event: GateFlowEvent) {
        val enriched = if (event.userId.isNullOrBlank()) {
            event.copy(userId = userIdProvider())
        } else {
            event
        }

        synchronized(buffer) {
            buffer.add(enriched)
        }

        if (buffer.size >= batchSize) {
            scope.launch { flush() }
        }
    }

    suspend fun flush() {
        val eventsToSend: List<GateFlowEvent>
        synchronized(buffer) {
            eventsToSend = buffer.toList()
            buffer.clear()
        }

        if (eventsToSend.isEmpty()) return

        try {
            network.trackEvents(eventsToSend)
        } catch (e: Exception) {
            synchronized(buffer) {
                buffer.addAll(0, eventsToSend)
            }
            persistEvents(eventsToSend)
            Logger.debug(
                level = LogLevel.WARN,
                scope = LogScope.EventTracker,
                message = "Event flush failed, events re-queued",
                error = e,
            )
        }
    }

    fun stop() {
        flushJob?.cancel()
        scope.cancel()
    }

    private fun startFlushTimer() {
        flushJob = scope.launch {
            while (isActive) {
                delay(flushIntervalMs)
                flush()
            }
        }
    }

    private fun persistEvents(events: List<GateFlowEvent>) {
        val json = listAdapter.toJson(events)
        storage.write(StorageKeys.EventQueue, json)
    }
}
