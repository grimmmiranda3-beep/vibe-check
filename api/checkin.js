const ALLOWED = ["😍", "😊", "🔥", "😌", "🥳"];
const COMMUNITY_VIBE_VALUES = { "😍": 9.7, "😊": 8.9, "🔥": 9.5, "😌": 8.6, "🥳": 9.3 };
const CHECKIN_WINDOW_SECONDS = 3 * 60 * 60;
const CHECKIN_RATE_LIMIT = 12;
const CHECKIN_RATE_WINDOW_SECONDS = 60;

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

function baseKey(placeId) {
  return `vibe-check:active:${String(placeId).slice(0, 500)}`;
}

function visitorStateKey(placeId, visitorId) {
  return `${baseKey(placeId)}:visitor:${String(visitorId).slice(0, 120)}`;
}

function activeIndexKey(placeId) {
  return `${baseKey(placeId)}:index`;
}

function activeVibeKey(placeId) {
  return `${baseKey(placeId)}:vibes`;
}

function rateKey(visitorId) {
  return `vibe-check:rate:checkin:${String(visitorId).slice(0, 120)}`;
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
  res.setHeader(
    "Set-Cookie",
    `vibe_visitor=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax; Secure`
  );
}

function countsFromEntries(entries) {
  const counts = {};
  for (const vibe of entries) {
    if (ALLOWED.includes(vibe)) counts[vibe] = (counts[vibe] || 0) + 1;
  }
  return counts;
}

function communityConfidence(total) {
  if (total < 5) return 0;
  if (total < 20) return 0.10;
  if (total < 50) return 0.20;
  return 0.30;
}

function communitySignal(counts, total, dominant) {
  const weightedTotal = Object.entries(counts).reduce((sum, [vibe, count]) => {
    return sum + (COMMUNITY_VIBE_VALUES[vibe] || 0) * Number(count || 0);
  }, 0);

  return {
    available: total > 0,
    total,
    average: total ? Number((weightedTotal / total).toFixed(1)) : null,
    dominant,
    confidence: communityConfidence(total),
    influencePercent: Math.round(communityConfidence(total) * 100)
  };
}

async function cleanup(placeId) {
  const indexKey = activeIndexKey(placeId);
  const vibeKey = activeVibeKey(placeId);
  const now = Math.floor(Date.now() / 1000);

  const expired = await redis(["ZRANGEBYSCORE", indexKey, "-inf", now]);
  const visitors = Array.isArray(expired?.result) ? expired.result : [];

  for (const visitorId of visitors) {
    await redis(["HDEL", vibeKey, visitorId]);
    await redis(["DEL", visitorStateKey(placeId, visitorId)]);
  }

  if (visitors.length) {
    await redis(["ZREM", indexKey, ...visitors]);
  }

  return { indexKey, vibeKey };
}

async function getLive(placeId) {
  const { indexKey, vibeKey } = await cleanup(placeId);
  const active = await redis(["ZRANGE", indexKey, 0, -1]);
  const visitors = Array.isArray(active?.result) ? active.result : [];

  const vibes = [];
  for (const visitorId of visitors) {
    const row = await redis(["HGET", vibeKey, visitorId]);
    if (row?.result && ALLOWED.includes(row.result)) vibes.push(row.result);
  }

  const counts = countsFromEntries(vibes);
  const total = vibes.length;
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    available: true,
    counts,
    total,
    dominant,
    windowMinutes: Math.round(CHECKIN_WINDOW_SECONDS / 60),
    community: communitySignal(counts, total, dominant)
  };
}

async function enforceRateLimit(visitorId) {
  const key = rateKey(visitorId);
  const result = await redis(["INCR", key]);
  if (!result) return true;
  const count = Number(result.result || 0);
  if (count === 1) await redis(["EXPIRE", key, CHECKIN_RATE_WINDOW_SECONDS]);
  return count <= CHECKIN_RATE_LIMIT;
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

    if (req.method === "GET") {
      return res.status(200).json(await getLive(placeId));
    }

    const { vibe } = req.body || {};
    if (!ALLOWED.includes(vibe)) {
      return res.status(400).json({ error: "A valid vibe is required." });
    }

    let visitorId = getCookie(req, "vibe_visitor");
    if (!visitorId) {
      visitorId = makeVisitorId();
      setVisitorCookie(res, visitorId);
    }

    if (!(await enforceRateLimit(visitorId))) {
      return res.status(429).json({ error: "You've checked in a lot. Please wait a minute before trying again." });
    }

    const { indexKey, vibeKey } = await cleanup(placeId);
    const visitorKey = visitorStateKey(placeId, visitorId);
    const previous = await redis(["HGET", vibeKey, visitorId]);
    const previousVibe = previous?.result && ALLOWED.includes(previous.result)
      ? previous.result
      : null;

    if (previousVibe === vibe) {
      const live = await getLive(placeId);
      return res.status(200).json({
        ok: true,
        alreadyCheckedIn: true,
        placeId,
        vibe,
        ...live
      });
    }

    if (previousVibe && previousVibe !== vibe) {
      await redis(["HSET", vibeKey, visitorId, vibe]);
    } else {
      await redis(["HSET", vibeKey, visitorId, vibe]);
      await redis(["ZADD", indexKey, Math.floor(Date.now() / 1000) + CHECKIN_WINDOW_SECONDS, visitorId]);
    }

    await redis(["SET", visitorKey, vibe, "EX", CHECKIN_WINDOW_SECONDS]);

    const live = await getLive(placeId);

    return res.status(200).json({
      ok: true,
      alreadyCheckedIn: false,
      updatedVibe: Boolean(previousVibe),
      placeId,
      vibe,
      recordedAt: new Date().toISOString(),
      ...live
    });
  } catch (error) {
    console.error("Vibe check-in error:", error);
    return res.status(500).json({ error: "Unable to record vibe right now." });
  }
}
