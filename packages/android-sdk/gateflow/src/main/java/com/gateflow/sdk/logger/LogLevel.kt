package com.gateflow.sdk.logger

import android.util.Log

/** Log severity level. */
enum class LogLevel(val priority: Int) {
    DEBUG(0),
    INFO(1),
    WARN(2),
    ERROR(3);

    internal val logPriority: Int
        get() = when (this) {
            DEBUG -> Log.DEBUG
            INFO -> Log.INFO
            WARN -> Log.WARN
            ERROR -> Log.ERROR
        }
}
