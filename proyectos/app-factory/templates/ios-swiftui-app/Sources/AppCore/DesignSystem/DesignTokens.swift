import Foundation

/// Platform-independent design tokens, consumed by the SwiftUI layer in `App/`.
/// Adding a value here without updating `docs/05-Design-System.md` is prohibited.
public enum Spacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 24
    public static let xl: CGFloat = 32
}

public enum Radius {
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 12
    public static let lg: CGFloat = 20
}

/// Minimum accessible hit target on iOS.
public enum Layout {
    public static let minimumHitTarget: CGFloat = 44
}
