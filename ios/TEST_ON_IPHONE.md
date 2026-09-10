# Vibely Check iPhone test

## What is ready
- Native SwiftUI app shell
- WKWebView loading the live Vibely experience
- Location permission text for nearby discovery
- App Intents for Open Vibely and Vibe Now
- Xcode project configured for iPhone

## Requirements
- Mac with Xcode 26 or later
- iPhone running iOS 26 or later for the current App Store SDK requirement
- Apple ID signed into Xcode

## Test
1. Open `ios/VibelyCheckApp.xcodeproj` in Xcode.
2. Select the `Vibely Check` target.
3. Select your iPhone as the run destination.
4. In Signing & Capabilities, select your Apple Developer team. Xcode can create a development signing profile automatically.
5. Press Run.
6. On the iPhone, allow location access when prompted.
7. Verify: search, Ask Vibely, View Vibe, check-in, Directions, and Google Places data.
8. Say or type a Shortcut phrase such as `Vibe Now with Vibely Check` and verify the app opens.

## Important
The native shell is intentionally thin for the first device build so the proven web product remains the source of truth. Native Vibe Now, notifications, location intelligence, and richer Apple Intelligence actions will be layered in after the first device build passes.
