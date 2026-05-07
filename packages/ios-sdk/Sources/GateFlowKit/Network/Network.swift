import Foundation

/// HTTP client for the GateFlow API.
actor Network {
    let baseUrl: String
    let apiKey: String
    let session: URLSession

    init(baseUrl: String, apiKey: String) {
        self.baseUrl = baseUrl
        self.apiKey = apiKey
        let config = URLSessionConfiguration.default
        config.httpAdditionalHeaders = [
            "Authorization": "Bearer \(apiKey)",
            "Content-Type": "application/json",
        ]
        self.session = URLSession(configuration: config)
    }

    /// Fetch the SDK configuration.
    func fetchConfig() async throws -> ServerConfig {
        let (data, response) = try await request(.config)
        try validateResponse(response)
        return try JSONDecoder().decode(ServerConfig.self, from: data)
    }

    /// Fetch experiment assignments for the current user.
    func fetchAssignments(userId: String, seed: Int) async throws -> [String: String] {
        var components = URLComponents(string: baseUrl + Endpoint.assignments.path)!
        components.queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "seed", value: "\(seed)"),
        ]
        let request = URLRequest(url: components.url!)
        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try JSONDecoder().decode([String: String].self, from: data)
    }

    /// Post a batch of events.
    func trackEvents(_ events: [GateFlowEvent]) async throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let body = try encoder.encode(EncodedEvents(events: events))
        try await send(.track, body: body)
    }

    /// Confirm an experiment assignment.
    func confirmAssignment(_ assignmentId: String) async throws {
        try await send(.confirmAssignment(assignmentId), body: nil)
    }

    // MARK: - Internal

    private func request(_ endpoint: Endpoint) async throws -> (Data, URLResponse) {
        let url = URL(string: baseUrl + endpoint.path)!
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        return try await session.data(for: request)
    }

    private func send(_ endpoint: Endpoint, body: Data?) async throws {
        let url = URL(string: baseUrl + endpoint.path)!
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.httpBody = body
        let (_, response) = try await session.data(for: request)
        try validateResponse(response)
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else { return }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.httpError(statusCode: httpResponse.statusCode)
        }
    }
}

/// Encodable wrapper for event batching.
private struct EncodedEvents: Encodable {
    let events: [GateFlowEvent]

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(events, forKey: .events)
    }

    enum CodingKeys: String, CodingKey { case events }
}

enum NetworkError: Error, LocalizedError {
    case httpError(statusCode: Int)
    case invalidURL
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .httpError(let code): "HTTP error \(code)"
        case .invalidURL: "Invalid URL"
        case .decodingFailed(let msg): "Decoding failed: \(msg)"
        }
    }
}
