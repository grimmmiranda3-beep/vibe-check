export default async function handler(req, res) {
  const name = String(req.query.name || "").trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!name) return res.status(400).json({ error: "Photo name is required." });
  if (!apiKey) return res.status(500).json({ error: "Google Places API key is not configured." });
  if (!name.startsWith("places/") || !name.includes("/photos/")) {
    return res.status(400).json({ error: "Invalid photo name." });
  }

  try {
    // Ask Google for the short-lived photoUri instead of proxying the image
    // bytes through Vercel. Google documents photoUri as the URI intended for
    // rendering the Place Photo in an application.
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=650&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.photoUri) {
      console.error("Google Place Photo error:", response.status, data);
      return res.status(response.ok ? 502 : response.status).json({ error: "Unable to load this place photo." });
    }

    // The photoUri is short-lived, so don't cache this redirect for a long time.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.redirect(302, data.photoUri);
  } catch (error) {
    console.error("Google Place Photo proxy error:", error);
    return res.status(500).json({ error: "Something went wrong while loading the place photo." });
  }
}
