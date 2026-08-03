import Foundation

/// Centralized configuration. No secrets belong here or anywhere else in source
/// control; read them from the environment or the keychain at runtime.
public struct AppConfiguration: Sendable {
    public let appName: String
    public let bundleIdentifier: String
    public let analyticsEnabled: Bool

    public init(appName: String, bundleIdentifier: String, analyticsEnabled: Bool) {
        self.appName = appName
        self.bundleIdentifier = bundleIdentifier
        self.analyticsEnabled = analyticsEnabled
    }

    public static let placeholder = AppConfiguration(
        appName: "{{APP_NAME}}",
        bundleIdentifier: "com.example.{{PROJECT_ID}}",
        analyticsEnabled: false
    )
}
