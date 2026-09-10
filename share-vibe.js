// Vibe Check — Share Vibe launch feature.
(function () {
  'use strict';

  const esc = (value) => String(value || '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));

  function appShareUrl(name) {
    const url = new URL(window.location.origin + '/');
    url.searchParams.set('place', name || 'this place');
    return url.href;
  }

  function buildShareContent(place) {
    const name = place.name || 'this place';
    const score = Number(place.score);
    const scoreText = Number.isFinite(score) ? ` ${score.toFixed(1)}/10` : '';
    const emoji = place.emoji || '✨';
    const url = appShareUrl(name);
    const text = `${emoji} The vibe at ${name} is${scoreText} right now. Check it out on Vibe Check. ${url}`;
    return { name, score, emoji, url, text };
  }

  async function copyLink(place) {
    if (!place) return { ok: false, reason: 'missing-place' };
    const { name, url } = buildShareContent(place);

    try {
      await navigator.clipboard.writeText(url);
      showToast('Vibe Check link copied!');
      if (typeof window.track === 'function') window.track('vibe_link_copied', { placeName: name, method: 'clipboard' });
      return { ok: true, method: 'clipboard' };
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = url;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      const copied = document.execCommand('copy');
      area.remove();
      if (copied) {
        showToast('Vibe Check link copied!');
        if (typeof window.track === 'function') window.track('vibe_link_copied', { placeName: name, method: 'clipboard-fallback' });
      }
      return { ok: copied, method: copied ? 'clipboard-fallback' : 'failed' };
    }
  }

  async function share(place) {
    if (!place) return { ok: false, reason: 'missing-place' };
    const { name, score, emoji, url, text } = buildShareContent(place);

    if (typeof window.track === 'function') window.track('vibe_share_opened', { placeName: name, method: 'native-or-clipboard' });

    if (navigator.share) {
      try {
        await navigator.share({ title: `Vibe Check — ${name}`, text, url });
        if (typeof window.track === 'function') window.track('vibe_shared', { placeName: name, method: 'native' });
        return { ok: true, method: 'native' };
      } catch (error) {
        if (error && error.name === 'AbortError') return { ok: false, reason: 'cancelled' };
      }
    }

    return copyLink(place);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__vibelyToastTimer);
    window.__vibelyToastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function makeButton(place, kind) {
    const button = document.createElement('button');
    button.className = `small-btn ${kind === 'copy' ? 'vibely-copy-link-btn' : 'vibely-share-btn'}`;
    button.type = 'button';
    button.textContent = kind === 'copy' ? '🔗 Copy Link' : '↗ Share Vibe';
    button.addEventListener('click', () => kind === 'copy' ? copyLink(place) : share(place));
    return button;
  }

  function addCardButtons() {
    document.querySelectorAll('.place').forEach((card) => {
      const actions = card.querySelector('.place-actions');
      if (!actions) return;
      if (actions.querySelector('.vibely-share-btn')) return;
      const name = card.querySelector('h3')?.textContent?.trim() || 'this place';
      const scoreText = card.querySelector('.score')?.textContent || '';
      const score = parseFloat(scoreText.replace(/[^0-9.]/g, ''));
      const emoji = scoreText.trim().split(/\s+/)[0] || '✨';
      actions.appendChild(makeButton({ name, score, emoji }, 'share'));
      actions.appendChild(makeButton({ name, score, emoji }, 'copy'));
    });
  }

  function addModalButton() {
    const body = document.getElementById('modalBody');
    if (!body || body.querySelector('.vibely-share-modal-btn')) return;
    const heading = body.querySelector('h2');
    if (!heading) return;
    const name = heading.textContent.trim();
    const score = parseFloat((body.querySelector('.bigscore')?.textContent || '').replace(/[^0-9.]/g, ''));
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginTop = '10px';
    const shareButton = makeButton({ name, score, emoji: '✨' }, 'share');
    const copyButton = makeButton({ name, score, emoji: '✨' }, 'copy');
    shareButton.classList.add('vibely-share-modal-btn');
    copyButton.classList.add('vibely-copy-modal-btn');
    shareButton.style.flex = '1';
    copyButton.style.flex = '1';
    actions.appendChild(shareButton);
    actions.appendChild(copyButton);
    body.appendChild(actions);
  }

  // Shared links use /?place=Restaurant%20Name.
  // Wait for the main app's search handler to be ready. Mobile Safari can
  // render the input/button before the app has attached its click listener.
  function openSharedPlace() {
    const place = new URLSearchParams(window.location.search).get('place');
    if (!place || window.__vibelySharedSearchStarted) return;
    window.__vibelySharedSearchStarted = true;

    let attempts = 0;
    const maxAttempts = 18;

    const run = () => {
      attempts += 1;
      const input = document.getElementById('search');
      const button = document.getElementById('searchBtn');
      const places = document.getElementById('places');
      const resultCount = document.getElementById('resultCount');
      if (!input || !button) {
        if (attempts < maxAttempts) setTimeout(run, 300);
        return;
      }

      input.value = place;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // The delay gives the normal page scripts time to finish attaching
      // the search listener before the shared-link click fires.
      setTimeout(() => {
        button.click();
        if (typeof window.track === 'function') window.track('shared_place_opened', { placeName: place });
      }, 150);

      // If the first click raced startup, retry. Stop as soon as the normal
      // search UI shows loading, a place, an error, or a changed result count.
      setTimeout(() => {
        const hasActivity = places && (
          places.querySelector('.loading, .place, .error') ||
          !/Search to find places/i.test(resultCount?.textContent || '')
        );
        if (!hasActivity && attempts < maxAttempts) run();
      }, 850);
    };

    // Prevents a race between this enhancement and the main app on iPhone.
    setTimeout(run, 700);
  }

  window.VibelyShare = { share, copyLink };

  const observer = new MutationObserver(() => {
    addCardButtons();
    addModalButton();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    addCardButtons();
    addModalButton();
    openSharedPlace();
    if (!document.getElementById('vibely-trending-script')) {
      const script = document.createElement('script');
      script.id = 'vibely-trending-script';
      script.src = '/trending.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
