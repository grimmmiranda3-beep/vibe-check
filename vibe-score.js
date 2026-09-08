// Vibe Check — Vibe Score v2
// Scores are intentionally transparent and bounded. This is an initial model;
// Vibe Check community data can be added later as a separate signal.
function calculateVibeScore(place) {
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

  // Place-type/context signal. Weighted 15%. This is deliberately modest so
  // category assumptions cannot dominate the score.
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

  // Convert 0–100 into the consumer-facing 5.0–9.9 scale.
  return Number((5 + weighted / 20).toFixed(1));
}

if (typeof window !== 'undefined') window.calculateVibeScore = calculateVibeScore;
if (typeof module !== 'undefined') module.exports = { calculateVibeScore };
