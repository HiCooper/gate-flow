import Foundation

/// Public-facing identity information.
struct PublicIdentity {
    let userId: String
    let attributes: [String: AnyCodable]

    init(userId: String, attributes: [String: AnyCodable] = [:]) {
        self.userId = userId
        self.attributes = attributes
    }
}
