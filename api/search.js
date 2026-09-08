export default async function handler(req, res) {
  const query = String(req.query.query || req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({ error: "Please provide a search query." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Places API key is not configured." });
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.primaryType,places.location,places.photos"
      },
      body: JSON.stringify({ textQuery: query, pageSize: 10, languageCode: "en" })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Google Places error:", response.status, data);
      return res.status(response.status).json({ error: data.error?.message || "Google Places search failed." });
    }

    const places = (data.places || []).map((place) => {
      const firstPhoto = place.photos?.[0];
      return {
        id: place.id,
        name: place.displayName?.text || "Unknown place",
        address: place.formattedAddress || "",
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? 0,
        type: place.primaryType || "Place",
        website: place.websiteUri || "",
        url: place.googleMapsUri || "",
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        photoName: firstPhoto?.name || "",
        photoAttributions: (firstPhoto?.authorAttributions || []).map((a) => ({
          displayName: a.displayName || "Google Maps contributor",
          uri: a.uri || ""
        }))
      };
    });

    return res.status(200).json({ places, count: places.length });
  } catch (error) {
    console.error("Google Places search error:", error);
    return res.status(500).json({ error: "Something went wrong while searching for places." });
  }
}
