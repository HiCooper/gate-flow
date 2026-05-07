import ExpoModulesCore

/**
 * Native module for GateFlow A/B experimentation.
 * Bridges the GateFlow SDK to React Native via Expo Modules Core.
 */
public class GateFlowExpoModule: Module {
  private var bridgeAdapter: GateFlowBridgeAdapter?

  public func definition() -> ModuleDefinition {
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

    Function("configure") { (apiUrl: String, apiKey: String, options: [String: Any]?) async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.configure(apiUrl: apiUrl, apiKey: apiKey, options: options)
    }

    Function("identify") { (userId: String, userAttrs: [String: Any]?) async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.identify(userId: userId, userAttrs: userAttrs)
    }

    Function("reset") { () async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.reset()
    }

    Function("evaluateExperiment") { (placementKey: String, params: [String: Any]?, handlerId: String?) async -> [String: Any] in
      let adapter = try getOrCreateAdapter()
      return try await adapter.evaluateExperiment(
        placementKey: placementKey,
        params: params,
        handlerId: handlerId
      )
    }

    Function("getExperiment") { (key: String) async -> [String: Any]? in
      let adapter = try getOrCreateAdapter()
      return try await adapter.getExperiment(key: key)
    }

    Function("getAllExperiments") { () async -> [[String: Any]] in
      let adapter = try getOrCreateAdapter()
      return try await adapter.getAllExperiments()
    }

    Function("trackEvent") { (event: [String: Any]) async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.trackEvent(event: event)
    }

    Function("setUserAttributes") { (attrs: [String: Any]) async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.setUserAttributes(attrs: attrs)
    }

    Function("getUserAttributes") { () async -> [String: Any] in
      let adapter = try getOrCreateAdapter()
      return try await adapter.getUserAttributes()
    }

    Function("preloadExperiments") { (placementKeys: [String]) async throws in
      let adapter = try getOrCreateAdapter()
      try await adapter.preloadExperiments(placementKeys: placementKeys)
    }
  }

  private func getOrCreateAdapter() throws -> GateFlowBridgeAdapter {
    if let adapter = bridgeAdapter {
      return adapter
    }
    let adapter = GateFlowBridgeAdapter(sendEvent: { [weak self] eventName, payload in
      self?.sendEvent(eventName, payload)
    })
    bridgeAdapter = adapter
    return adapter
  }
}
