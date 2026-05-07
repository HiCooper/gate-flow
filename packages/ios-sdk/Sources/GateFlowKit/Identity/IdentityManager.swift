import Foundation
import Combine

/// Manages user identity: anonymous alias, logged-in userId, and user attributes.
/// Thread-safe via a dedicated dispatch queue.
final class IdentityManager {
    /// The effective userId: appUserId if logged in, otherwise aliasId.
    var userId: String {
        queue.sync { _appUserId ?? _aliasId }
    }

    var appUserId: String? { queue.sync { _appUserId } }
    var aliasId: String { queue.sync { _aliasId } }
    var seed: Int { queue.sync { _seed } }
    var isLoggedIn: Bool { queue.sync { _appUserId != nil } }

    var userAttributes: [String: AnyCodable] {
        queue.sync { _userAttributes }
    }

    /// Publisher that emits `true` when identity is ready.
    let hasIdentity = CurrentValueSubject<Bool, Never>(false)

    private var _appUserId: String? {
        didSet { saveIds() }
    }
    private var _aliasId: String {
        didSet { saveIds() }
    }
    private var _seed: Int {
        didSet { saveIds() }
    }
    private var _userAttributes: [String: AnyCodable] = [:]

    private let queue = DispatchQueue(label: "com.gateflow.identitymanager")
    private let group = DispatchGroup()
    private let storage: Storage
    private let notifyUserChange: (([String: AnyCodable]) -> Void)?

    init(storage: Storage, notifyUserChange: (([String: AnyCodable]) -> Void)? = nil) {
        self.storage = storage
        self.notifyUserChange = notifyUserChange

        self._appUserId = storage.readString(StorageKeys.appUserId)
        self._aliasId = storage.readString(StorageKeys.aliasId) ?? {
            let alias = IdentityLogic.generateAlias()
            storage.writeString(StorageKeys.aliasId, value: alias)
            return alias
        }()
        self._seed = storage.readInt(StorageKeys.seed) ?? {
            let seed = IdentityLogic.generateSeed()
            storage.writeInt(StorageKeys.seed, value: seed)
            return seed
        }()
        if let attrs = storage.readCodable(StorageKeys.userAttributes) as [String: AnyCodable]? {
            self._userAttributes = attrs
        }

        var extraAttributes: [String: AnyCodable] = [:]
        extraAttributes["aliasId"] = AnyCodable(aliasId)
        extraAttributes["seed"] = AnyCodable(seed)
        if let appUserId = _appUserId {
            extraAttributes["appUserId"] = AnyCodable(appUserId)
        }
        if !extraAttributes.isEmpty {
            mergeUserAttributes(extraAttributes, shouldTrackMerge: false)
        }
    }

    func configure(isFirstAppOpen: Bool) async {
        group.enter()
        group.leave()
        didSetIdentity()
    }

    /// Identify the user with a server-side userId.
    func identify(userId: String) {
        guard let sanitized = IdentityLogic.sanitize(userId: userId) else {
            GFLogger.debug(level: .error, scope: .identityManager, message: "Provided userId was empty.")
            return
        }

        group.enter()
        queue.async { [weak self] in
            guard let self = self else { return }

            if self._appUserId == sanitized {
                self.group.leave()
                return
            }

            self.hasIdentity.send(false)

            // If switching users, reset.
            if self._appUserId != nil, sanitized != self._appUserId {
                self._reset()
            }

            self._appUserId = sanitized
            self.group.leave()
            self.didSetIdentity()
        }
    }

    /// Reset to anonymous identity.
    func reset() {
        hasIdentity.send(false)
        group.enter()
        queue.async { [weak self] in
            self?._reset()
            self?.group.leave()
            self?.didSetIdentity()
        }
    }

    func mergeUserAttributes(_ newAttrs: [String: AnyCodable], shouldTrackMerge: Bool = true) {
        queue.async { [weak self] in
            self?._mergeUserAttributes(newAttrs, shouldTrackMerge: shouldTrackMerge)
        }
    }

    private func _reset() {
        _appUserId = nil
        _aliasId = IdentityLogic.generateAlias()
        _seed = IdentityLogic.generateSeed()
        _userAttributes = [:]
    }

    private func didSetIdentity() {
        group.notify(queue: .main) { [weak self] in
            self?.hasIdentity.send(true)
        }
    }

    private func saveIds() {
        if let appUserId = _appUserId {
            storage.writeString(StorageKeys.appUserId, value: appUserId)
        }
        storage.writeString(StorageKeys.aliasId, value: _aliasId)
        storage.writeInt(StorageKeys.seed, value: _seed)

        var newAttrs: [String: AnyCodable] = [
            "aliasId": AnyCodable(_aliasId),
            "seed": AnyCodable(_seed),
        ]
        if let appUserId = _appUserId {
            newAttrs["appUserId"] = AnyCodable(appUserId)
        }
        _mergeUserAttributes(newAttrs, shouldTrackMerge: false)
    }

    private func _mergeUserAttributes(_ newAttrs: [String: AnyCodable], shouldTrackMerge: Bool) {
        var merged = _userAttributes
        for (key, value) in newAttrs {
            merged[key] = value
        }
        _userAttributes = merged
        storage.writeCodable(StorageKeys.userAttributes, value: merged)

        if shouldTrackMerge {
            notifyUserChange?(merged)
        }
    }
}
