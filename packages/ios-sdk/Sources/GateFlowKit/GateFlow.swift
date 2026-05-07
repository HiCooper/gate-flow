import Foundation
import Combine

/// GateFlow SDK options.
public struct GateFlowOptions {
    public var logLevel: LogLevel
    public var cacheTTL: TimeInterval
    public var eventBatchSize: Int
    public var eventFlushInterval: TimeInterval

    public init(
        logLevel: LogLevel = .info,
        cacheTTL: TimeInterval = 300,
        eventBatchSize: Int = 10,
        eventFlushInterval: TimeInterval = 5
    ) {
        self.logLevel = logLevel
        self.cacheTTL = cacheTTL
        self.eventBatchSize = eventBatchSize
        self.eventFlushInterval = eventFlushInterval
    }
}

/// Main GateFlow SDK entry point. Thread-safe singleton.
@objcMembers public final class GateFlow: NSObject, ObservableObject {
    public static let shared = GateFlow()

    /// Whether the SDK has been configured.
    @Published public private(set) var isConfigured = false
    @Published public private(set) var isLoading = false
    @Published public private(set) var configurationError: String?

    /// Active experiments keyed by placement key.
    @Published public private(set) var activeExperiments: [String: Experiment] = [:]

    /// Identity publisher.
    var identity: AnyPublisher<PublicIdentity, Never> {
        identityManager.hasIdentity
            .filter { $0 }
            .map { [weak self] _ in
                self?.publicIdentity ?? PublicIdentity(userId: "unknown")
            }
            .eraseToAnyPublisher()
    }

    private var identityManager: IdentityManager!
    private var configManager: ConfigManager!
    private var network: Network!
    private var storage: Storage!
    private var eventTracker: EventTracker!
    private var cancellables = Set<AnyCancellable>()
    private var options = GateFlowOptions()
    private var _apiUrl: String = ""
    private var _apiKey: String = ""

    private override init() {}

    /// Configure the SDK. Must be called before any other method.
    public func configure(apiUrl: String, apiKey: String, options: GateFlowOptions = GateFlowOptions()) async {
        guard !isConfigured else { return }

        _apiUrl = apiUrl
        _apiKey = apiKey
        self.options = options

        isLoading = true
        configurationError = nil

        GFLogger.level = options.logLevel

        storage = UserDefaultsStorage()
        network = Network(baseUrl: apiUrl, apiKey: apiKey)
        identityManager = IdentityManager(storage: storage)
        configManager = ConfigManager(storage: storage, network: network, cacheTTL: options.cacheTTL)
        eventTracker = EventTracker(storage: storage, network: network, userIdProvider: { [weak self] in
            self?.identityManager.userId
        }, batchSize: options.eventBatchSize, flushInterval: options.eventFlushInterval)

        // Subscribe to config state
        configManager.configState
            .sink { [weak self] status in
                Task { @MainActor [weak self] in
                    guard let self = self else { return }
                    switch status {
                    case .retrieved:
                        self.isConfigured = true
                        self.isLoading = false
                        self.configurationError = nil
                    case .failed(let error):
                        self.isLoading = false
                        self.configurationError = error
                    case .retrieving:
                        self.isLoading = true
                    }
                }
            }
            .store(in: &cancellables)

        // Fetch config
        await configManager.fetchConfiguration()

        // Configure identity
        let didTrackFirstSeen = storage.readBool(StorageKeys.didTrackFirstSeen) ?? false
        await identityManager.configure(isFirstAppOpen: !didTrackFirstSeen)
        if !didTrackFirstSeen {
            storage.writeBool(StorageKeys.didTrackFirstSeen, value: true)
        }

        GFLogger.debug(level: .info, scope: .gateFlowCore, message: "SDK configured (userId: \(identityManager.userId))")
    }

    /// Identify the user with a server-side userId.
    public func identify(_ userId: String) async {
        identityManager.identify(userId: userId)
        await eventTracker.track(
            GateFlowEvent(eventType: "user_identified", userId: userId)
        )
    }

    /// Reset to anonymous identity.
    public func reset() {
        identityManager.reset()
        activeExperiments = [:]
    }

    /// Evaluate an experiment for a given placement.
    public func evaluate(placementKey: String, params: [String: Any]? = nil) async -> ExperimentResult {
        guard let config = configManager.config else {
            return .error("SDK not configured")
        }

        let userId = identityManager.userId
        let specs = configManager.toExperimentSpecs()
        let results = BucketEngine.computeAllBucketResults(userId: userId, experiments: specs)

        // Find the experiment matching the placement key
        guard let match = results.first(where: { result in
            config.experiments.first(where: { $0.id == result.experimentKey })?.key == placementKey
        }) else {
            return .noMatch
        }

        guard match.hit, let variantKey = match.variant,
              let expConfig = config.experiments.first(where: { $0.id == match.experimentKey }) else {
            return .noMatch
        }

        let variantType = variantKey == "control" ? VariantType.control : VariantType.treatment
        let variantParams = expConfig.variants.first(where: { $0.key == variantKey })?.params ?? [:]

        let experiment = Experiment(
            id: expConfig.id,
            key: expConfig.key,
            layerId: expConfig.layerId,
            variant: Variant(key: variantKey, type: variantType, params: variantParams)
        )

        activeExperiments[placementKey] = experiment

        return expConfig.holdout == true ? .holdout(experiment) : .matched(experiment)
    }

    /// Track a custom event.
    public func track(event: GateFlowEvent) async {
        await eventTracker.track(event)
    }

    /// Update user attributes.
    public func setUserAttributes(_ attributes: [String: AnyCodable]) {
        identityManager.mergeUserAttributes(attributes, shouldTrackMerge: true)
    }

    /// Get current user attributes.
    public func getUserAttributes() -> [String: AnyCodable] {
        identityManager.userAttributes
    }

    /// Get a single active experiment by key.
    public func getExperiment(key: String) -> Experiment? {
        activeExperiments[key]
    }

    /// Get all active experiments.
    public func getAllExperiments() -> [Experiment] {
        Array(activeExperiments.values)
    }

    /// Preload experiments (placeholder for future paywall-like rendering).
    public func preloadExperiments(placementKeys: [String]) async {
        GFLogger.debug(level: .info, scope: .experimentManager, message: "Preload requested for \(placementKeys.count) placements")
    }

    // MARK: - Internal

    private var publicIdentity: PublicIdentity? {
        guard let im = identityManager else { return nil }
        return PublicIdentity(userId: im.userId)
    }
}
