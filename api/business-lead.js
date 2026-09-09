const WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT = 3;

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
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN
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

function clientKey(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded.slice(0, 80) || "unknown";
}

async function allowedRequest(req) {
  const key = `vibe-check:rate:business-lead:${clientKey(req)}`;
  const result = await redis(["INCR", key]);
  if (!result) return true;
  const count = Number(result.result || 0);
  if (count === 1) await redis(["EXPIRE", key, WINDOW_SECONDS]);
  return count <= RATE_LIMIT;
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    if (!(await allowedRequest(req))) {
      return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
    }
  } catch (error) {
    console.error("Business lead rate-limit error:", error);
  }

  const body = req.body || {};
  // Honeypot for simple bots. Real users should leave this field empty.
  if (String(body.website || "").trim()) {
    return res.status(201).json({ ok: true, message: "Thanks! We'll be in touch." });
  }

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
