package com.gateflow.sdk.identity

import java.util.UUID

/** Stateless helper for identity operations. */
object IdentityLogic {
    private const val PREFIX = "gf_"

    /** Generate a random alias ID for anonymous users. */
    fun generateAlias(): String = "$PREFIX${UUID.randomUUID()}"

    /** Generate a random seed for bucket computation. */
    fun generateSeed(): Int = (0..Int.MAX_VALUE).random()

    /** Validate and sanitize a user ID. */
    fun sanitize(userId: String): String? {
        val trimmed = userId.trim()
        return trimmed.takeIf { it.isNotEmpty() }
    }

    /** Determine if we need to fetch assignments. */
    fun shouldGetAssignments(isLoggedIn: Boolean, isFirstAppOpen: Boolean): Boolean =
        isFirstAppOpen || !isLoggedIn
}
