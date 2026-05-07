package com.gateflow.sdk.network

import com.gateflow.sdk.experiment.GateFlowEvent
import com.gateflow.sdk.experiment.ServerConfig
import com.gateflow.sdk.logger.LogLevel
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/** HTTP client for the GateFlow API. */
class Network(
    baseUrl: String,
    apiKey: String,
) {
    private val baseUrlWithSlash = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $apiKey")
                .addHeader("Content-Type", "application/json")
                .build()
            chain.proceed(request)
        }
        .build()

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val configAdapter = moshi.adapter(ServerConfig::class.java)
    private val assignmentsAdapter = moshi.adapter(Map::class.java)

    /** Fetch the SDK configuration. */
    suspend fun fetchConfig(): ServerConfig = withContext(Dispatchers.IO) {
        val request = okhttp3.Request.Builder()
            .url("${baseUrlWithSlash}api/v1/config")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw NetworkException("HTTP ${response.code}", response.code)
            }
            val body = response.body?.string() ?: throw NetworkException("Empty response body")
            configAdapter.fromJson(body)
                ?: throw NetworkException("Failed to decode config")
        }
    }

    /** Fetch experiment assignments for the current user. */
    suspend fun fetchAssignments(userId: String, seed: Int): Map<String, String> =
        withContext(Dispatchers.IO) {
            val url = "${baseUrlWithSlash}api/v1/bucket/assignments?userId=$userId&seed=$seed"
            val request = okhttp3.Request.Builder().url(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw NetworkException("HTTP ${response.code}", response.code)
                }
                val body = response.body?.string() ?: return@withContext emptyMap()
                @Suppress("UNCHECKED_CAST")
                assignmentsAdapter.fromJson(body) as? Map<String, String> ?: emptyMap()
            }
        }

    /** Post a batch of events. */
    suspend fun trackEvents(events: List<GateFlowEvent>) {
        withContext(Dispatchers.IO) {
            val body = moshi.adapter(List::class.java).toJson(events)
            val request = okhttp3.Request.Builder()
                .url("${baseUrlWithSlash}api/v1/events")
                .post(body.toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Logger.debug(
                        level = LogLevel.WARN,
                        scope = LogScope.Network,
                        message = "Failed to track events: HTTP ${response.code}",
                    )
                }
            }
        }
    }

    /** Confirm an experiment assignment. */
    suspend fun confirmAssignment(assignmentId: String) {
        withContext(Dispatchers.IO) {
            val request = okhttp3.Request.Builder()
                .url("${baseUrlWithSlash}api/v1/experiments/$assignmentId/confirm")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Logger.debug(
                        level = LogLevel.WARN,
                        scope = LogScope.Network,
                        message = "Failed to confirm assignment: HTTP ${response.code}",
                    )
                }
            }
        }
    }
}

/** Network error with HTTP status code. */
class NetworkException(message: String, val statusCode: Int = 0) : Exception(message)
