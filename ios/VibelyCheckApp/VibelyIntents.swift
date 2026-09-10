import AppIntents

struct OpenVibelyIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Vibely"
    static let description = IntentDescription("Open Vibely to discover places that match your vibe.")
    static let openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        .result()
    }
}

struct VibeNowIntent: AppIntent {
    static let title: LocalizedStringResource = "Vibe Now"
    static let description = IntentDescription("Open Vibely and find a place that matches your vibe right now.")
    static let openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        .result()
    }
}

struct VibelyShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: VibeNowIntent(),
            phrases: [
                "Find my vibe in \(.applicationName)",
                "Where should I go with \(.applicationName)",
                "Vibe now with \(.applicationName)"
            ],
            shortTitle: "Vibe Now",
            systemImageName: "sparkles"
        )
    }
}
