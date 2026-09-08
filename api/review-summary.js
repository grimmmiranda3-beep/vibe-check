export default async function handler(req, res) {
  const placeId = String(req.query.placeId || "").trim();

  if (!placeId) {
    return res.status(400).json({ error: "Please provide a place ID." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Places API key is not configured." });
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,reviewSummary"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Google review summary error:", response.status, data);
      return res.status(response.status).json({ error: data.error?.message || "Review summary unavailable." });
    }

    const summary = data.reviewSummary || null;

    return res.status(200).json({
      available: Boolean(summary?.text?.text),
      summary: summary?.text?.text || "",
      disclosureText: summary?.disclosureText?.text || "Summarized with Gemini",
      reviewsUri: summary?.reviewsUri || "",
      flagContentUri: summary?.flagContentUri || ""
    });
  } catch (error) {
    console.error("Review summary request failed:", error);
    return res.status(500).json({ error: "Something went wrong while loading the review summary." });
  }
}
