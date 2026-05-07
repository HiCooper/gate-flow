import Foundation

/// Container holding all SDK components. Used for testing and internal DI.
struct DependencyContainer {
    let storage: UserDefaultsStorage
    let network: Network
    let identityManager: IdentityManager
    let configManager: ConfigManager
    let eventTracker: EventTracker

    static func make(
        baseUrl: String,
        apiKey: String,
        storage: UserDefaultsStorage = UserDefaultsStorage(),
        options: GateFlowOptions = GateFlowOptions()
    ) -> DependencyContainer {
        let network = Network(baseUrl: baseUrl, apiKey: apiKey)
        let identityManager = IdentityManager(storage: storage)
        let configManager = ConfigManager(storage: storage, network: network, cacheTTL: options.cacheTTL)
        let eventTracker = EventTracker(
            storage: storage,
            network: network,
            userIdProvider: { identityManager.userId },
            batchSize: options.eventBatchSize,
            flushInterval: options.eventFlushInterval
        )
        return DependencyContainer(
            storage: storage,
            network: network,
            identityManager: identityManager,
            configManager: configManager,
            eventTracker: eventTracker
        )
    }
}
