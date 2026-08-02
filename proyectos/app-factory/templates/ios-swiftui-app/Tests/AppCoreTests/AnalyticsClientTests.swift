import XCTest
@testable import AppCore

final class AnalyticsClientTests: XCTestCase {
    func testRecordingClientKeepsEventOrderAndProperties() {
        let client = RecordingAnalyticsClient()

        client.track(AnalyticsEvent(name: SubscriptionAnalyticsEvent.paywallViewed,
                                    properties: ["source": "onboarding"]))
        client.track(AnalyticsEvent(name: SubscriptionAnalyticsEvent.purchaseStarted))

        XCTAssertEqual(client.events.map(\.name),
                       [SubscriptionAnalyticsEvent.paywallViewed,
                        SubscriptionAnalyticsEvent.purchaseStarted])
        XCTAssertEqual(client.events.first?.properties["source"], "onboarding")
    }

    func testNoOpClientDoesNotCrash() {
        NoOpAnalyticsClient().track(AnalyticsEvent(name: "app_launched"))
    }
}
