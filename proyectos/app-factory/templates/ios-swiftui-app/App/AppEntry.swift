import SwiftUI
import AppCore

/// SwiftUI shell. Screens are added only after they exist in
/// `docs/06-UI-Development-Plan.md` and in the current phase of `docs/TASKS.md`.
@main
struct AppEntry: App {
    private let configuration = AppConfiguration.placeholder
    private let analytics: AnalyticsClient = NoOpAnalyticsClient()

    var body: some Scene {
        WindowGroup {
            RootView(configuration: configuration, analytics: analytics)
        }
    }
}
