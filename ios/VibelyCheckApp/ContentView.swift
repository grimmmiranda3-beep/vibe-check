import SwiftUI
import CoreLocation
import AuthenticationServices
import UIKit

private let brandPurple = Color(red: 0.49, green: 0.23, blue: 0.89)
private let brandPink = Color(red: 0.93, green: 0.28, blue: 0.60)
private let appBackground = Color(red: 0.973, green: 0.965, blue: 0.976)
private let ink = Color(red: 0.09, green: 0.08, blue: 0.10)

struct ContentView: View {
    @StateObject private var auth = AuthManager()

    var body: some View {
        TabView {
            ExploreView()
                .tabItem { Label("Explore", systemImage: "sparkles") }

            NearbyView()
                .tabItem { Label("Nearby", systemImage: "location.fill") }

            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .tint(brandPurple)
        .preferredColorScheme(.light)
        .environmentObject(auth)
        .onOpenURL { url in
            auth.handleCallback(url)
        }
    }
}

// MARK: - Explore

struct ExploreView: View {
    @State private var query = ""
    @State private var places: [Place] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        brandHeader
                        hero
                        searchBar

                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView("Finding the vibe…")
                                    .tint(brandPurple)
                                Spacer()
                            }
                            .padding(.vertical, 30)
                        } else if let errorMessage {
                            Text(errorMessage)
                                .font(.subheadline)
                                .foregroundStyle(.red)
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(.white, in: RoundedRectangle(cornerRadius: 18))
                        } else if places.isEmpty {
                            emptyState
                        } else {
                            results
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, 30)
                }
            }
            .navigationBarHidden(true)
            .task {
                if places.isEmpty {
                    await search("restaurants in Vacaville")
                }
            }
        }
    }

    private var brandHeader: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: [brandPurple, brandPink],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 38, height: 38)

                Image(systemName: "sparkles")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text("Vibe Check")
                .font(.system(size: 23, weight: .black, design: .rounded))
                .foregroundStyle(ink)

            Spacer()
        }
        .padding(.top, 8)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("LIVE LOCAL ENERGY")
                .font(.caption2.weight(.black))
                .tracking(1.5)
                .foregroundStyle(brandPurple)

            Text("Know the vibe\nbefore you go.")
                .font(.system(size: 40, weight: .black, design: .rounded))
                .foregroundStyle(ink)
                .lineSpacing(-2)

            Text("Search real places and see what people are feeling right now.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)

            TextField("Restaurants, coffee, bars…", text: $query)
                .textInputAutocapitalization(.never)
                .submitLabel(.search)
                .onSubmit {
                    Task { await search(query) }
                }

            Button {
                Task { await search(query) }
            } label: {
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(ink, in: RoundedRectangle(cornerRadius: 12))
            }
            .disabled(query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 18))
        .shadow(color: .black.opacity(0.06), radius: 18, y: 8)
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "mappin.and.ellipse")
                .font(.system(size: 34))
                .foregroundStyle(brandPurple)
            Text("Search a city or type of place")
                .font(.headline)
            Text("Try “coffee in Vacaville” or “bars in Fairfield.”")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 42)
    }

    private var results: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Vibing near you")
                    .font(.title3.weight(.bold))
                Spacer()
                Text("\(places.count) places")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            ForEach(places) { place in
                NavigationLink(value: place) {
                    PlaceCard(place: place)
                }
                .buttonStyle(.plain)
            }
        }
        .navigationDestination(for: Place.self) { place in
            PlaceDetailView(place: place)
        }
    }

    @MainActor
    private func search(_ raw: String) async {
        let cleaned = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return }

        isLoading = true
        errorMessage = nil

        do {
            places = try await VibeAPI.search(cleaned)
        } catch {
            errorMessage = "We couldn’t complete that search. Please try again."
        }

        isLoading = false
    }
}

// MARK: - Place Card

struct PlaceCard: View {
    let place: Place

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [brandPurple.opacity(0.12), brandPink.opacity(0.12)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                if let photoURL = place.photoURL {
                    AsyncImage(url: photoURL) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        default:
                            Text(place.vibeEmoji)
                                .font(.system(size: 44))
                        }
                    }
                } else {
                    Text(place.vibeEmoji)
                        .font(.system(size: 44))
                }
            }
            .frame(height: 175)
            .clipped()

            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("LIVE VIBE")
                            .font(.caption2.weight(.black))
                            .foregroundStyle(.green)

                        Text(place.name)
                            .font(.headline)
                            .foregroundStyle(ink)
                            .lineLimit(2)

                        Text(place.address)
                            .font(.caption)
                            .foregroundStyle(Color.black.opacity(0.45))
                            .lineLimit(2)
                    }

                    Spacer()

                    Text("\(place.vibeEmoji) \(place.vibeScore, specifier: "%.1f")")
                        .font(.headline.weight(.black))
                        .foregroundStyle(ink)
                }

                HStack(spacing: 7) {
                    Label(place.openLabel, systemImage: "circle.fill")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(place.openNow == true ? .green : .secondary)

                    Text("⭐ \(place.ratingText)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(15)
            .background(.white)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.black.opacity(0.05))
        )
    }
}

// MARK: - Place Detail

struct PlaceDetailView: View {
    let place: Place

    @State private var community: CommunityResponse?
    @State private var isLoadingCommunity = true
    @State private var selectedVibe: Vibe = .energetic
    @State private var isSavingVibe = false
    @State private var checkinMessage: String?
    @StateObject private var locationManager = LocationManager()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                heroImage

                VStack(alignment: .leading, spacing: 8) {
                    Text(place.name)
                        .font(.system(size: 30, weight: .black, design: .rounded))

                    Text(place.address)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 12) {
                        Text("\(place.vibeEmoji) \(place.vibeScore, specifier: "%.1f")")
                            .font(.system(size: 38, weight: .black, design: .rounded))

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Vibe Check score")
                                .font(.subheadline.weight(.bold))
                            Text("Google rating + current place signals")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 4)
                }

                communityCard
                checkinCard

                if let url = place.mapsURL {
                    Link(destination: url) {
                        Label("Open in Google Maps", systemImage: "map")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(ink)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 15))
                    }
                }
            }
            .padding(18)
        }
        .background(appBackground)
        .navigationTitle("Vibe")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            locationManager.requestLocation()
            await refreshCommunity()
        }
    }

    private var heroImage: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 22)
                .fill(brandPurple.opacity(0.12))

            if let photoURL = place.photoURL {
                AsyncImage(url: photoURL) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        Text(place.vibeEmoji).font(.system(size: 52))
                    }
                }
            } else {
                Text(place.vibeEmoji).font(.system(size: 52))
            }
        }
        .frame(height: 245)
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var communityCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Community activity")
                .font(.headline)

            if isLoadingCommunity {
                ProgressView()
                    .tint(brandPurple)
            } else if let community, community.total > 0 {
                if let average = community.community?.average {
                    HStack(alignment: .firstTextBaseline) {
                        Text(String(format: "%.1f", average))
                            .font(.system(size: 34, weight: .black, design: .rounded))
                        Text("/10 community score")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 9) {
                    ForEach(Vibe.allCases, id: \.rawValue) { vibe in
                        VStack(spacing: 4) {
                            Text(vibe.rawValue)
                                .font(.title2)
                            Text("\(community.counts[vibe.rawValue] ?? 0)")
                                .font(.caption.weight(.bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(appBackground, in: RoundedRectangle(cornerRadius: 13))
                    }
                }

                Text("\(community.total) live check-in\(community.total == 1 ? "" : "s") · last 3 hours")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("No live check-ins yet. Be the first to set the vibe.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(17)
        .background(.white, in: RoundedRectangle(cornerRadius: 20))
    }

    private var checkinCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("How’s the vibe right now?")
                .font(.headline)

            HStack(spacing: 8) {
                ForEach(Vibe.allCases, id: \.rawValue) { vibe in
                    Button {
                        selectedVibe = vibe
                    } label: {
                        Text(vibe.rawValue)
                            .font(.system(size: 25))
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(
                                selectedVibe == vibe ? brandPurple.opacity(0.12) : appBackground,
                                in: RoundedRectangle(cornerRadius: 14)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(selectedVibe == vibe ? brandPurple : Color.clear, lineWidth: 2)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            Button {
                Task { await submitVibe() }
            } label: {
                HStack {
                    Spacer()
                    if isSavingVibe {
                        ProgressView().tint(.white)
                    } else {
                        Text("Add my vibe")
                            .font(.headline)
                    }
                    Spacer()
                }
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [brandPurple, brandPink],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: RoundedRectangle(cornerRadius: 15)
                )
                .foregroundStyle(.white)
            }
            .disabled(isSavingVibe)

            if let checkinMessage {
                Text(checkinMessage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if locationManager.location == nil {
                Text("Location is required to keep Nearby accurate.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(17)
        .background(.white, in: RoundedRectangle(cornerRadius: 20))
    }

    @MainActor
    private func refreshCommunity() async {
        isLoadingCommunity = true
        do {
            community = try await VibeAPI.community(place.id)
        } catch {
            community = nil
        }
        isLoadingCommunity = false
    }

    @MainActor
    private func submitVibe() async {
        guard let location = locationManager.location else {
            locationManager.requestLocation()
            checkinMessage = "Allow location, then tap Add my vibe again."
            return
        }

        isSavingVibe = true
        checkinMessage = nil

        do {
            let response = try await VibeAPI.submitCheckin(
                place: place,
                vibe: selectedVibe,
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
            community = response
            checkinMessage = "Your \(selectedVibe.rawValue) vibe is live."
        } catch {
            checkinMessage = "We couldn’t add your vibe. Please try again."
        }

        isSavingVibe = false
    }
}

// MARK: - Future Tabs

struct NearbyView: View {
    @StateObject private var locationManager = LocationManager()
    @State private var places: [NearbyPlace] = []
    @State private var isLoading = false
    @State private var message: String?

    var body: some View {
        NavigationStack {
            ZStack {
                appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text("Nearby vibes")
                            .font(.system(size: 32, weight: .black, design: .rounded))

                        Text("See places with live community activity around you.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if let location = locationManager.location {
                            Button {
                                Task { await loadNearby(location) }
                            } label: {
                                Label("Refresh nearby", systemImage: "location.fill")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .background(ink)
                                    .foregroundStyle(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 15))
                            }
                        } else {
                            Button {
                                locationManager.requestLocation()
                            } label: {
                                Label("Use my location", systemImage: "location.fill")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .background(brandPurple)
                                    .foregroundStyle(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 15))
                            }
                        }

                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView("Finding live vibes…")
                                Spacer()
                            }
                            .padding(.vertical, 30)
                        } else if let message {
                            Text(message)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .padding(18)
                                .frame(maxWidth: .infinity)
                                .background(.white, in: RoundedRectangle(cornerRadius: 18))
                        } else {
                            ForEach(places) { place in
                                VStack(alignment: .leading, spacing: 9) {
                                    HStack(alignment: .top) {
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(place.placeName)
                                                .font(.headline)
                                            Text(place.placeAddress)
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Text(place.dominant ?? "✨")
                                            .font(.title2)
                                    }

                                    HStack {
                                        Label("\(place.total) live", systemImage: "person.2.fill")
                                        Spacer()
                                        Text("\(place.distanceMilesText) mi away")
                                    }
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)

                                    if let dominantPercent = place.dominantPercent,
                                       let dominant = place.dominant {
                                        Text("\(dominant) is leading with \(dominantPercent)% of recent check-ins")
                                            .font(.subheadline)
                                    }
                                }
                                .padding(16)
                                .background(.white, in: RoundedRectangle(cornerRadius: 19))
                            }
                        }
                    }
                    .padding(18)
                }
            }
            .task(id: locationManager.location?.coordinate.latitude) {
                if let location = locationManager.location {
                    await loadNearby(location)
                } else {
                    locationManager.requestLocation()
                }
            }
            .onChange(of: locationManager.location) { _, newLocation in
                if let newLocation {
                    Task { await loadNearby(newLocation) }
                }
            }
        }
    }

    @MainActor
    private func loadNearby(_ location: CLLocation) async {
        isLoading = true
        message = nil

        var latitude = location.coordinate.latitude
        var longitude = location.coordinate.longitude

        // The iOS Simulator often reports Apple's default test location,
        // which can be far from the Vacaville launch area. Keep production
        // behavior fully location-based, but make simulator QA useful by
        // anchoring Nearby around Vacaville.
        #if targetEnvironment(simulator)
        latitude = 38.3566
        longitude = -121.9877
        #endif

        do {
            places = try await VibeAPI.nearby(
                latitude: latitude,
                longitude: longitude
            )
            if places.isEmpty {
                message = "No live vibes nearby yet. Check in somewhere nearby and refresh to put it on the map."
            }
        } catch {
            message = "Nearby vibes are unavailable right now."
        }
        isLoading = false
    }
}

struct ProfileView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var email = ""
    @State private var history: [CheckinHistoryItem] = []
    @State private var isLoadingHistory = false
    @State private var message: String?

    var body: some View {
        NavigationStack {
            ZStack {
                appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text("Your Vibe Check")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(ink)

                        if auth.isSignedIn {
                            signedInCard
                            historyCard
                            Button("Sign out") {
                                auth.signOut()
                                history = []
                            }
                            .font(.headline)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(.white, in: RoundedRectangle(cornerRadius: 15))
                        } else {
                            signInCard
                        }
                    }
                    .padding(18)
                }
            }
            .task(id: auth.accessToken) {
                if auth.isSignedIn {
                    await loadHistory()
                }
            }
        }
    }

    private var signedInCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(
                            LinearGradient(
                                colors: [brandPurple.opacity(0.15), brandPink.opacity(0.18)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                    Text("💜")
                        .font(.title)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(auth.displayName)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(ink)
                    Text(auth.email ?? "Signed in")
                        .font(.caption)
                        .foregroundStyle(Color.black.opacity(0.58))
                }
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(history.count)")
                        .font(.title2.weight(.black))
                        .foregroundStyle(ink)
                    Text("Recent check-ins")
                        .font(.caption)
                        .foregroundStyle(Color.black.opacity(0.58))
                }
                Spacer()
                Text("🔒 Private history")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(brandPurple)
            }
        }
        .padding(18)
        .background(.white, in: RoundedRectangle(cornerRadius: 22))
    }

    private var signInCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Save your vibe history")
                .font(.title3.weight(.bold))
                .foregroundStyle(ink)

            Text("Sign in so your private check-in history follows you across devices.")
                .font(.subheadline)
                .foregroundStyle(Color.black.opacity(0.58))

            if let googleURL = auth.googleSignInURL {
                Link(destination: googleURL) {
                    HStack {
                        Image(systemName: "globe")
                        Text("Continue with Google")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.secondary)
                    }
                    .font(.headline)
                    .foregroundStyle(ink)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 15)
                    .frame(maxWidth: .infinity)
                    .background(.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.black.opacity(0.12))
                    )
                }
                .buttonStyle(.plain)
            } else {
                Text("Google sign-in is temporarily unavailable.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack {
                Rectangle().fill(Color.black.opacity(0.08)).frame(height: 1)
                Text("or")
                    .font(.caption)
                    .foregroundStyle(Color.black.opacity(0.45))
                Rectangle().fill(Color.black.opacity(0.08)).frame(height: 1)
            }

            TextField("Email address", text: $email)
                .foregroundStyle(ink)
                .tint(brandPurple)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(13)
                .background(appBackground, in: RoundedRectangle(cornerRadius: 13))

            Button {
                Task {
                    do {
                        try await auth.sendMagicLink(to: email)
                        message = "Check your email and tap the Vibe Check sign-in link."
                    } catch {
                        message = "We couldn’t send the sign-in link. Please try again."
                    }
                }
            } label: {
                Text("Email me a sign-in link")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(
                        LinearGradient(
                            colors: [brandPurple, brandPink],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: 14)
                    )
                    .foregroundStyle(.white)
            }
            .disabled(email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

            if let message {
                Text(message)
                    .font(.caption)
                    .foregroundStyle(Color.black.opacity(0.58))
            }
        }
        .padding(18)
        .background(.white, in: RoundedRectangle(cornerRadius: 22))
    }

    private var historyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent check-ins")
                    .font(.headline)
                    .foregroundStyle(ink)
                Spacer()
                if isLoadingHistory {
                    ProgressView()
                }
            }

            if !isLoadingHistory && history.isEmpty {
                Text("No saved check-ins yet.")
                    .font(.subheadline)
                    .foregroundStyle(Color.black.opacity(0.58))
            }

            ForEach(history) { item in
                HStack(spacing: 12) {
                    Text(item.vibe)
                        .font(.title2)
                        .frame(width: 44, height: 44)
                        .background(appBackground, in: RoundedRectangle(cornerRadius: 13))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.placeName ?? "Local place")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(ink)
                        if let address = item.placeAddress, !address.isEmpty {
                            Text(address)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                    Spacer()
                }
                .padding(.vertical, 5)
            }
        }
        .padding(18)
        .background(.white, in: RoundedRectangle(cornerRadius: 22))
    }

    @MainActor
    private func loadHistory() async {
        guard let token = auth.accessToken else { return }
        isLoadingHistory = true
        do {
            try await auth.linkNativeVisitor()
            history = try await VibeAPI.history(accessToken: token)
        } catch {
            history = []
        }
        isLoadingHistory = false
    }
}

// MARK: - Models

enum Vibe: String, CaseIterable {
    case loved = "😍"
    case good = "😊"
    case energetic = "🔥"
    case relaxed = "😌"
    case party = "🥳"
    case notMyVibe = "😕"
}

struct Place: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let address: String
    let rating: Double?
    let userRatingCount: Int?
    let type: String?
    let website: String?
    let url: String?
    let latitude: Double?
    let longitude: Double?
    let openNow: Bool?
    let weekdayDescriptions: [String]?
    let photoName: String?

    var photoURL: URL? {
        guard let photoName, !photoName.isEmpty else { return nil }
        return URL(string: photoName)
    }

    var mapsURL: URL? {
        guard let url, !url.isEmpty else { return nil }
        return URL(string: url)
    }

    var ratingText: String {
        guard let rating else { return "—" }
        return String(format: "%.1f", rating)
    }

    var openLabel: String {
        if openNow == true { return "Open now" }
        if openNow == false { return "Closed" }
        return "Hours unavailable"
    }

    var vibeEmoji: String {
        let combined = "\(type ?? "") \(name)".lowercased()
        if combined.contains("bar") || combined.contains("night") || combined.contains("brew") {
            return "🔥"
        }
        if combined.contains("coffee") || combined.contains("cafe") {
            return "😊"
        }
        if combined.contains("restaurant") || combined.contains("food") || combined.contains("grill") {
            return "😍"
        }
        return "😌"
    }

    var vibeScore: Double {
        var base: Double
        switch vibeEmoji {
        case "🔥": base = 9.1
        case "😊": base = 8.6
        case "😍": base = 8.7
        default: base = 8.4
        }
        let boost = max(-0.5, min(0.8, (rating ?? 4.0) - 4.0)) * 0.7
        return max(6.0, min(9.9, ((base + boost) * 10).rounded() / 10))
    }
}

struct NearbyPlace: Identifiable, Decodable {
    let placeId: String
    let placeName: String
    let placeAddress: String
    let latitude: Double?
    let longitude: Double?
    let total: Int
    let dominant: String?
    let dominantPercent: Int?
    let lastCheckin: String?
    let distanceMiles: Double?

    var id: String { placeId }
    var distanceMilesText: String {
        guard let distanceMiles else { return "—" }
        return String(format: "%.1f", distanceMiles)
    }

    enum CodingKeys: String, CodingKey {
        case placeId = "place_id"
        case placeName = "place_name"
        case placeAddress = "place_address"
        case latitude, longitude, total, dominant
        case dominantPercent = "dominant_percent"
        case lastCheckin = "last_checkin"
        case distanceMiles = "distance_miles"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        placeId = try container.decode(String.self, forKey: .placeId)
        placeName = try container.decodeIfPresent(String.self, forKey: .placeName) ?? "Local place"
        placeAddress = try container.decodeIfPresent(String.self, forKey: .placeAddress) ?? ""
        latitude = try container.decodeIfPresent(Double.self, forKey: .latitude)
        longitude = try container.decodeIfPresent(Double.self, forKey: .longitude)
        total = try container.decodeIfPresent(Int.self, forKey: .total) ?? 0
        dominant = try container.decodeIfPresent(String.self, forKey: .dominant)
        dominantPercent = try container.decodeIfPresent(Int.self, forKey: .dominantPercent)
        lastCheckin = try container.decodeIfPresent(String.self, forKey: .lastCheckin)

        if let numeric = try? container.decodeIfPresent(Double.self, forKey: .distanceMiles) {
            distanceMiles = numeric
        } else if let text = try? container.decodeIfPresent(String.self, forKey: .distanceMiles),
                  let text {
            distanceMiles = Double(text)
        } else {
            distanceMiles = nil
        }
    }
}

struct NearbyResponse: Decodable {
    let ok: Bool
    let places: [NearbyPlace]
}

struct SearchResponse: Decodable {
    let places: [Place]
    let count: Int
}

struct CommunityResponse: Decodable {
    let available: Bool?
    let counts: [String: Int]
    let total: Int
    let dominant: String?
    let windowMinutes: Int?
    let community: CommunitySummary?
}

struct CommunitySummary: Decodable {
    let available: Bool?
    let total: Int?
    let average: Double?
    let dominant: String?
    let dominantPercent: Int?
    let influencePercent: Int?
    let windowMinutes: Int?
}

struct CheckinHistoryItem: Identifiable, Decodable {
    let id: String
    let placeId: String?
    let placeName: String?
    let placeAddress: String?
    let vibe: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case placeId = "place_id"
        case placeName = "place_name"
        case placeAddress = "place_address"
        case vibe
        case createdAt = "created_at"
    }
}

struct CheckinHistoryResponse: Decodable {
    let ok: Bool
    let checkins: [CheckinHistoryItem]
}

// MARK: - API

enum VibeAPI {
    static let baseURL = URL(string: "https://vibelycheck.com")!

    static func search(_ query: String) async throws -> [Place] {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("api/search"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "query", value: query),
            URLQueryItem(name: "_", value: String(Int(Date().timeIntervalSince1970)))
        ]

        guard let url = components.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(SearchResponse.self, from: data).places
    }

    static func community(_ placeID: String) async throws -> CommunityResponse {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("api/checkin"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "placeId", value: placeID),
            URLQueryItem(name: "_", value: String(Int(Date().timeIntervalSince1970)))
        ]

        guard let url = components.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(CommunityResponse.self, from: data)
    }

    static func nearby(latitude: Double, longitude: Double) async throws -> [NearbyPlace] {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("api/nearby"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "lat", value: String(latitude)),
            URLQueryItem(name: "lng", value: String(longitude)),
            URLQueryItem(name: "radius", value: "10")
        ]

        guard let url = components.url else { throw URLError(.badURL) }
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(NearbyResponse.self, from: data).places
    }

    static func submitCheckin(
        place: Place,
        vibe: Vibe,
        latitude: Double,
        longitude: Double
    ) async throws -> CommunityResponse {
        let visitorID = NativeVisitorID.value
        var request = URLRequest(url: baseURL.appendingPathComponent("api/checkin"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let body: [String: Any] = [
            "placeId": place.id,
            "vibe": vibe.rawValue,
            "placeName": place.name,
            "placeAddress": place.address,
            "latitude": latitude,
            "longitude": longitude,
            "visitorId": visitorID
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(CommunityResponse.self, from: data)
    }

    static func history(accessToken: String) async throws -> [CheckinHistoryItem] {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("api/checkin"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "history", value: "1"),
            URLQueryItem(name: "limit", value: "20")
        ]
        guard let url = components.url else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(CheckinHistoryResponse.self, from: data).checkins
    }
}

enum NativeVisitorID {
    static var value: String {
        let key = "vibely.native.visitor.id"
        if let existing = UserDefaults.standard.string(forKey: key), !existing.isEmpty {
            return existing
        }
        let created = "ios_" + UUID().uuidString.replacingOccurrences(of: "-", with: "")
        UserDefaults.standard.set(created, forKey: key)
        return created
    }
}

@MainActor
final class AuthManager: NSObject, ObservableObject, ASWebAuthenticationPresentationContextProviding {
    @Published private(set) var accessToken: String?
    @Published private(set) var refreshToken: String?
    @Published private(set) var email: String?
    @Published private(set) var displayName: String = "Vibe Checker"
    @Published var authStatusMessage: String?

    private let supabaseURL = URL(string: "https://zfpxkijhgdtppdlgvsyo.supabase.co")!
    private let publishableKey = "sb_publishable_wzo6WpG6wsS52GVdKyftTA_4K2NYDa8"
    private let tokenKey = "vibely.auth.access"
    private let refreshKey = "vibely.auth.refresh"
    private var webAuthSession: ASWebAuthenticationSession?

    override init() {
        let storedAccessToken = UserDefaults.standard.string(forKey: "vibely.auth.access")
        let storedRefreshToken = UserDefaults.standard.string(forKey: "vibely.auth.refresh")
        super.init()
        accessToken = storedAccessToken
        refreshToken = storedRefreshToken
        if storedAccessToken != nil {
            Task { [weak self] in
                await self?.loadUser()
            }
        }
    }

    var isSignedIn: Bool { accessToken != nil }

    var googleSignInURL: URL? {
        var components = URLComponents(
            url: supabaseURL.appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: "https://vibelycheck.com/auth-mobile.html"),
            URLQueryItem(name: "prompt", value: "select_account")
        ]
        return components?.url
    }

    func startGoogleSignIn() {
        var components = URLComponents(
            url: supabaseURL.appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: "https://vibelycheck.com/auth-mobile.html"),
            URLQueryItem(name: "prompt", value: "select_account")
        ]

        guard let url = components.url else { return }

        authStatusMessage = "Opening Google sign-in…"

        let session = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "vibelycheck"
        ) { [weak self] callbackURL, error in
            guard let self else { return }
            self.webAuthSession = nil

            if let callbackURL {
                Task { @MainActor in
                    self.authStatusMessage = "Finishing sign-in…"
                    self.handleCallback(callbackURL)
                }
                return
            }

            Task { @MainActor in
                if let authError = error as? ASWebAuthenticationSessionError,
                   authError.code == .canceledLogin {
                    self.authStatusMessage = nil
                } else if error != nil {
                    self.authStatusMessage = "Google sign-in could not open."
                }
            }
        }

        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        webAuthSession = session
        if !session.start() {
            authStatusMessage = "Opening Google in Safari…"
            UIApplication.shared.open(url)
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow }) {
            return window
        }
        return ASPresentationAnchor()
    }

    func sendMagicLink(to rawEmail: String) async throws {
        let cleaned = rawEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleaned.contains("@") else { throw URLError(.badURL) }

        var request = URLRequest(url: supabaseURL.appendingPathComponent("auth/v1/otp"))
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(publishableKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": cleaned,
            "create_user": true,
            "options": [
                "email_redirect_to": "https://vibelycheck.com/auth-mobile.html"
            ]
        ])

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    func handleCallback(_ url: URL) {
        guard url.scheme == "vibelycheck" else { return }
        let source = (url.query ?? "") + "&" + (url.fragment ?? "")
        let values = parseParameters(source)

        guard let access = values["access_token"], !access.isEmpty else { return }
        accessToken = access
        refreshToken = values["refresh_token"]
        UserDefaults.standard.set(access, forKey: tokenKey)
        if let refresh = refreshToken {
            UserDefaults.standard.set(refresh, forKey: refreshKey)
        }

        Task {
            await loadUser()
            try? await linkNativeVisitor()
        }
    }

    func signOut() {
        accessToken = nil
        refreshToken = nil
        email = nil
        displayName = "Vibe Checker"
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: refreshKey)
    }

    func linkNativeVisitor() async throws {
        guard let token = accessToken else { return }
        var request = URLRequest(url: URL(string: "https://vibelycheck.com/api/link-visitor")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "visitorId": NativeVisitorID.value
        ])
        _ = try await URLSession.shared.data(for: request)
    }

    private func loadUser() async {
        guard let token = accessToken else { return }
        var request = URLRequest(url: supabaseURL.appendingPathComponent("auth/v1/user"))
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                signOut()
                return
            }
            if let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                email = object["email"] as? String
                if let metadata = object["user_metadata"] as? [String: Any] {
                    displayName =
                        (metadata["full_name"] as? String) ??
                        (metadata["name"] as? String) ??
                        email?.split(separator: "@").first.map(String.init) ??
                        "Vibe Checker"
                } else {
                    displayName = email?.split(separator: "@").first.map(String.init) ?? "Vibe Checker"
                }
            }
        } catch {
            // Keep the local session and try again next time.
        }
    }

    private func parseParameters(_ source: String) -> [String: String] {
        var result: [String: String] = [:]
        for pair in source.split(separator: "&") {
            let parts = pair.split(separator: "=", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { continue }
            let key = parts[0].removingPercentEncoding ?? parts[0]
            let value = parts[1].replacingOccurrences(of: "+", with: " ").removingPercentEncoding ?? parts[1]
            result[key] = value
        }
        return result
    }
}

final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = manager.authorizationStatus
    }

    func requestLocation() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
        default:
            break
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedWhenInUse ||
            manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.last
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // The UI remains usable without nearby/check-in features until location is available.
    }
}
