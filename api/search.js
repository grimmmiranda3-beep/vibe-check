function redisConfig() {
  return {
    url: process.env.STORAGE_URL || process.env.STORAGE_KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.STORAGE_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}

async function redis(command) {
  const { url, token } = redisConfig();
  if (!url || !token) return null;
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  if (!response.ok) throw new Error(`Storage request failed (${response.status})`);
  return response.json();
}

async function rateLimit(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim().slice(0, 100);
  const key = `vibe-check:rate:search:${ip}`;
  const result = await redis(["INCR", key]);
  if (!result) return true;
  const count = Number(result.result || 0);
  if (count === 1) await redis(["EXPIRE", key, 60]);
  return count <= 30;
}

function isCityOrZipQuery(q) {
  const s = q.trim();
  return /^\d{5}(?:-\d{4})?$/.test(s) || /^[A-Za-z][A-Za-z .'-]+(?:,\s*[A-Za-z]{2})?$/.test(s);
}

// Detect category intent anywhere in the query. Category searches are strict:
// Google must return the requested place type instead of broad nearby discovery.
function getSearchType(q) {
  const s = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (/\b(restaurants?|dining|places to eat|food spots?|food)\b/.test(s)) return "restaurant";
  if (/\b(coffee|coffee shops?|coffeehouses?|cafes?|cafés?)\b/.test(s)) return "cafe";
  if (/\b(bars?|pubs?|nightlife|night clubs?|nightclubs?)\b/.test(s)) return "bar";
  if (/\b(parks?|playgrounds?|nature parks?)\b/.test(s)) return "park";
  if (/\b(gyms?|fitness centers?|fitness clubs?|fitness)\b/.test(s)) return "gym";
  if (/\b(bakeries?|bakery)\b/.test(s)) return "bakery";
  if (/\b(hotels?|motels?|lodging)\b/.test(s)) return "hotel";
  if (/\b(museums?)\b/.test(s)) return "museum";
  return null;
}

// Remove the category keyword before fallback text searches. This is only used
// if strict type filtering returns no results, and the result is still checked
// against the requested category before it is returned to the client.
function stripCategoryWords(q, type) {
  const patterns = {
    restaurant: /\b(restaurants?|dining|places to eat|food spots?|food)\b/gi,
    cafe: /\b(coffee shops?|coffeehouses?|cafes?|cafés?|coffee)\b/gi,
    bar: /\b(bars?|pubs?|nightlife|night clubs?|nightclubs?)\b/gi,
    park: /\b(parks?|playgrounds?|nature parks?)\b/gi,
    gym: /\b(gyms?|fitness centers?|fitness clubs?|fitness)\b/gi,
    bakery: /\b(bakeries?|bakery)\b/gi,
    hotel: /\b(hotels?|motels?|lodging)\b/gi,
    museum: /\b(museums?)\b/gi
  };
  return q.replace(patterns[type] || /$^/, " ").replace(/\s+/g, " ").trim();
}

function matchesRequestedType(place, type) {
  const primary = String(place?.primaryType || "").toLowerCase();
  const name = String(place?.displayName?.text || "").toLowerCase();
  const address = String(place?.formattedAddress || "").toLowerCase();
  const text = `${primary} ${name} ${address}`;
  const rules = {
    restaurant: /restaurant|american_restaurant|italian_restaurant|mexican_restaurant|chinese_restaurant|japanese_restaurant|hamburger_restaurant|pizza_restaurant|steak_house|seafood_restaurant|barbecue_restaurant|meal_takeaway|meal_delivery|food_court/,
    cafe: /cafe|coffee_shop|coffeehouse/,
    bar: /bar|pub|night_club|wine_bar|cocktail_bar|brewery/,
    park: /park|playground|recreation_area|national_park/,
    gym: /gym|fitness_center|sports_club/,
    bakery: /bakery|pastry_shop|confectionery/,
    hotel: /hotel|motel|lodging|resort/,
    museum: /museum|art_gallery|history_museum|science_museum/
  };
  if (rules[type]?.test(primary)) return true;
  // Name fallback helps when Google's primary type is overly generic.
  const nameRules = {
    restaurant: /restaurant|kitchen|grill|bistro|diner|eatery|taqueria|pizzeria|steakhouse|sushi/,
    cafe: /coffee|cafe|café|espresso|roaster/,
    bar: /bar|pub|brewery|taproom|lounge|nightclub/,
    park: /park|playground/,
    gym: /gym|fitness|athletic/,
    bakery: /bakery|bake shop|pastry|patisserie/,
    hotel: /hotel|motel|inn|resort|lodging/,
    museum: /museum/ 
  };
  return Boolean(nameRules[type]?.test(name));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!(await rateLimit(req))) return res.status(429).json({ error: "Too many searches. Please wait a minute and try again." });
  } catch (error) { console.error("Search rate-limit error:", error); }

  const rawQuery = String(req.query.query || req.query.q || "").trim();
  if (!rawQuery) return res.status(400).json({ error: "Please provide a city, ZIP code, or place search." });
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Google Places API key is not configured." });

  const normalized = rawQuery.replace(/\s*,\s*/g, ", ");
  const searchType = getSearchType(rawQuery);
  const locationNormalized = normalized.replace(/\b([A-Za-z][A-Za-z .'-]+),\s*([A-Za-z]{2})\s*$/i, "in $1, $2");
  const queries = [...new Set([rawQuery, normalized, locationNormalized, normalized.replace(/\s*,\s*/g, " in ")])];
  const cityDiscovery = !searchType && isCityOrZipQuery(rawQuery);

  async function searchGoogle(textQuery, pageSize = 10, includedType = null) {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.primaryType,places.location,places.photos,places.currentOpeningHours" },
      body: JSON.stringify({ textQuery, pageSize, languageCode: "en", regionCode: "US", ...(includedType ? { includedType, strictTypeFiltering: true } : {}) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Google Places search failed.");
    return data.places || [];
  }

  async function resolvePhotoUri(photoName) {
    if (!photoName) return "";
    try {
      const response = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&maxHeightPx=650&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`, { headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.photoUri) return data.photoUri;
    } catch (error) { console.error("Google photo URI request failed:", error); }
    return "";
  }

  try {
    let googlePlaces = [];
    let lastError = null;

    if (cityDiscovery) {
      const categoryQueries = [`popular restaurants in ${normalized}`, `coffee shops in ${normalized}`, `bars and nightlife in ${normalized}`, `parks and recreation in ${normalized}`, `things to do and entertainment in ${normalized}`];
      const results = await Promise.all(categoryQueries.map(q => searchGoogle(q, 6).catch(error => { lastError = error; return []; })));
      const seen = new Set();
      googlePlaces = results.flat().filter(place => { if (!place?.id || seen.has(place.id)) return false; seen.add(place.id); return true; }).slice(0, 24);
    } else {
      for (const query of queries) {
        try {
          googlePlaces = await searchGoogle(query, 10, searchType);
          if (googlePlaces.length) break;
        } catch (error) { lastError = error; }
      }
      // Strict type filtering can occasionally be too restrictive for legitimate
      // businesses. Try one text-only fallback, but NEVER return a mismatched type.
      if (!googlePlaces.length && searchType) {
        const stripped = stripCategoryWords(rawQuery, searchType);
        const fallbackQuery = stripped ? `${searchType} ${stripped}` : rawQuery;
        try {
          const fallbackPlaces = await searchGoogle(fallbackQuery, 10);
          googlePlaces = fallbackPlaces.filter(place => matchesRequestedType(place, searchType));
        } catch (error) { lastError = error; }
      }
    }

    if (!googlePlaces.length && lastError) return res.status(502).json({ error: lastError.message });

    const places = await Promise.all(googlePlaces.map(async place => {
      const firstPhoto = place.photos?.[0], openingHours = place.currentOpeningHours || {};
      return { id: place.id, name: place.displayName?.text || "Unknown place", address: place.formattedAddress || "", rating: place.rating ?? null, userRatingCount: place.userRatingCount ?? 0, type: place.primaryType || "Place", website: place.websiteUri || "", url: place.googleMapsUri || "", latitude: place.location?.latitude ?? null, longitude: place.location?.longitude ?? null, openNow: openingHours.openNow ?? null, weekdayDescriptions: openingHours.weekdayDescriptions || [], photoName: await resolvePhotoUri(firstPhoto?.name || ""), photoAttributions: (firstPhoto?.authorAttributions || []).map(a => ({ displayName: a.displayName || "Google Maps contributor", uri: a.uri || "" })) };
    }));

    places.sort((a, b) => { const openRank = value => value === true ? 0 : value === null ? 1 : 2; const rankDiff = openRank(a.openNow) - openRank(b.openNow); if (rankDiff !== 0) return rankDiff; return (Number(b.rating) || 0) - (Number(a.rating) || 0); });
    return res.status(200).json({ places, count: places.length, cityDiscovery, searchType });
  } catch (error) {
    console.error("Google Places search error:", error);
    return res.status(500).json({ error: "Something went wrong while searching for places." });
  }
}
