function noStore(res){
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma","no-cache");
  res.setHeader("Expires","0");
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const placeId = String(req.query?.placeId || "").trim();
  if (!placeId || placeId.length > 500) {
    return res.status(400).json({ error: "Please provide a valid place ID." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Review summary is temporarily unavailable." });
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

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Google review summary error:", response.status, data);
      const temporary = response.status === 429 || response.status >= 500;
      return res.status(temporary ? 503 : 502).json({ error: "Review summary is temporarily unavailable." });
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
    return res.status(503).json({ error: "Review summary is temporarily unavailable." });
  }
}
