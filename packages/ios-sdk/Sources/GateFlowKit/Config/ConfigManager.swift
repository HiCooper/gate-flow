import Foundation
import Combine

/// Manages SDK configuration: fetching, caching, and serving experiment specs.
final class ConfigManager {
    /// Reactive state of the configuration.
    let configState = CurrentValueSubject<ConfigurationStatus, Never>(.retrieving)

    var config: ServerConfig? {
        configState.value.getConfig()
    }

    private let storage: Storage
    private let network: Network
    private let cacheTTL: TimeInterval

    init(storage: Storage, network: Network, cacheTTL: TimeInterval = 300) {
        self.storage = storage
        self.network = network
        self.cacheTTL = cacheTTL
    }

    /// Fetch configuration, using cache if available and fresh.
    func fetchConfiguration() async {
        // Try cached config first
        if let cached = loadCachedConfig(), isCacheFresh() {
            configState.send(.retrieved(cached))
            // Refresh in background
            Task { try? await fetchRemoteConfig() }
            return
        }

        // Fetch from server
        do {
            let config = try await fetchRemoteConfig()
            configState.send(.retrieved(config))
        } catch {
            if let cached = loadCachedConfig() {
                configState.send(.retrieved(cached))
                GFLogger.debug(level: .warn, scope: .configManager, message: "Using stale cached config", error: error)
            } else {
                configState.send(.failed(error.localizedDescription))
                GFLogger.debug(level: .error, scope: .configManager, message: "Failed to fetch config", error: error)
            }
        }
    }

    /// Refresh configuration from server (non-blocking if we have cache).
    func refreshConfiguration() async {
        guard config != nil else { return }
        do {
            let newConfig = try await fetchRemoteConfig()
            configState.send(.retrieved(newConfig))
        } catch {
            GFLogger.debug(level: .warn, scope: .configManager, message: "Configuration refresh failed", error: error)
        }
    }

    /// Get experiment specs from the current config as bucketing input.
    func toExperimentSpecs() -> [ExperimentSpec] {
        guard let config = config else { return [] }
        return config.experiments.map { exp in
            ExperimentSpec(
                expId: exp.id,
                layerId: exp.layerId,
                salt: exp.salt,
                bucketStart: exp.bucketStart,
                bucketEnd: exp.bucketEnd,
                variants: exp.variants.map { v in
                    VariantSpec(
                        variantKey: v.key,
                        bucketStart: v.bucketStart,
                        bucketEnd: v.bucketEnd
                    )
                }
            )
        }
    }

    // MARK: - Private

    private func fetchRemoteConfig() async throws -> ServerConfig {
        let config = try await network.fetchConfig()
        saveCachedConfig(config)
        return config
    }

    private func loadCachedConfig() -> ServerConfig? {
        guard let data = storage.readData(StorageKeys.latestConfig) else { return nil }
        return try? JSONDecoder().decode(ServerConfig.self, from: data)
    }

    private func saveCachedConfig(_ config: ServerConfig) {
        if let data = try? JSONEncoder().encode(config) {
            storage.writeData(StorageKeys.latestConfig, value: data)
            storage.writeDouble(StorageKeys.latestConfigFetchedAt, value: Date().timeIntervalSince1970)
        }
    }

    private func isCacheFresh() -> Bool {
        guard let fetchedAt = storage.readDouble(StorageKeys.latestConfigFetchedAt) else {
            return false
        }
        return Date().timeIntervalSince1970 - fetchedAt < cacheTTL
    }
}
