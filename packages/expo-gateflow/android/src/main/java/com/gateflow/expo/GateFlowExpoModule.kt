package com.gateflow.expo

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.types.Any

/**
 * Native module for GateFlow A/B experimentation on Android.
 * Bridges the GateFlow SDK to React Native via Expo Modules Core.
 */
class GateFlowExpoModule : Module() {
  private var bridgeAdapter: GateFlowBridgeAdapter? = null

  override fun definition() = ModuleDefinition {
    Name("GateFlowExpo")

    Events(
      "onConfigSuccess",
      "onConfigFail",
      "onConfigRefresh",
      "onUserIdentified",
      "onUserReset",
      "onExperimentEvaluated",
      "onEventTracked",
      "onUserAttributesUpdated"
    )

    AsyncFunction("configure") Coroutine { apiUrl: String, apiKey: String, options: Map<String, Any>? ->
      getOrCreateAdapter().configure(apiUrl, apiKey, options)
    }

    AsyncFunction("identify") Coroutine { userId: String, userAttrs: Map<String, Any>? ->
      getOrCreateAdapter().identify(userId, userAttrs)
    }

    AsyncFunction("reset") Coroutine {
      getOrCreateAdapter().reset()
    }

    AsyncFunction("evaluateExperiment") Coroutine { placementKey: String, params: Map<String, Any>?, handlerId: String? ->
      getOrCreateAdapter().evaluateExperiment(placementKey, params, handlerId)
    }

    AsyncFunction("getExperiment") Coroutine { key: String ->
      getOrCreateAdapter().getExperiment(key)
    }

    AsyncFunction("getAllExperiments") Coroutine {
      getOrCreateAdapter().getAllExperiments()
    }

    AsyncFunction("trackEvent") Coroutine { event: Map<String, Any> ->
      getOrCreateAdapter().trackEvent(event)
    }

    AsyncFunction("setUserAttributes") Coroutine { attrs: Map<String, Any> ->
      getOrCreateAdapter().setUserAttributes(attrs)
    }

    AsyncFunction("getUserAttributes") Coroutine {
      getOrCreateAdapter().getUserAttributes()
    }

    AsyncFunction("preloadExperiments") Coroutine { placementKeys: List<String> ->
      getOrCreateAdapter().preloadExperiments(placementKeys)
    }
  }

  private fun getOrCreateAdapter(): GateFlowBridgeAdapter {
    if (bridgeAdapter != null) return bridgeAdapter!!
    val adapter = GateFlowBridgeAdapter(
      context = appContext.reactContext ?: throw IllegalStateException("ReactContext not available"),
      sendEvent = { eventName, payload -> sendEvent(eventName, payload) }
    )
    bridgeAdapter = adapter
    return adapter
  }
}
