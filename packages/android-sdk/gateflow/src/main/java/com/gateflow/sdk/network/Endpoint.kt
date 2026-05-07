package com.gateflow.sdk.network

/** API endpoint definitions. */
sealed class Endpoint {
    object Config : Endpoint()
    object Assignments : Endpoint()
    data class ConfirmAssignment(val id: String) : Endpoint()
    data class Track(val count: Int) : Endpoint()

    val path: String
        get() = when (this) {
            Config -> "/api/v1/config"
            Assignments -> "/api/v1/bucket/assignments"
            is ConfirmAssignment -> "/api/v1/experiments/$id/confirm"
            is Track -> "/api/v1/events"
        }

    val method: String
        get() = when (this) {
            Config, Assignments -> "GET"
            is ConfirmAssignment, is Track -> "POST"
        }
}
