import Foundation

/// Tracks and batches events for server delivery.
final class EventTracker {
    private let storage: Storage
    private let network: Network
    private let userIdProvider: () -> String?
    private let batchSize: Int
    private let flushInterval: TimeInterval

    private var buffer: [GateFlowEvent] = []
    private var timerTask: Task<Void, Never>?

    init(
        storage: Storage,
        network: Network,
        userIdProvider: @escaping () -> String?,
        batchSize: Int = 10,
        flushInterval: TimeInterval = 5
    ) {
        self.storage = storage
        self.network = network
        self.userIdProvider = userIdProvider
        self.batchSize = batchSize
        self.flushInterval = flushInterval

        startFlushTimer()
    }

    func track(_ event: GateFlowEvent) async {
        var enriched = event
        if enriched.userId == nil {
            enriched = GateFlowEvent(
                eventType: event.eventType,
                userId: userIdProvider(),
                experimentId: event.experimentId,
                variantKey: event.variantKey,
                properties: event.properties,
                timestamp: event.timestamp
            )
        }

        buffer.append(enriched)

        if buffer.count >= batchSize {
            await flush()
        }
    }

    func flush() async {
        guard !buffer.isEmpty else { return }
        let eventsToSend = buffer
        buffer = []

        do {
            try await network.trackEvents(eventsToSend)
        } catch {
            // Re-queue events on failure
            buffer.insert(contentsOf: eventsToSend, at: 0)
            persistEvents(eventsToSend)
            GFLogger.debug(level: .warn, scope: .eventTracker, message: "Event flush failed, events re-queued", error: error)
        }
    }

    func stop() {
        timerTask?.cancel()
    }

    private func startFlushTimer() {
        timerTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(flushInterval * 1_000_000_000))
                if !Task.isCancelled {
                    await flush()
                }
            }
        }
    }

    private func persistEvents(_ events: [GateFlowEvent]) {
        // Encode and save for offline retry
        if let data = try? JSONEncoder().encode(events.map { EncodableEvent($0) }) {
            storage.writeData(StorageKeys.eventQueue, value: data)
        }
    }
}

// MARK: - Encodable wrapper

private struct EncodableEvent: Encodable {
    let eventType: String
    let userId: String?
    let experimentId: String?
    let variantKey: String?
    let properties: [String: AnyCodable]?
    let timestamp: String

    init(_ event: GateFlowEvent) {
        eventType = event.eventType
        userId = event.userId
        experimentId = event.experimentId
        variantKey = event.variantKey
        properties = event.properties
        let formatter = ISO8601DateFormatter()
        timestamp = formatter.string(from: event.timestamp)
    }
}
