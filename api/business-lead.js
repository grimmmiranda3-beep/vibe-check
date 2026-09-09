function redisConfig() {
  return {
    url:
      process.env.STORAGE_URL ||
      process.env.STORAGE_KV_REST_API_URL ||
      process.env.STORAGE_REST_API_URL ||
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL,
    token:
      process.env.STORAGE_TOKEN ||
      process.env.STORAGE_KV_REST_API_TOKEN ||
      process.env.STORAGE_REST_API_TOKEN ||
      process.env.KV_REST_API_TOKEN
  };
}

async function redis(command) {
  const { url, token } = redisConfig();
  if (!url || !token) return null;
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
}

function clean(value, max) {
  return String(value || "").trim().replace(/[<>]/g, "").slice(0, max);
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = req.body || {};
  const businessName = clean(body.businessName, 160);
  const email = clean(body.email, 160).toLowerCase();
  const placeId = clean(body.placeId, 120);

  if (!businessName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Business name and a valid email are required." });
  }

  try {
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const lead = JSON.stringify({
      id,
      businessName,
      email,
      placeId,
      createdAt: new Date().toISOString()
    });

    await redis(["SET", `vibe-check:business-lead:${id}`, lead, "EX", 60 * 60 * 24 * 180]);
    await redis(["LPUSH", "vibe-check:business-leads", id]);
    await redis(["LTRIM", "vibe-check:business-leads", 0, 999]);

    return res.status(201).json({ ok: true, message: "Thanks! We'll be in touch." });
  } catch (error) {
    console.error("Business lead error:", error);
    return res.status(500).json({ ok: false, error: "Unable to save your request right now." });
  }
}
