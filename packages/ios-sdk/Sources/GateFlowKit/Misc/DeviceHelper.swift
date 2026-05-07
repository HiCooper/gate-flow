import Foundation

/// Collects device information for enrichment.
struct DeviceInfo: Codable {
    let appId: String
    let appVersion: String
    let appBuild: String
    let osVersion: String
    let deviceModel: String
    let locale: String
    let timezone: String
    let timestamp: String
}

enum DeviceHelper {
    static func collect() -> DeviceInfo {
        let bundle = Bundle.main
        let appId = bundle.bundleIdentifier ?? "unknown"
        let appVersion = bundle.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        let appBuild = bundle.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
        let osVersion = ProcessInfo.processInfo.operatingSystemVersionString
        let deviceModel = deviceModelCode()
        let locale = Locale.current.identifier
        let timezone = TimeZone.current.identifier
        let timestamp = ISO8601DateFormatter().string(from: .now)

        return DeviceInfo(
            appId: appId,
            appVersion: appVersion,
            appBuild: appBuild,
            osVersion: osVersion,
            deviceModel: deviceModel,
            locale: locale,
            timezone: timezone,
            timestamp: timestamp
        )
    }

    private static func deviceModelCode() -> String {
        var size = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        return String(cString: machine)
    }
}
