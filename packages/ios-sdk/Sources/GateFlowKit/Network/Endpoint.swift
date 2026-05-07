import Foundation

/// API endpoint definitions.
enum Endpoint {
    case config
    case assignments
    case confirmAssignment(String)
    case track
    case identity(String)

    var path: String {
        switch self {
        case .config: "/api/v1/config"
        case .assignments: "/api/v1/bucket/assignments"
        case .confirmAssignment(let id): "/api/v1/experiments/\(id)/confirm"
        case .track: "/api/v1/events"
        case .identity(let userId): "/api/v1/users/\(userId)"
        }
    }

    var method: String {
        switch self {
        case .config, .assignments: "GET"
        case .confirmAssignment, .track: "POST"
        case .identity: "PUT"
        }
    }
}
