const EVENTS = ["search", "view_place", "checkin_open", "checkin_submitted", "checkin_updated", "business_view"];
const TTL = 60 * 60 * 24 * 45;

function redisConfig() {
  return {
    url: process.env.STORAGE_URL || process.env.STORAGE_KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.STORAGE_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}

async function redis(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("Storage is not configured");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  if (!response.ok) throw new Error(`Storage request failed (${response.status})`);
  return response.json();
}

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const configured = String(process.env.ANALYTICS_ADMIN_TOKEN || "");
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!configured || supplied !== configured) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const day = String(req.query?.day || new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ ok: false, error: "Invalid day" });

  try {
    const commands = EVENTS.map(event => ["GET", `vibe-check:analytics:${day}:${event}`]);
    const results = await Promise.all(commands.map(redis));
    const metrics = Object.fromEntries(EVENTS.map((event, i) => [event, Number(results[i]?.result || 0)]));

    const searches = metrics.search;
    const placeViews = metrics.view_place;
    const checkinOpens = metrics.checkin_open;
    const checkins = metrics.checkin_submitted + metrics.checkin_updated;

    return res.status(200).json({
      ok: true,
      day,
      metrics,
      funnel: {
        searches,
        placeViews,
        checkinOpens,
        checkins,
        searchToPlaceView: searches ? Number((placeViews / searches * 100).toFixed(1)) : 0,
        placeViewToCheckinOpen: placeViews ? Number((checkinOpens / placeViews * 100).toFixed(1)) : 0,
        checkinOpenToCheckin: checkinOpens ? Number((checkins / checkinOpens * 100).toFixed(1)) : 0
      },
      retention: {
        note: "Current analytics are aggregate event counters and do not identify individual visitors, so true user-level retention is not available yet."
      },
      expiresInDays: 45
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return res.status(500).json({ ok: false, error: "Unable to read analytics." });
  }
}
