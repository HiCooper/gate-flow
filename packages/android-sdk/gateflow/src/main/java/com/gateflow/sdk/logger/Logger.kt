package com.gateflow.sdk.logger

import android.util.Log

/** Centralized logger with severity levels and scoped categories. */
object Logger {
    private const val TAG = "GateFlow"

    var level: LogLevel = LogLevel.INFO
    var delegate: LogDelegate? = null

    @JvmStatic
    fun debug(
        level: LogLevel = LogLevel.DEBUG,
        scope: LogScope = LogScope.GateFlowCore,
        message: String,
        info: Map<String, Any>? = null,
        error: Throwable? = null,
    ) {
        if (level.priority < this.level.priority) return

        val infoStr = info?.entries?.joinToString(prefix = " | ", separator = ", ") { "${it.key}=${it.value}" } ?: ""
        val logMsg = "[${scope.name}] $message$infoStr"

        when (level) {
            LogLevel.DEBUG -> Log.d(TAG, logMsg, error)
            LogLevel.INFO -> Log.i(TAG, logMsg, error)
            LogLevel.WARN -> Log.w(TAG, logMsg, error)
            LogLevel.ERROR -> Log.e(TAG, logMsg, error)
        }

        delegate?.handleLog(level, scope, message, info, error)
    }
}

/** Receives SDK log events for forwarding to app-level logging. */
interface LogDelegate {
    fun handleLog(level: LogLevel, scope: LogScope, message: String, info: Map<String, Any>?, error: Throwable?)
}
