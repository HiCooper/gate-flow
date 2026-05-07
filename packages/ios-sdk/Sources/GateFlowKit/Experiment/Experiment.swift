import Foundation

// MARK: - Variant

/// The type of an experiment variant.
public enum VariantType: String, Codable {
    case control = "CONTROL"
    case treatment = "TREATMENT"
}

/// A variant within an experiment.
public struct Variant: Codable, Equatable {
    public let key: String
    public let type: VariantType
    public let params: [String: AnyCodable]

    public init(key: String, type: VariantType, params: [String: AnyCodable]) {
        self.key = key
        self.type = type
        self.params = params
    }

    /// Get a typed parameter value.
    public func param<T>(_ key: String) -> T? {
        params[key]?.value as? T
    }
}

// MARK: - Experiment

/// An active experiment.
public struct Experiment: Codable, Equatable {
    public let id: String
    public let key: String
    public let layerId: String
    public let variant: Variant

    public init(id: String, key: String, layerId: String, variant: Variant) {
        self.id = id
        self.key = key
        self.layerId = layerId
        self.variant = variant
    }
}

// MARK: - ExperimentResult

/// The result of evaluating an experiment placement.
public enum ExperimentResult: Codable, Equatable {
    case matched(Experiment)
    case holdout(Experiment)
    case noMatch
    case notFound
    case error(String)
}

// MARK: - ExperimentState

/// The current state of an experiment evaluation.
public enum ExperimentState: Equatable {
    case idle
    case matched(Experiment)
    case holdout(Experiment)
    case noMatch
    case error(String)
}

// MARK: - PlacementEvent

/// An event emitted when a placement is evaluated.
public struct PlacementEvent {
    public let placementKey: String
    public let result: ExperimentResult
    public let handlerId: String?

    public init(placementKey: String, result: ExperimentResult, handlerId: String? = nil) {
        self.placementKey = placementKey
        self.result = result
        self.handlerId = handlerId
    }
}

// MARK: - GateFlowEvent

/// An event tracked by the SDK.
public struct GateFlowEvent: Codable {
    public let eventType: String
    public let userId: String?
    public let experimentId: String?
    public let variantKey: String?
    public let properties: [String: AnyCodable]?
    public let timestamp: Date

    public init(
        eventType: String,
        userId: String? = nil,
        experimentId: String? = nil,
        variantKey: String? = nil,
        properties: [String: AnyCodable]? = nil,
        timestamp: Date = Date()
    ) {
        self.eventType = eventType
        self.userId = userId
        self.experimentId = experimentId
        self.variantKey = variantKey
        self.properties = properties
        self.timestamp = timestamp
    }
}

// MARK: - UserAttributes

/// User identity and attributes.
public struct UserAttributes {
    public let userId: String
    public let attributes: [String: AnyCodable]

    public init(userId: String, attributes: [String: AnyCodable]) {
        self.userId = userId
        self.attributes = attributes
    }
}

// MARK: - Configuration

/// Remote SDK configuration fetched from the server.
public struct ServerConfig: Codable {
    public let buildId: String
    public let experiments: [ServerExperiment]
    public let featureFlags: [String: Bool]?

    public struct ServerExperiment: Codable {
        public let id: String
        public let key: String
        public let layerId: String
        public let salt: String
        public let bucketStart: Int
        public let bucketEnd: Int
        public let variants: [ServerVariant]
        public let holdout: Bool?

        public struct ServerVariant: Codable {
            public let key: String
            public let type: String
            public let bucketStart: Int
            public let bucketEnd: Int
            public let params: [String: AnyCodable]?

            public init(key: String, type: String, bucketStart: Int, bucketEnd: Int, params: [String: AnyCodable]?) {
                self.key = key
                self.type = type
                self.bucketStart = bucketStart
                self.bucketEnd = bucketEnd
                self.params = params
            }
        }

        public init(id: String, key: String, layerId: String, salt: String, bucketStart: Int, bucketEnd: Int, variants: [ServerVariant], holdout: Bool?) {
            self.id = id
            self.key = key
            self.layerId = layerId
            self.salt = salt
            self.bucketStart = bucketStart
            self.bucketEnd = bucketEnd
            self.variants = variants
            self.holdout = holdout
        }
    }

    public init(buildId: String, experiments: [ServerExperiment], featureFlags: [String: Bool]?) {
        self.buildId = buildId
        self.experiments = experiments
        self.featureFlags = featureFlags
    }
}

// MARK: - AnyCodable wrapper

/// A type-erased codable wrapper for arbitrary JSON values.
public final class AnyCodable: Codable, Equatable {
    public let value: Any

    public init(_ value: Any) {
        self.value = value
    }

    public required init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }

    public static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        if let l = lhs.value as? AnyHashable, let r = rhs.value as? AnyHashable {
            return l == r
        }
        return false
    }
}
