// Vibe Check — Share Vibe launch feature.
(function () {
  'use strict';

  const esc = (value) => String(value || '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));

  function appShareUrl(name) {
    const url = new URL(window.location.origin + '/');
    url.searchParams.set('place', name || 'this place');
    return url.href;
  }

  async function share(place) {
    if (!place) return { ok: false, reason: 'missing-place' };
    const name = place.name || 'this place';
    const score = Number(place.score);
    const scoreText = Number.isFinite(score) ? ` ${score.toFixed(1)}/10` : '';
    const emoji = place.emoji || '✨';
    const url = appShareUrl(name);
    const text = `${emoji} The vibe at ${name} is${scoreText} right now. Check it out on Vibe Check.`;

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

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast('Vibe link copied!');
      if (typeof window.track === 'function') window.track('vibe_shared', { placeName: name, method: 'clipboard' });
      return { ok: true, method: 'clipboard' };
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = `${text} ${url}`;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      const copied = document.execCommand('copy');
      area.remove();
      if (copied) {
        showToast('Vibe link copied!');
        if (typeof window.track === 'function') window.track('vibe_shared', { placeName: name, method: 'clipboard-fallback' });
      }
      return { ok: copied, method: copied ? 'clipboard-fallback' : 'failed' };
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__vibelyToastTimer);
    window.__vibelyToastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function makeButton(place) {
    const button = document.createElement('button');
    button.className = 'small-btn vibely-share-btn';
    button.type = 'button';
    button.textContent = '↗ Share Vibe';
    button.addEventListener('click', () => share(place));
    return button;
  }

  function addCardButtons() {
    document.querySelectorAll('.place').forEach((card) => {
      if (card.querySelector('.vibely-share-btn')) return;
      const actions = card.querySelector('.place-actions');
      if (!actions) return;
      const name = card.querySelector('h3')?.textContent?.trim() || 'this place';
      const scoreText = card.querySelector('.score')?.textContent || '';
      const score = parseFloat(scoreText.replace(/[^0-9.]/g, ''));
      const emoji = scoreText.trim().split(/\s+/)[0] || '✨';
      actions.appendChild(makeButton({ name, score, emoji }));
    });
  }

  function addModalButton() {
    const body = document.getElementById('modalBody');
    if (!body || body.querySelector('.vibely-share-modal-btn')) return;
    const heading = body.querySelector('h2');
    if (!heading) return;
    const name = heading.textContent.trim();
    const score = parseFloat((body.querySelector('.bigscore')?.textContent || '').replace(/[^0-9.]/g, ''));
    const button = makeButton({ name, score, emoji: '✨' });
    button.classList.add('vibely-share-modal-btn');
    button.style.width = '100%';
    button.style.marginTop = '10px';
    body.appendChild(button);
  }

  window.VibelyShare = { share };

  const observer = new MutationObserver(() => {
    addCardButtons();
    addModalButton();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    addCardButtons();
    addModalButton();
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
