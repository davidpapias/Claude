import Foundation

/// What the user is entitled to, independent of the store that granted it.
public enum Entitlement: Equatable, Sendable {
    case free
    case premium(expiresAt: Date?)

    /// `expiresAt == nil` means a non-expiring entitlement.
    public func isPremium(at date: Date) -> Bool {
        switch self {
        case .free:
            return false
        case .premium(let expiresAt):
            guard let expiresAt else { return true }
            return expiresAt > date
        }
    }
}

public struct SubscriptionProduct: Equatable, Sendable {
    public let id: String
    public let displayName: String
    /// Localized, store-formatted price. Never format prices manually.
    public let displayPrice: String
    /// User-facing renewal terms, required on the paywall.
    public let renewalDescription: String

    public init(id: String, displayName: String, displayPrice: String, renewalDescription: String) {
        self.id = id
        self.displayName = displayName
        self.displayPrice = displayPrice
        self.renewalDescription = renewalDescription
    }
}

public enum PurchaseOutcome: Equatable, Sendable {
    case purchased(Entitlement)
    case cancelled
    case pending
    case failed(reason: String)
}

/// Implemented in the app layer by a StoreKit 2 adapter, and by a fake in tests.
public protocol SubscriptionStore: Sendable {
    func loadProducts() async throws -> [SubscriptionProduct]
    func purchase(productID: String) async -> PurchaseOutcome
    func restore() async -> PurchaseOutcome
    func currentEntitlement() async -> Entitlement
}

/// Every state the paywall must be able to render. A paywall without these is a
/// visual mock, not an implementation.
public enum PaywallState: Equatable, Sendable {
    case loading
    case ready(products: [SubscriptionProduct])
    case purchasing(productID: String)
    case purchased
    case cancelled
    case failed(message: String)
    case offline
}
