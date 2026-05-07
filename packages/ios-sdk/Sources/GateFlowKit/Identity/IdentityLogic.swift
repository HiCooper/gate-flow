import Foundation

/// Stateless helper for identity operations.
enum IdentityLogic {
    static let superwallPrefix = "sw_"

    /// Generate a random alias ID for anonymous users.
    static func generateAlias() -> String {
        "\(superwallPrefix)\(UUID().uuidString)"
    }

    /// Generate a random seed for bucket computation.
    static func generateSeed() -> Int {
        Int.random(in: 0...Int.max)
    }

    /// Validate and sanitize a user ID.
    static func sanitize(userId: String) -> String? {
        let trimmed = userId.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// Determine if we need to fetch assignments.
    static func shouldGetAssignments(isLoggedIn: Bool, isFirstAppOpen: Bool) -> Bool {
        // Always fetch on first app open or when not logged in (anonymous).
        isFirstAppOpen || !isLoggedIn
    }
}
