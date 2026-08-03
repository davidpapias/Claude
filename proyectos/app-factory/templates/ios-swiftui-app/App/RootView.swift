import SwiftUI
import AppCore

/// Placeholder root. Replace it with the first screen from the approved UI
/// development plan — do not add screens that are not in that plan.
struct RootView: View {
    let configuration: AppConfiguration
    let analytics: AnalyticsClient

    var body: some View {
        VStack(spacing: Spacing.md) {
            Text(configuration.appName)
                .font(.largeTitle.bold())
            Text("Planning phase. No product screens have been approved yet.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .padding(Spacing.lg)
        .accessibilityElement(children: .combine)
        .onAppear { analytics.track(AnalyticsEvent(name: "app_launched")) }
    }
}

#Preview {
    RootView(configuration: .placeholder, analytics: NoOpAnalyticsClient())
}
