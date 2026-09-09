// Vibely Check — Trending V2.
// Uses real anonymous check-ins from the existing /api/checkin endpoint.
// It observes the existing Google Places search response, so no new API or database is required.
(function () {
  'use strict';

  const esc = (value) => String(value || '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
  const VIBE_LABELS = { '😍':'Loved', '😊':'Good', '🔥':'Lively', '😌':'Chill', '🥳':'Fun' };
  let latestPlaces = [];
  let refreshTimer = null;

  function ensureStyles() {
    if (document.getElementById('vibely-trending-styles')) return;
    const style = document.createElement('style');
    style.id = 'vibely-trending-styles';
    style.textContent = `.trending-panel{margin:22px 0 0;background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 28px #21142c08}.trending-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}.trending-head h2{margin:0;font-size:21px}.trending-head p{margin:4px 0 0;color:var(--muted);font-size:13px}.trending-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.trend-card{border:1px solid var(--line);border-radius:17px;padding:15px;background:linear-gradient(180deg,#fff,#faf8fb)}.trend-rank{font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase;letter-spacing:.06em}.trend-name{font-size:16px;font-weight:900;margin:5px 0}.trend-score{font-size:22px;font-weight:950}.trend-meta{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.4}.trend-vibes{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.trend-vibe{background:#f5f1f7;border-radius:999px;padding:5px 8px;font-size:11px}.trend-live{margin-top:11px;font-size:12px;font-weight:850}.trend-empty{padding:14px;border-radius:15px;background:#faf8fb;color:var(--muted);font-size:13px;line-height:1.45}@media(max-width:850px){.trending-grid{grid-template-columns:1fr}.trending-panel{padding:16px}}`;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    const host = document.getElementById('exploreContent');
    if (!host) return null;
    let panel = document.getElementById('vibelyTrending');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'vibelyTrending';
      panel.className = 'trending-panel';
      host.appendChild(panel);
    }
    return panel;
  }

  function captureSearchResponse() {
    if (window.__vibelyTrendingFetchPatched) return;
    window.__vibelyTrendingFetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (...args) {
      const response = await originalFetch(...args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        if (/\/api\/search\?/.test(url)) {
          const clone = response.clone();
          const data = await clone.json();
          if (Array.isArray(data?.places)) {
            latestPlaces = data.places.slice(0, 12);
            scheduleRefresh();
          }
        }
      } catch (error) {
        console.warn('Vibely Trending search capture failed:', error);
      }
      return response;
    };
  }

  async function getActivity(place) {
    if (!place?.id) return { ...place, total: 0, average: null, dominant: null, counts: {} };
    try {
      const response = await fetch(`/api/checkin?placeId=${encodeURIComponent(place.id)}&_=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'activity unavailable');
      return { ...place, total: Number(data.total || 0), average: data.community?.average ?? null, dominant: data.community?.dominant || null, counts: data.counts || {}, confidence: Number(data.community?.influencePercent || 0) };
    } catch {
      return { ...place, total: 0, average: null, dominant: null, counts: {}, confidence: 0 };
    }
  }

  function trendValue(place) {
    // Real activity is the primary signal. Score and open status break ties only.
    const activity = Number(place.total || 0);
    const vibe = Number(place.average || 0);
    const openBonus = place.openNow === true ? 0.5 : 0;
    return activity * 10 + vibe + openBonus;
  }

  function fallbackEmoji(place) {
    const name = String(place?.name || '').toLowerCase();
    const type = String(place?.type || '').toLowerCase();
    if (/bar|club|nightlife/.test(`${name} ${type}`)) return '🔥';
    if (/coffee|cafe/.test(`${name} ${type}`)) return '😊';
    if (/restaurant|food|dining/.test(`${name} ${type}`)) return '😍';
    return '😌';
  }

  function renderLoading(panel) {
    panel.innerHTML = `<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Checking recent anonymous activity in your search.</p></div><span class="meta">Live</span></div><div class="trend-empty">Loading live check-ins…</div>`;
  }

  async function render() {
    ensureStyles();
    const panel = ensurePanel();
    if (!panel) return;
    if (!latestPlaces.length) {
      panel.innerHTML = `<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Search a place type and city to see what people are checking into.</p></div></div>`;
      return;
    }

    renderLoading(panel);
    const activity = await Promise.all(latestPlaces.map(getActivity));
    const active = activity.filter(p => p.total > 0).sort((a,b) => trendValue(b) - trendValue(a)).slice(0, 3);

    if (!active.length) {
      panel.innerHTML = `<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Real activity from your current search.</p></div><span class="meta">Live</span></div><div class="trend-empty"><b>Be the first to set the vibe.</b><br>No recent anonymous check-ins have been recorded for these places yet. Your check-in can be the one that starts the signal.</div>`;
      return;
    }

    panel.innerHTML = `<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Places with the most recent anonymous vibe activity.</p></div><span class="meta">Live</span></div><div class="trending-grid">${active.map((p,i) => {
      const dominant = p.dominant || fallbackEmoji(p);
      const label = VIBE_LABELS[dominant] || 'Current vibe';
      const score = p.average != null ? Number(p.average).toFixed(1) : '—';
      const status = p.openNow === true ? 'Open now' : p.openNow === false ? 'Closed now' : 'Place status unavailable';
      const tags = Array.isArray(p.tags) ? p.tags : [];
      return `<div class="trend-card"><div class="trend-rank">#${i+1} Trending</div><div class="trend-name">${esc(dominant)} ${esc(p.name)}</div><div class="trend-score">${score}<span class="meta"> / 10</span></div><div class="trend-meta">${esc(p.type || 'Place')} · ${esc(status)}</div><div class="trend-live">⚡ ${p.total} recent check-in${p.total === 1 ? '' : 's'} · ${esc(label)}</div><div class="trend-vibes">${tags.slice(0,3).map(t => `<span class="trend-vibe">${esc(t)}</span>`).join('')}</div></div>`;
    }).join('')}</div>`;
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(render, 250);
  }

  window.VibelyTrending = { render, refresh: scheduleRefresh };
  captureSearchResponse();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
