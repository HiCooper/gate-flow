import Foundation

/// Lifecycle callback protocol for the GateFlow SDK.
public protocol GateFlowDelegate: AnyObject {
    /// Called when the SDK configuration is successfully loaded.
    func onConfigSuccess(apiKey: String)

    /// Called when the SDK fails to load configuration.
    func onConfigFail(error: Error)

    /// Called when the user is identified.
    func onUserIdentified(userId: String, attributes: [String: Any])

    /// Called when the user is reset to anonymous.
    func onUserReset()

    /// Called after an experiment is evaluated.
    func onExperimentEvaluated(placementKey: String, result: ExperimentResult)

    /// Called when an event is tracked.
    func onEventTracked(eventType: String)

    /// Called when user attributes are updated.
    func onUserAttributesUpdated(attributes: [String: Any])
}

/// Default empty implementation so conforming types only implement what they need.
public extension GateFlowDelegate {
    func onConfigSuccess(apiKey: String) {}
    func onConfigFail(error: Error) {}
    func onUserIdentified(userId: String, attributes: [String: Any]) {}
    func onUserReset() {}
    func onExperimentEvaluated(placementKey: String, result: ExperimentResult) {}
    func onEventTracked(eventType: String) {}
    func onUserAttributesUpdated(attributes: [String: Any]) {}
}
