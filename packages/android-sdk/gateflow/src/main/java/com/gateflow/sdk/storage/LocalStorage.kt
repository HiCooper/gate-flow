package com.gateflow.sdk.storage

import android.content.Context
import android.content.SharedPreferences
import com.gateflow.sdk.logger.LogScope
import com.gateflow.sdk.logger.Logger

/** SharedPreferences-backed storage implementation. */
class LocalStorage(context: Context) : Storage {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("gateflow_sdk", Context.MODE_PRIVATE)

    @Suppress("UNCHECKED_CAST")
    override fun <T : Any> read(storable: Storable<T>): T? {
        val key = storable.key
        return try {
            when (storable) {
                is StorageKeys.AppUserId,
                is StorageKeys.AliasId,
                is StorageKeys.UserAttributes,
                is StorageKeys.LatestConfig,
                is StorageKeys.ApiKey,
                is StorageKeys.ApiUrl,
                is StorageKeys.EventQueue -> prefs.getString(key, null) as? T

                is StorageKeys.Seed -> prefs.getInt(key, 0).takeIf { it != 0 } as? T
                is StorageKeys.LatestConfigFetchedAt -> prefs.getLong(key, 0).takeIf { it != 0L } as? T
                is StorageKeys.DidTrackFirstSeen -> prefs.getBoolean(key, false).takeIf { it } as? T
                is StorageKeys.Assignments -> prefs.getString(key, null) as? T
                else -> prefs.getString(key, null) as? T
            }
        } catch (e: ClassCastException) {
            Logger.debug(
                level = com.gateflow.sdk.logger.LogLevel.ERROR,
                scope = LogScope.Storage,
                message = "Type mismatch reading storage key: $key",
                error = e,
            )
            null
        }
    }

    override fun <T : Any> write(storable: Storable<T>, value: T?) {
        val key = storable.key
        prefs.edit().apply {
            when (value) {
                is String -> putString(key, value)
                is Int -> putInt(key, value)
                is Long -> putLong(key, value)
                is Boolean -> putBoolean(key, value)
                else -> putString(key, value?.toString())
            }.apply()
        }
    }

    override fun delete(storable: Storable<*>) {
        prefs.edit().remove(storable.key).apply()
    }

    override fun clean() {
        val keysToClean = listOf(
            StorageKeys.AppUserId,
            StorageKeys.AliasId,
            StorageKeys.Seed,
            StorageKeys.UserAttributes,
            StorageKeys.LatestConfig,
            StorageKeys.LatestConfigFetchedAt,
            StorageKeys.Assignments,
            StorageKeys.DidTrackFirstSeen,
            StorageKeys.EventQueue,
        )
        prefs.edit().apply {
            keysToClean.forEach { remove(it.key) }
        }.apply()
    }
}
