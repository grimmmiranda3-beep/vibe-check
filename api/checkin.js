const ALLOWED = ["😍", "😊", "🔥", "😌", "🥳"];
const CHECKIN_WINDOW_SECONDS = 3 * 60 * 60;
const MAX_PLACE_ID_LENGTH = 500;
const MAX_VISITOR_ID_LENGTH = 120;

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function config() {
  return {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || ""
  };
}

async function rpc(name, args) {
  const { url, key } = config();
  if (!url || !key) throw new Error("Supabase is not configured.");
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(args)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || data?.hint || "Supabase request failed.");
  return data;
}

function validPlaceId(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= MAX_PLACE_ID_LENGTH;
}

function getCookie(req, name) {
  const raw = req.headers?.cookie || "";
  const match = raw.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function makeVisitorId() {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

function setVisitorCookie(res, visitorId) {
  res.setHeader("Set-Cookie", `vibe_visitor=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax; Secure`);
}

function normalizeLive(data) {
  const live = data && typeof data === "object" ? data : {};
  return {
    available: true,
    counts: live.counts || {},
    total: Number(live.total || 0),
    dominant: live.dominant || null,
    windowMinutes: Number(live.windowMinutes || CHECKIN_WINDOW_SECONDS / 60),
    community: live.community || {
      available: false,
      total: 0,
      average: null,
      dominant: null,
      dominantPercent: 0,
      confidence: 0,
      influencePercent: 0,
      windowMinutes: CHECKIN_WINDOW_SECONDS / 60
    }
  };
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const placeId = req.method === "GET" ? req.query?.placeId : (req.body || {}).placeId;
    if (!validPlaceId(placeId)) return res.status(400).json({ error: "A valid placeId is required." });

    if (req.method === "GET") {
      const live = await rpc("vibe_live_checkins", { p_place_id: String(placeId).trim() });
      return res.status(200).json(normalizeLive(live));
    }

    const { vibe } = req.body || {};
    if (!ALLOWED.includes(vibe)) return res.status(400).json({ error: "A valid vibe is required." });

    let visitorId = getCookie(req, "vibe_visitor");
    if (!visitorId || visitorId.length > MAX_VISITOR_ID_LENGTH) {
      visitorId = makeVisitorId();
      setVisitorCookie(res, visitorId);
    }

    const result = await rpc("vibe_submit_checkin", {
      p_place_id: String(placeId).trim(),
      p_visitor_id: visitorId,
      p_vibe: vibe
    });
    const state = Array.isArray(result) ? result[0] || {} : result || {};
    const live = normalizeLive(await rpc("vibe_live_checkins", { p_place_id: String(placeId).trim() }));

    return res.status(200).json({
      ok: true,
      alreadyCheckedIn: Boolean(state.already_checked_in),
      updatedVibe: Boolean(state.updated_vibe),
      placeId: String(placeId).trim(),
      vibe,
      recordedAt: new Date().toISOString(),
      ...live
    });
  } catch (error) {
    console.error("Vibe check-in error:", error);
    return res.status(500).json({ error: "Unable to record vibe right now." });
  }
}
