export default async function handler(req, res) {
  const query = String(req.query.query || "").trim();
  const near = String(req.query.near || "").trim();
  const ll = String(req.query.ll || "").trim();

  if (!query) {
    return res.status(400).json({
      error: "Please provide a search query."
    });
  }

  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Foursquare API key is not configured."
    });
  }

  try {
    const params = new URLSearchParams({
      query,
      limit: "10",
      sort: "RELEVANCE",
      fields: "fsq_id,name,location,categories,rating,distance,website,link"
    });

    if (ll) {
      params.set("ll", ll);
      params.set("radius", "10000");
    } else if (near) {
      params.set("near", near);
    }

    const response = await fetch(
      `https://places-api.foursquare.com/places/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Places-Api-Version": "2025-06-17"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Foursquare search failed."
      });
    }

    const places = (data.results || []).map((place) => ({
      id: place.fsq_id,
      name: place.name || "Unknown place",
      address:
        place.location?.formatted_address ||
        place.location?.address ||
        "",
      rating: place.rating || null,
      distance: place.distance || null,
      type: place.categories?.[0]?.name || "Place",
      website: place.website || "",
      url: place.link || ""
    }));

    return res.status(200).json({ places });

  } catch (error) {
    console.error("Foursquare search error:", error);

    return res.status(500).json({
      error: "Something went wrong while searching for places."
    });
  }
}
