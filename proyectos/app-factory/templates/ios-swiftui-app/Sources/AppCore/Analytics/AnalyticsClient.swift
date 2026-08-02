import Foundation

/// Event names follow `object_action`, lowercase snake_case, and must be documented in
/// `docs/09-Analytics.md` before use.
public struct AnalyticsEvent: Equatable, Sendable {
    public let name: String
    public let properties: [String: String]

    public init(name: String, properties: [String: String] = [:]) {
        self.name = name
        self.properties = properties
    }
}

public protocol AnalyticsClient: Sendable {
    func track(_ event: AnalyticsEvent)
}

/// Default client. Replace only when a provider decision is recorded in
/// `docs/DECISIONS.md`.
public struct NoOpAnalyticsClient: AnalyticsClient {
    public init() {}
    public func track(_ event: AnalyticsEvent) {}
}

/// Test double. Records events so analytics requirements can be asserted.
public final class RecordingAnalyticsClient: AnalyticsClient, @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [AnalyticsEvent] = []

    public init() {}

    public var events: [AnalyticsEvent] {
        lock.lock()
        defer { lock.unlock() }
        return storage
    }

    public func track(_ event: AnalyticsEvent) {
        lock.lock()
        storage.append(event)
        lock.unlock()
    }
}

/// Subscription events required by the factory's Subscription Rules.
public enum SubscriptionAnalyticsEvent {
    public static let paywallViewed = "paywall_viewed"
    public static let purchaseStarted = "purchase_started"
    public static let purchaseCompleted = "purchase_completed"
    public static let purchaseCancelled = "purchase_cancelled"
    public static let purchaseFailed = "purchase_failed"
    public static let restoreStarted = "restore_started"
    public static let restoreCompleted = "restore_completed"
    public static let restoreFailed = "restore_failed"
    public static let entitlementExpired = "entitlement_expired"
}
