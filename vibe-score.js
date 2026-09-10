// Vibe Check — Vibe Score v3
// Scores are transparent and bounded. Google signals provide the baseline;
// anonymous Vibe Check community activity can influence the score gradually.
const COMMUNITY_VIBE_VALUES = {
  "😍": 9.7, // Loved
  "😊": 8.9, // Good
  "🔥": 9.5, // Lively
  "😌": 8.6, // Relaxed
  "🥳": 9.3, // Fun
  "😕": 4.5  // Not my vibe
};

function communityConfidence(total) {
  const count = Math.max(0, Number(total) || 0);
  if (count < 1) return 0;
  if (count < 5) return 0.05;
  if (count < 20) return 0.10;
  if (count < 50) return 0.20;
  return 0.30;
}

function calculateCommunitySignal(community) {
  const counts = community?.counts || {};
  const total = Math.max(0, Number(community?.total) || 0);
  if (!total) {
    return { available: false, total: 0, confidence: 0, average: null, dominant: null };
  }

  let weightedTotal = 0;
  for (const [vibe, count] of Object.entries(counts)) {
    if (!Object.prototype.hasOwnProperty.call(COMMUNITY_VIBE_VALUES, vibe)) continue;
    weightedTotal += COMMUNITY_VIBE_VALUES[vibe] * Math.max(0, Number(count) || 0);
  }

  const average = weightedTotal > 0 ? Number((weightedTotal / total).toFixed(1)) : null;
  const dominant = Object.entries(counts)
    .filter(([vibe]) => Object.prototype.hasOwnProperty.call(COMMUNITY_VIBE_VALUES, vibe))
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || null;

  return {
    available: Boolean(average),
    total,
    confidence: communityConfidence(total),
    average,
    dominant
  };
}

function calculateVibeScore(place, community = null) {
  const rating = Math.max(0, Math.min(5, Number(place.rating) || 0));
  const reviewCount = Math.max(0, Number(place.userRatingCount) || 0);
  const openNow = place.openNow;
  const type = String(place.type || '').toLowerCase();
  const name = String(place.name || '').toLowerCase();
  const tags = Array.isArray(place.tags) ? place.tags : [];

  // Google rating: 0–100, weighted 30%.
  const ratingScore = rating ? (rating / 5) * 100 : 50;

  // Review confidence: logarithmic so 20 reviews helps, but 20,000 reviews
  // does not overwhelm every other signal. Weighted 20%.
  const reviewScore = reviewCount
    ? Math.min(100, Math.round(Math.log10(reviewCount + 1) * 50))
    : 35;

  // Current availability: open gets a modest advantage; unknown stays neutral.
  // Weighted 15%.
  const availabilityScore = openNow === true ? 100 : openNow === false ? 45 : 70;

  // Place-type/context signal. Weighted 15%.
  let contextScore = 70;
  if (/restaurant|food|dining/.test(type)) contextScore = 82;
  else if (/cafe|coffee/.test(type)) contextScore = 80;
  else if (/bar|nightclub|club/.test(type)) contextScore = 78;
  else if (/park|playground|recreation/.test(type)) contextScore = 80;
  else if (/gym|fitness/.test(type)) contextScore = 76;
  else if (/bakery|dessert/.test(type)) contextScore = 81;
  else if (/hotel|lodging/.test(type)) contextScore = 77;
  else if (/museum/.test(type)) contextScore = 79;
  if (/music|jazz|live/.test(name)) contextScore += 3;
  contextScore = Math.min(100, contextScore);

  // Vibe characteristics: reward richer, relevant classification without
  // pretending tags are direct user sentiment. Weighted 20%.
  const tagScore = Math.min(100, 55 + tags.length * 12);

  const weighted =
    ratingScore * 0.30 +
    reviewScore * 0.20 +
    availabilityScore * 0.15 +
    contextScore * 0.15 +
    tagScore * 0.20;

  const baseline = Number((5 + weighted / 20).toFixed(1));
  const signal = calculateCommunitySignal(community);

  // Community activity now has a small influence from the very first check-in.
  // 1–4 have light influence, 5–19 moderate influence, 20–49 stronger influence,
  // and 50+ provide the strongest community signal (still capped at 30%).
  if (!signal.available || signal.confidence === 0) return baseline;

  return Number((baseline * (1 - signal.confidence) + signal.average * signal.confidence).toFixed(1));
}

function getScoreDetails(place, community = null) {
  const baseline = calculateVibeScore(place, null);
  const signal = calculateCommunitySignal(community);
  const score = calculateVibeScore(place, community);

  return {
    score,
    baseline,
    community: signal,
    communityInfluencePercent: Math.round(signal.confidence * 100)
  };
}

if (typeof window !== 'undefined') {
  window.calculateVibeScore = calculateVibeScore;
  window.calculateCommunitySignal = calculateCommunitySignal;
  window.getScoreDetails = getScoreDetails;
}
if (typeof module !== 'undefined') {
  module.exports = {
    calculateVibeScore,
    calculateCommunitySignal,
    getScoreDetails
  };
}
