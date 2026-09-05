export default async function handler(req, res) {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({
      error: "Please provide a search query."
    });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Google Places API key is not configured."
    });
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryType,places.googleMapsUri"
        },
        body: JSON.stringify({
          textQuery: query,
          pageSize: 10
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Places search failed."
      });
    }

    const places = (data.places || []).map((place) => ({
      id: place.id,
      name: place.displayName?.text || "Unknown place",
      address: place.formattedAddress || "",
      rating: place.rating || null,
      reviewCount: place.userRatingCount || 0,
      type: place.primaryType || "Place",
      mapsUrl: place.googleMapsUri || ""
    }));

    return res.status(200).json({ places });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong while searching for places."
    });
  }
}
