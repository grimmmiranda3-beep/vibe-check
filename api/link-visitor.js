function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function config() {
  return {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ""
  };
}

function getCookie(req, name) {
  const raw = req.headers?.cookie || "";
  const match = raw.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authorization = req.headers?.authorization || "";
  if (!/^Bearer\s+\S+/i.test(authorization)) return res.status(401).json({ error: "Sign in to link your check-ins." });

  const visitorId = getCookie(req, "vibe_visitor");
  if (!visitorId) return res.status(200).json({ ok: true, linked: 0 });

  try {
    const { url, key } = config();
    if (!url || !key) throw new Error("Supabase is not configured.");
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/vibe_link_visitor`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_visitor_id: visitorId })
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) throw new Error(data?.message || data?.hint || "Unable to link check-ins.");
    return res.status(200).json({ ok: true, linked: Number(data || 0) });
  } catch (error) {
    console.error("Vibe visitor link error:", error);
    return res.status(500).json({ error: "Unable to link your check-ins right now." });
  }
}
