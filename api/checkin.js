const ALLOWED = ["😍", "😊", "🔥", "😌", "🥳"];

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

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

async function redis(command) {
  const { url, token } = redisConfig();
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) throw new Error(`Storage request failed (${response.status})`);
  return response.json();
}

function keyFor(placeId) {
  return `vibe-check:place:${String(placeId).slice(0, 500)}`;
}

export default async function handler(req, res) {
  noStore(res);

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const placeId = req.method === "GET"
      ? req.query?.placeId
      : (req.body || {}).placeId;

    if (!placeId) {
      return res.status(400).json({ error: "A valid placeId is required." });
    }

    const key = keyFor(placeId);

    if (req.method === "GET") {
      const stored = await redis(["HGETALL", key]);
      if (!stored) {
        return res.status(200).json({
          available: false,
          counts: {},
          total: 0,
          message: "Community storage is not connected yet."
        });
      }

      const raw = Array.isArray(stored.result) ? stored.result : [];
      const counts = {};
      for (let i = 0; i < raw.length; i += 2) {
        const vibe = raw[i];
        const count = Number(raw[i + 1] || 0);
        if (ALLOWED.includes(vibe)) counts[vibe] = count;
      }

      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      return res.status(200).json({ available: true, counts, total });
    }

    const { vibe } = req.body || {};
    if (!ALLOWED.includes(vibe)) {
      return res.status(400).json({ error: "A valid vibe is required." });
    }

    const stored = await redis(["HINCRBY", key, vibe, 1]);
    if (!stored) {
      return res.status(503).json({
        error: "Community storage is not connected yet."
      });
    }

    return res.status(200).json({
      ok: true,
      placeId,
      vibe,
      count: Number(stored.result || 0),
      recordedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Vibe check-in error:", error);
    return res.status(500).json({ error: "Unable to record vibe right now." });
  }
}
