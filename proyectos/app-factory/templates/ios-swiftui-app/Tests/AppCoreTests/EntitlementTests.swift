import XCTest
@testable import AppCore

final class EntitlementTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_700_000_000)

    func testFreeIsNeverPremium() {
        XCTAssertFalse(Entitlement.free.isPremium(at: now))
    }

    func testActiveSubscriptionIsPremium() {
        let entitlement = Entitlement.premium(expiresAt: now.addingTimeInterval(60))
        XCTAssertTrue(entitlement.isPremium(at: now))
    }

    func testExpiredSubscriptionIsNotPremium() {
        let entitlement = Entitlement.premium(expiresAt: now.addingTimeInterval(-1))
        XCTAssertFalse(entitlement.isPremium(at: now))
    }

    func testEntitlementExpiringExactlyNowIsNotPremium() {
        let entitlement = Entitlement.premium(expiresAt: now)
        XCTAssertFalse(entitlement.isPremium(at: now))
    }

    func testNonExpiringEntitlementIsPremium() {
        XCTAssertTrue(Entitlement.premium(expiresAt: nil).isPremium(at: now))
    }
}
