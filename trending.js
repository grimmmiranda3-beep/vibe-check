// Vibely Check — lightweight Trending layer.
// Uses places already returned by the existing Google Places search; no new API or database required.
(function () {
  'use strict';

  const esc = (value) => String(value || '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
  const getPlaces = () => Array.isArray(window.__vibelyPlaces) ? window.__vibelyPlaces : [];

  function ensureStyles() {
    if (document.getElementById('vibely-trending-styles')) return;
    const style = document.createElement('style');
    style.id = 'vibely-trending-styles';
    style.textContent = `
      .trending-panel{margin:22px 0 0;background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 28px #21142c08}
      .trending-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}
      .trending-head h2{margin:0;font-size:21px}.trending-head p{margin:4px 0 0;color:var(--muted);font-size:13px}
      .trending-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .trend-card{border:1px solid var(--line);border-radius:17px;padding:15px;background:linear-gradient(180deg,#fff,#faf8fb)}
      .trend-rank{font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase;letter-spacing:.06em}
      .trend-name{font-size:16px;font-weight:900;margin:5px 0}.trend-score{font-size:22px;font-weight:950}.trend-meta{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.4}
      .trend-vibes{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.trend-vibe{background:#f5f1f7;border-radius:999px;padding:5px 8px;font-size:11px}
      @media(max-width:850px){.trending-grid{grid-template-columns:1fr}.trending-panel{padding:16px}}
    `;
    document.head.appendChild(style);
  }

  function rank(places) {
    return [...places].sort((a,b) => {
      const score = Number(b.score || 0) - Number(a.score || 0);
      const rating = Number(b.rating || 0) - Number(a.rating || 0);
      const reviews = Math.min(Number(b.userRatingCount || 0),1000) - Math.min(Number(a.userRatingCount || 0),1000);
      const open = Number(b.openNow === true) - Number(a.openNow === true);
      return score || rating || reviews || open;
    }).slice(0,3);
  }

  function render() {
    const places = rank(getPlaces());
    const host = document.getElementById('exploreContent');
    if (!host) return;
    let panel = document.getElementById('vibelyTrending');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'vibelyTrending';
      panel.className = 'trending-panel';
      host.appendChild(panel);
    }
    if (!places.length) {
      panel.innerHTML = '<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Search a place type and city to see what is standing out.</p></div></div>';
      return;
    }
    panel.innerHTML = `<div class="trending-head"><div><h2>🔥 Trending right now</h2><p>Top vibe scores from your current local search.</p></div><span class="meta">Live search results</span></div><div class="trending-grid">${places.map((p,i)=>`<div class="trend-card"><div class="trend-rank">#${i+1} Trending</div><div class="trend-name">${esc(p.emoji || '✨')} ${esc(p.name)}</div><div class="trend-score">${Number(p.score || 0).toFixed(1)}<span class="meta"> / 10</span></div><div class="trend-meta">${esc(p.type || 'Place')} · ${p.openNow===true?'Open now':p.openNow===false?'Closed now':'Status unavailable'}</div><div class="trend-vibes">${(p.tags||[]).slice(0,3).map(t=>`<span class="trend-vibe">${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>`;
  }

  window.VibelyTrending = { render };
  window.setInterval(render, 1500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
