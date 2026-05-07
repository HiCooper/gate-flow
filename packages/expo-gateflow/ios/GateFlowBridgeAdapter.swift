import Foundation
import Combine
import GateFlowKit

/**
 * Bridge adapter that connects the GateFlow iOS SDK to the Expo RN module.
 * Forwards RN method calls to the native SDK and sends SDK events back to RN.
 */
public class GateFlowBridgeAdapter {
  private let sendEvent: (String, [String: Any]) -> Void
  private var cancellables = Set<AnyCancellable>()

  init(sendEvent: @escaping (String, [String: Any]) -> Void) {
    self.sendEvent = sendEvent
  }

  func configure(apiUrl: String, apiKey: String, options: [String: Any]?) async throws {
    let sdkOptions = parseOptions(options)
    await GateFlow.shared.configure(apiUrl: apiUrl, apiKey: apiKey, options: sdkOptions)

    GateFlow.shared.$isConfigured
      .dropFirst()
      .sink { [weak self] configured in
        if configured {
          self?.sendEvent("onConfigSuccess", ["apiKey": apiKey])
        }
      }
      .store(in: &cancellables)

    GateFlow.shared.$configurationError
      .compactMap { $0 }
      .sink { [weak self] error in
        self?.sendEvent("onConfigFail", ["error": error])
      }
      .store(in: &cancellables)
  }

  func identify(userId: String, userAttrs: [String: Any]?) async throws {
    await GateFlow.shared.identify(userId)
    if let attrs = userAttrs {
      let codableAttrs = attrs.mapValues { AnyCodable($0) }
      GateFlow.shared.setUserAttributes(codableAttrs)
    }
    let attrs = GateFlow.shared.getUserAttributes()
    sendEvent("onUserIdentified", [
      "userId": userId,
      "attributes": attrs.mapValues { $0.value },
    ])
  }

  func reset() async throws {
    GateFlow.shared.reset()
    sendEvent("onUserReset", [:])
  }

  func evaluateExperiment(
    placementKey: String,
    params: [String: Any]?,
    handlerId: String?
  ) async throws -> [String: Any] {
    let result = await GateFlow.shared.evaluate(placementKey: placementKey, params: params)
    let payload = encodeResult(result, placementKey: placementKey, handlerId: handlerId)
    sendEvent("onExperimentEvaluated", payload)
    return payload
  }

  func getExperiment(key: String) async throws -> [String: Any]? {
    guard let exp = GateFlow.shared.getExperiment(key: key) else { return nil }
    return encodeExperiment(exp)
  }

  func getAllExperiments() async throws -> [[String: Any]] {
    GateFlow.shared.getAllExperiments().compactMap(encodeExperiment)
  }

  func trackEvent(event: [String: Any]) async throws {
    let gfEvent = GateFlowEvent(
      eventType: event["eventType"] as? String ?? "unknown",
      userId: event["userId"] as? String,
      experimentId: event["experimentId"] as? String,
      variantKey: event["variantKey"] as? String,
      properties: (event["properties"] as? [String: Any])?.mapValues { AnyCodable($0) }
    )
    await GateFlow.shared.track(event: gfEvent)
    sendEvent("onEventTracked", ["eventType": gfEvent.eventType])
  }

  func setUserAttributes(attrs: [String: Any]) async throws {
    let codableAttrs = attrs.mapValues { AnyCodable($0) }
    GateFlow.shared.setUserAttributes(codableAttrs)
    sendEvent("onUserAttributesUpdated", ["attributes": attrs])
  }

  func getUserAttributes() async throws -> [String: Any] {
    GateFlow.shared.getUserAttributes().mapValues { $0.value }
  }

  func preloadExperiments(placementKeys: [String]) async throws {
    await GateFlow.shared.preloadExperiments(placementKeys: placementKeys)
  }

  // MARK: - Encoding

  private func encodeResult(_ result: ExperimentResult, placementKey: String, handlerId: String?) -> [String: Any] {
    var payload: [String: Any] = ["placementKey": placementKey]
    if let handlerId = handlerId {
      payload["handlerId"] = handlerId
    }

    switch result {
    case .matched(let exp):
      payload["type"] = "matched"
      payload["experiment"] = encodeExperiment(exp)
    case .holdout(let exp):
      payload["type"] = "holdout"
      payload["experiment"] = encodeExperiment(exp)
    case .noMatch:
      payload["type"] = "noMatch"
    case .notFound:
      payload["type"] = "notFound"
    case .error(let msg):
      payload["type"] = "error"
      payload["error"] = msg
    }
    return payload
  }

  private func encodeExperiment(_ exp: Experiment) -> [String: Any] {
    [
      "id": exp.id,
      "key": exp.key,
      "layerId": exp.layerId,
      "variant": [
        "key": exp.variant.key,
        "type": exp.variant.type.rawValue,
        "params": exp.variant.params.mapValues { $0.value },
      ],
    ]
  }

  private func parseOptions(_ options: [String: Any]?) -> GateFlowOptions {
    guard let options = options else { return GateFlowOptions() }
    return GateFlowOptions(
      logLevel: parseLogLevel(options["logLevel"] as? String),
      cacheTTL: (options["cacheTTL"] as? TimeInterval) ?? 300,
      eventBatchSize: (options["eventBatchSize"] as? Int) ?? 10,
      eventFlushInterval: (options["eventFlushInterval"] as? TimeInterval) ?? 5
    )
  }

  private func parseLogLevel(_ raw: String?) -> LogLevel {
    switch raw?.lowercased() {
    case "debug": return .debug
    case "info": return .info
    case "warn", "warning": return .warn
    case "error": return .error
    default: return .info
    }
  }
}
