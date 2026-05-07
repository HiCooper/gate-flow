package com.gateflow.sdk.misc

import android.content.Context
import android.os.Build
import java.text.SimpleDateFormat
import java.util.*

/** Collects device information for enrichment. */
data class DeviceInfo(
    val appId: String,
    val appVersion: String,
    val appBuild: String,
    val osVersion: String,
    val deviceModel: String,
    val locale: String,
    val timezone: String,
    val timestamp: String,
)

object DeviceHelper {
    fun collect(context: Context): DeviceInfo {
        val pkg = context.packageManager.getPackageInfo(context.packageName, 0)
        val appId = context.packageName
        val appVersion = pkg.versionName ?: "unknown"
        val appBuild = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            pkg.longVersionCode.toString()
        } else {
            pkg.versionCode.toString()
        }
        val osVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        val deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}"
        val locale = Locale.getDefault().toString()
        val timezone = TimeZone.getDefault().id
        val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        return DeviceInfo(
            appId = appId,
            appVersion = appVersion,
            appBuild = appBuild,
            osVersion = osVersion,
            deviceModel = deviceModel,
            locale = locale,
            timezone = timezone,
            timestamp = timestamp,
        )
    }
}
