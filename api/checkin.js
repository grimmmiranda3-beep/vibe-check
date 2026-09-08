export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { placeId, vibe } = req.body || {};
    const allowed = ["😍", "😊", "🔥", "😌", "🥳"];

    if (!placeId || !allowed.includes(vibe)) {
      return res.status(400).json({ error: "A valid placeId and vibe are required." });
    }

    // This endpoint validates check-ins and provides a stable API contract.
    // The first release keeps the anonymous client-side tally; a persistent
    // database can be connected later without changing the UI contract.
    return res.status(200).json({
      ok: true,
      placeId,
      vibe,
      recordedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Vibe check-in error:", error);
    return res.status(500).json({ error: "Unable to record vibe right now." });
  }
}
