import Foundation

/// The state of the SDK configuration.
enum ConfigurationStatus {
    case retrieving
    case retrieved(ServerConfig)
    case failed(String)

    func getConfig() -> ServerConfig? {
        if case .retrieved(let config) = self {
            return config
        }
        return nil
    }
}
