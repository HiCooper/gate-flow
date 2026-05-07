package com.gateflow.sdk.identity

import com.gateflow.sdk.experiment.UserAttributes
import com.gateflow.sdk.logger.LogLevel
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger
import com.gateflow.sdk.storage.LocalStorage
import com.gateflow.sdk.storage.StorageKeys
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filter

/** Manages user identity: anonymous alias, logged-in userId, and user attributes. */
class IdentityManager(
    private val storage: LocalStorage,
) {
    data class IdentityState(
        val appUserId: String? = null,
        val aliasId: String,
        val seed: Int,
        val userAttributes: Map<String, Any?> = emptyMap(),
        val isReady: Boolean = false,
    ) {
        val userId: String get() = appUserId ?: aliasId
        val isLoggedIn: Boolean get() = appUserId != null
        val enrichedAttributes: Map<String, Any?>
            get() = userAttributes + mapOf(
                "aliasId" to aliasId,
                "seed" to seed,
                "appUserId" to appUserId,
            )
    }

    private val _state = MutableStateFlow(
        IdentityState(
            appUserId = storage.read(StorageKeys.AppUserId),
            aliasId = storage.read(StorageKeys.AliasId) ?: generateAndSaveAlias(),
            seed = storage.read(StorageKeys.Seed) ?: generateAndSaveSeed(),
            userAttributes = loadAttributes(),
            isReady = true,
        )
    )

    val state: StateFlow<IdentityState> = _state.asStateFlow()

    val hasIdentity = _state.map { it.isReady }.filter { it }

    fun configure(isFirstAppOpen: Boolean) {
        // For now, identity is ready immediately.
        // In a fuller implementation this would trigger assignment fetching.
        _state.value = _state.value.copy(isReady = true)
    }

    fun identify(userId: String) {
        val sanitized = IdentityLogic.sanitize(userId) ?: run {
            Logger.debug(
                level = LogLevel.ERROR,
                scope = LogScope.IdentityManager,
                message = "Provided userId was empty.",
            )
            return
        }

        val current = _state.value
        if (current.appUserId == sanitized) return

        // If switching users, reset.
        if (current.appUserId != null) {
            reset()
        }

        storage.write(StorageKeys.AppUserId, sanitized)
        _state.value = current.copy(appUserId = sanitized, isReady = false)

        // Mark ready after identity resolution
        _state.value = _state.value.copy(isReady = true)
    }

    fun reset() {
        val current = _state.value
        storage.delete(StorageKeys.AppUserId)
        val newAlias = generateAndSaveAlias()
        val newSeed = generateAndSaveSeed()
        storage.delete(StorageKeys.UserAttributes)

        _state.value = IdentityState(
            appUserId = null,
            aliasId = newAlias,
            seed = newSeed,
            isReady = true,
        )
    }

    fun mergeUserAttributes(newAttrs: Map<String, Any?>, shouldTrackMerge: Boolean = false) {
        val current = _state.value
        val merged = current.userAttributes + newAttrs
        val json = serializeAttributes(merged)
        storage.write(StorageKeys.UserAttributes, json)
        _state.value = current.copy(userAttributes = merged)

        if (shouldTrackMerge) {
            Logger.debug(
                level = LogLevel.INFO,
                scope = LogScope.IdentityManager,
                message = "User attributes updated",
                info = mapOf("count" to merged.size),
            )
        }
    }

    private fun generateAndSaveAlias(): String {
        val alias = IdentityLogic.generateAlias()
        storage.write(StorageKeys.AliasId, alias)
        return alias
    }

    private fun generateAndSaveSeed(): Int {
        val seed = IdentityLogic.generateSeed()
        storage.write(StorageKeys.Seed, seed)
        return seed
    }

    private fun loadAttributes(): Map<String, Any?> {
        val json = storage.read(StorageKeys.UserAttributes) ?: return emptyMap()
        return deserializeAttributes(json)
    }

    // Simple JSON serialization via moshi is handled at the Network layer;
    // here we use a basic approach for primitive maps.
    private fun serializeAttributes(attrs: Map<String, Any?>): String {
        return attrs.entries.joinToString(separator = ",", prefix = "{", postfix = "}") { (k, v) ->
            val vs = when (v) {
                null -> "null"
                is String -> "\"$v\""
                else -> v.toString()
            }
            "\"$k\":$vs"
        }
    }

    private fun deserializeAttributes(json: String): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val trimmed = json.trimStart('{').trimEnd('}').trim()
        if (trimmed.isEmpty()) return map

        // Very basic parser — sufficient for flat string/int/bool maps
        trimmed.split(",").forEach { pair ->
            val parts = pair.split(":", limit = 2)
            if (parts.size == 2) {
                val key = parts[0].trim('"')
                val raw = parts[1].trim()
                val value = when {
                    raw == "null" -> null
                    raw == "true" -> true
                    raw == "false" -> false
                    raw.toIntOrNull() != null -> raw.toInt()
                    raw.toDoubleOrNull() != null -> raw.toDouble()
                    else -> raw.trim('"')
                }
                map[key] = value
            }
        }
        return map
    }
}
