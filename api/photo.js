export default async function handler(req, res) {
  const name = String(req.query.name || "").trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!name) return res.status(400).json({ error: "Photo name is required." });
  if (!apiKey) return res.status(500).json({ error: "Google Places API key is not configured." });

  // The search endpoint may already have resolved the Google photo to a
  // short-lived photoUri. In that case, simply redirect the browser to it.
  if (/^https:\/\//i.test(name)) {
    try {
      const parsed = new URL(name);
      if (!parsed.hostname.endsWith("googleusercontent.com")) {
        return res.status(400).json({ error: "Invalid photo URL." });
      }
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
      return res.redirect(302, parsed.href);
    } catch {
      return res.status(400).json({ error: "Invalid photo URL." });
    }
  }

  if (!name.startsWith("places/") || !name.includes("/photos/")) {
    return res.status(400).json({ error: "Invalid photo name." });
  }

  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=650&skipHttpRedirect=false&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const data = await response.text().catch(() => "");
      console.error("Google Place Photo error:", response.status, data);
      return res.status(response.status).json({ error: "Unable to load this place photo." });
    }

    // Google returns a redirect to the actual image when skipHttpRedirect is false.
    const location = response.headers.get("location");
    if (!location) {
      return res.status(502).json({ error: "Google did not return a photo location." });
    }

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.redirect(302, location);
  } catch (error) {
    console.error("Google Place Photo proxy error:", error);
    return res.status(500).json({ error: "Something went wrong while loading the place photo." });
  }
}
