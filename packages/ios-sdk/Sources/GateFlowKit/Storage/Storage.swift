import Foundation

/// Storage abstraction backed by UserDefaults.
protocol Storage {
    func readString(_ key: String) -> String?
    func readInt(_ key: String) -> Int?
    func readBool(_ key: String) -> Bool?
    func readDouble(_ key: String) -> Double?
    func readData(_ key: String) -> Data?
    func readCodable<T: Codable>(_ key: String) -> T?
    func writeString(_ key: String, value: String)
    func writeInt(_ key: String, value: Int)
    func writeBool(_ key: String, value: Bool)
    func writeDouble(_ key: String, value: Double)
    func writeData(_ key: String, value: Data)
    func writeCodable<T: Codable>(_ key: String, value: T)
    func delete(_ key: String)
    func clean()
}

// MARK: - Storage Keys

enum StorageKeys {
    static let appUserId = "gateflow.appUserId"
    static let aliasId = "gateflow.aliasId"
    static let seed = "gateflow.seed"
    static let userAttributes = "gateflow.userAttributes"
    static let latestConfig = "gateflow.latestConfig"
    static let latestConfigFetchedAt = "gateflow.latestConfigFetchedAt"
    static let assignments = "gateflow.assignments"
    static let didTrackFirstSeen = "gateflow.didTrackFirstSeen"
    static let eventQueue = "gateflow.eventQueue"
    static let apiKey = "gateflow.apiKey"
    static let apiUrl = "gateflow.apiUrl"
}

// MARK: - UserDefaults Storage

final class UserDefaultsStorage: Storage {
    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(suiteName: String? = nil) {
        if let suiteName {
            defaults = UserDefaults(suiteName: suiteName)!
        } else {
            defaults = .standard
        }
    }

    func readString(_ key: String) -> String? { defaults.string(forKey: key) }
    func readInt(_ key: String) -> Int? { defaults.object(forKey: key) as? Int }
    func readBool(_ key: String) -> Bool? { defaults.object(forKey: key) as? Bool }
    func readDouble(_ key: String) -> Double? { defaults.object(forKey: key) as? Double }
    func readData(_ key: String) -> Data? { defaults.data(forKey: key) }
    func readCodable<T: Codable>(_ key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }

    func writeString(_ key: String, value: String) { defaults.set(value, forKey: key) }
    func writeInt(_ key: String, value: Int) { defaults.set(value, forKey: key) }
    func writeBool(_ key: String, value: Bool) { defaults.set(value, forKey: key) }
    func writeDouble(_ key: String, value: Double) { defaults.set(value, forKey: key) }
    func writeData(_ key: String, value: Data) { defaults.set(value, forKey: key) }
    func writeCodable<T: Codable>(_ key: String, value: T) {
        if let data = try? encoder.encode(value) {
            defaults.set(data, forKey: key)
        }
    }

    func delete(_ key: String) { defaults.removeObject(forKey: key) }
    func clean() {
        let keys = [
            StorageKeys.appUserId,
            StorageKeys.aliasId,
            StorageKeys.seed,
            StorageKeys.userAttributes,
            StorageKeys.latestConfig,
            StorageKeys.latestConfigFetchedAt,
            StorageKeys.assignments,
            StorageKeys.eventQueue,
        ]
        keys.forEach { defaults.removeObject(forKey: $0) }
    }
}

// MARK: - AnyEncodable helper

struct AnyEncodable: Encodable {
    private let encodable: Encodable
    init(_ encodable: Encodable) { self.encodable = encodable }
    func encode(to encoder: Encoder) throws { try encodable.encode(to: encoder) }
}
