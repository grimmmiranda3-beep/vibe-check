const ALLOWED_EVENTS = new Set([
  "pageview",
  "search",
  "view_place",
  "checkin_open",
  "checkin_submitted",
  "checkin_updated",
  "business_view",
  "signup"
]);

const TRACKED_SOURCES = ["instagram", "tiktok", "direct", "other"];

const WINDOW_SECONDS = 60;
const RATE_LIMIT = 30;

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
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
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

function clientKey(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded.slice(0, 80) || "unknown";
}

async function allowedRequest(req) {
  const key = `vibe-check:rate:analytics:${clientKey(req)}`;
  const result = await redis(["INCR", key]);
  if (!result) return true;
  const count = Number(result.result || 0);
  if (count === 1) await redis(["EXPIRE", key, WINDOW_SECONDS]);
  return count <= RATE_LIMIT;
}

function safeSegment(value, max = 120) {
  return String(value || "").replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, max);
}

export default async function handler(req, res) {
  noStore(res);

  if (req.method === "GET") {
    const days = Math.max(1, Math.min(30, Number(req.query?.days || 7)));
    const events = [...ALLOWED_EVENTS];
    const today = new Date();
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      return d.toISOString().slice(0, 10);
    }).reverse();

    try {
      const totals = {};
      const sources = {};
      for (const event of events) totals[event] = 0;
      for (const source of TRACKED_SOURCES) {
        sources[source] = {};
        for (const event of events) sources[source][event] = 0;
      }

      for (const day of dates) {
        for (const event of events) {
          const result = await redis(["GET", `vibe-check:analytics:${day}:${event}`]);
          totals[event] += Number(result?.result || 0);
        }
        for (const source of TRACKED_SOURCES) {
          for (const event of events) {
            const result = await redis(["GET", `vibe-check:analytics:${day}:source:${source}:${event}`]);
            sources[source][event] += Number(result?.result || 0);
          }
        }
      }

      return res.status(200).json({ ok: true, days, dates, totals, sources });
    } catch (error) {
      console.error("Analytics read error:", error);
      return res.status(200).json({ ok: true, days, dates, totals: {}, sources: {} });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!(await allowedRequest(req))) {
      return res.status(429).json({ ok: false, error: "Too many analytics events." });
    }
  } catch (error) {
    console.error("Analytics rate-limit error:", error);
  }

  const body = req.body || {};
  const event = safeSegment(body.event, 40);
  const placeId = safeSegment(body.placeId, 120);
  const sourceRaw = safeSegment(body.source, 40).toLowerCase();
  const source = TRACKED_SOURCES.includes(sourceRaw) ? sourceRaw : "other";
  const campaign = safeSegment(body.campaign, 80);

  if (!ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ ok: false, error: "Invalid analytics event." });
  }

  // Analytics intentionally stores only coarse product events. Do not send
  // names, addresses, emails, cookies, or other personally identifying data.
  const day = new Date().toISOString().slice(0, 10);
  const globalKey = `vibe-check:analytics:${day}:${event}`;

  try {
    await redis(["INCR", globalKey]);
    await redis(["EXPIRE", globalKey, 60 * 60 * 24 * 45]);

    const sourceKey = `vibe-check:analytics:${day}:source:${source}:${event}`;
    await redis(["INCR", sourceKey]);
    await redis(["EXPIRE", sourceKey, 60 * 60 * 24 * 45]);

    if (campaign) {
      const campaignKey = `vibe-check:analytics:${day}:campaign:${campaign}:${event}`;
      await redis(["INCR", campaignKey]);
      await redis(["EXPIRE", campaignKey, 60 * 60 * 24 * 45]);
    }

    if (placeId) {
      const placeKey = `vibe-check:analytics:${day}:place:${placeId}:${event}`;
      await redis(["INCR", placeKey]);
      await redis(["EXPIRE", placeKey, 60 * 60 * 24 * 45]);
    }

    return res.status(204).end();
  } catch (error) {
    // Analytics should never break the user experience.
    console.error("Analytics write error:", error);
    return res.status(204).end();
  }
}
