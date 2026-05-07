package com.gateflow.sdk.storage

/** Protocol for persistable keys. */
interface Storable<T> {
    val key: String
}

/** Storage abstraction. */
interface Storage {
    fun <T : Any> read(storable: Storable<T>): T?
    fun <T : Any> write(storable: Storable<T>, value: T?)
    fun delete(storable: Storable<*>)
    fun clean()
}

/** Storage keys used across the SDK. */
object StorageKeys {
    object AppUserId : Storable<String> { override val key = "gateflow.appUserId" }
    object AliasId : Storable<String> { override val key = "gateflow.aliasId" }
    object Seed : Storable<Int> { override val key = "gateflow.seed" }
    object UserAttributes : Storable<String> { override val key = "gateflow.userAttributes" }
    object LatestConfig : Storable<String> { override val key = "gateflow.latestConfig" }
    object LatestConfigFetchedAt : Storable<Long> { override val key = "gateflow.latestConfigFetchedAt" }
    object Assignments : Storable<String> { override val key = "gateflow.assignments" }
    object DidTrackFirstSeen : Storable<Boolean> { override val key = "gateflow.didTrackFirstSeen" }
    object EventQueue : Storable<String> { override val key = "gateflow.eventQueue" }
    object ApiKey : Storable<String> { override val key = "gateflow.apiKey" }
    object ApiUrl : Storable<String> { override val key = "gateflow.apiUrl" }
}
