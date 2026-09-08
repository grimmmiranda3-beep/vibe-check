export default async function handler(req, res) {
  const rawQuery = String(req.query.query || req.query.q || "").trim();

  if (!rawQuery) {
    return res.status(400).json({ error: "Please provide a search query." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Places API key is not configured." });
  }

  // Google Places can be surprisingly sensitive to casual location syntax
  // such as "coffee shops vacaville,ca". Try the original query first, then
  // normalized variants before returning an empty result set.
  const queries = [...new Set([
    rawQuery,
    rawQuery.replace(/\s*,\s*/g, ", "),
    rawQuery.replace(/\s*,\s*/g, " in "),
    rawQuery.replace(/\s+(\w[^,]*)$/i, " in $1")
  ])];

  async function searchGoogle(textQuery) {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.primaryType,places.location,places.photos,places.currentOpeningHours"
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 10,
        languageCode: "en"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Google Places search failed.");
    }
    return data.places || [];
  }

  try {
    let googlePlaces = [];
    let lastError = null;

    for (const query of queries) {
      try {
        googlePlaces = await searchGoogle(query);
        if (googlePlaces.length) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!googlePlaces.length && lastError) {
      console.error("Google Places error:", lastError);
      return res.status(502).json({ error: lastError.message });
    }

    const places = googlePlaces.map((place) => {
      const firstPhoto = place.photos?.[0];
      const openingHours = place.currentOpeningHours || {};
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
        openNow: openingHours.openNow ?? null,
        weekdayDescriptions: openingHours.weekdayDescriptions || [],
        photoName: firstPhoto?.name || "",
        photoAttributions: (firstPhoto?.authorAttributions || []).map((a) => ({
          displayName: a.displayName || "Google Maps contributor",
          uri: a.uri || ""
        }))
      };
    });

    places.sort((a, b) => {
      const openRank = value => value === true ? 0 : value === null ? 1 : 2;
      const rankDiff = openRank(a.openNow) - openRank(b.openNow);
      if (rankDiff !== 0) return rankDiff;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });

    return res.status(200).json({ places, count: places.length });
  } catch (error) {
    console.error("Google Places search error:", error);
    return res.status(500).json({ error: "Something went wrong while searching for places." });
  }
}
