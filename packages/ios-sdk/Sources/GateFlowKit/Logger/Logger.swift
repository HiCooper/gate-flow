import Foundation

/// Centralized logger with severity levels and scoped categories.
enum GFLogger {
    static var level: LogLevel = .info
    static weak var delegate: LogDelegate?

    private static let subsystem = "GateFlow"

    static func debug(
        level: LogLevel,
        scope: LogScope,
        message: String,
        info: [String: Any]? = nil,
        error: Error? = nil
    ) {
        guard level.priority >= self.level.priority else { return }

        let infoStr = info.map { " | \($0)" } ?? ""
        let errorStr = error.map { " | \($0)" } ?? ""
        let full = "[\(subsystem)][\(scope.rawValue)] \(message)\(infoStr)\(errorStr)"

        switch level {
        case .debug: print(full)
        case .info: print(full)
        case .warn: print(full)
        case .error: print(full)
        }

        delegate?.handleLog(level: level, scope: scope, message: message, info: info, error: error)
    }
}

/// Receives SDK log events for forwarding to app-level logging.
protocol LogDelegate: AnyObject {
    func handleLog(level: LogLevel, scope: LogScope, message: String, info: [String: Any]?, error: Error?)
}
