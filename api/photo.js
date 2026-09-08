export default async function handler(req, res) {
  const name = String(req.query.name || "").trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!name) return res.status(400).json({ error: "Photo name is required." });
  if (!apiKey) return res.status(500).json({ error: "Google Places API key is not configured." });
  if (!name.startsWith("places/") || !name.includes("/photos/")) {
    return res.status(400).json({ error: "Invalid photo name." });
  }

  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=650&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { redirect: "manual" });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return res.status(502).json({ error: "Photo redirect was not provided." });
      return res.redirect(302, location);
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Google Place Photo error:", response.status, text);
      return res.status(response.status).json({ error: "Unable to load this place photo." });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Google Place Photo proxy error:", error);
    return res.status(500).json({ error: "Something went wrong while loading the place photo." });
  }
}
