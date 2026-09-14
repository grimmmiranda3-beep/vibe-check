import SwiftUI

private let brandPurple = Color(red: 0.49, green: 0.23, blue: 0.89)
private let brandPink = Color(red: 0.93, green: 0.28, blue: 0.60)
private let appBackground = Color(red: 0.973, green: 0.965, blue: 0.976)
private let ink = Color(red: 0.09, green: 0.08, blue: 0.10)

struct ContentView: View {
    var body: some View {
        TabView {
            ExploreView()
                .tabItem { Label("Explore", systemImage: "sparkles") }

            NearbyPlaceholderView()
                .tabItem { Label("Nearby", systemImage: "location.fill") }

            ProfilePlaceholderView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .tint(brandPurple)
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
                            .foregroundStyle(.secondary)
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
            do {
                community = try await VibeAPI.community(place.id)
            } catch {
                community = nil
            }
            isLoadingCommunity = false
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
}

// MARK: - Future Tabs

struct NearbyPlaceholderView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                Image(systemName: "location.circle.fill")
                    .font(.system(size: 52))
                    .foregroundStyle(brandPurple)
                Text("Nearby vibes")
                    .font(.title2.weight(.bold))
                Text("Native location-based discovery is the next screen we’re building.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(appBackground)
        }
    }
}

struct ProfilePlaceholderView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 52))
                    .foregroundStyle(brandPurple)
                Text("Your Vibe Check")
                    .font(.title2.weight(.bold))
                Text("Account sign-in and private check-in history will plug into the same Supabase account you already use on the web.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(appBackground)
        }
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
}
