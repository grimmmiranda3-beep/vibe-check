// Vibely Check — isolated sharing helper.
// Safe to load on the existing app without changing the current search/check-in flow.
(function () {
  'use strict';

  window.VibelyShare = {
    async share(place) {
      if (!place) return { ok: false, reason: 'missing-place' };
      const name = place.name || 'this place';
      const score = place.vibeScore ?? place.score;
      const emoji = place.vibeEmoji || place.emoji || '✨';
      const scoreText = Number.isFinite(Number(score)) ? ` ${Number(score).toFixed(1)}/10` : '';
      const url = place.url || `${window.location.origin}/?place=${encodeURIComponent(place.id || name)}`;
      const text = `${emoji} The vibe at ${name} is${scoreText} right now. Check it out on Vibely Check.`;

      if (navigator.share) {
        try {
          await navigator.share({ title: `Vibely Check — ${name}`, text, url });
          return { ok: true, method: 'native' };
        } catch (error) {
          if (error && error.name === 'AbortError') return { ok: false, reason: 'cancelled' };
        }
      }

      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        return { ok: true, method: 'clipboard' };
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = `${text} ${url}`;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.appendChild(area); area.select();
        const copied = document.execCommand('copy');
        area.remove();
        return { ok: copied, method: copied ? 'clipboard-fallback' : 'failed' };
      }
    }
  };
})();
