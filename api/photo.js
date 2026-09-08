export default async function handler(req, res) {
  const name = String(req.query.name || "").trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!name) return res.status(400).json({ error: "Photo name is required." });
  if (!apiKey) return res.status(500).json({ error: "Google Places API key is not configured." });
  if (!name.startsWith("places/") || !name.includes("/photos/")) {
    return res.status(400).json({ error: "Invalid photo name." });
  }

  try {
    // Follow Google's photo redirect on the server instead of sending the
    // browser directly to the Google media URL. This makes the image more
    // reliable across browsers and keeps the Places API key out of the page.
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=650&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("Google Place Photo error:", response.status, text);
      return res.status(response.status).json({ error: "Unable to load this place photo." });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Google Place Photo proxy error:", error);
    return res.status(500).json({ error: "Something went wrong while loading the place photo." });
  }
}
