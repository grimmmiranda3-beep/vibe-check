(() => {
  const KEY = 'vibeCheck.checkins.v3';
  const entries = [
    ['😍', 'Love it'],
    ['😊', 'Good'],
    ['🔥', 'Lively'],
    ['😌', 'Chill'],
    ['🥳', 'Fun']
  ];

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  };
  const write = data => localStorage.setItem(KEY, JSON.stringify(data));
  const placeKey = () => {
    const title = document.querySelector('#modalBody h2')?.textContent?.trim() || 'Unknown place';
    const address = document.querySelector('#modalBody .meta')?.textContent?.trim() || '';
    return `${title}|${address}`;
  };
  const total = counts => Object.values(counts || {}).reduce((a, b) => a + Number(b || 0), 0);

  const render = (community = null, message = '') => {
    const key = placeKey();
    const local = read()[key] || {};
    const counts = community?.counts || local;
    const sum = community?.total ?? total(counts);
    let box = document.querySelector('#checkinBox');

    if (!box) {
      const label = [...document.querySelectorAll('#modalBody .label')]
        .find(x => x.textContent.includes('What vibe'));
      if (!label) return;
      box = document.createElement('div');
      box.id = 'checkinBox';
      box.style.cssText = 'margin:16px 0;padding:17px;border:1px solid #ece8ee;border-radius:18px;background:#fff';
      label.parentNode.insertBefore(box, label);
    }

    const label = sum === 1 ? '1 check-in' : `${sum} check-ins`;
    const source = community?.available
      ? 'People checking in anonymously'
      : 'Your check-ins on this device';

    box.innerHTML = `
      <div style="font-weight:900;font-size:17px">People here right now</div>
      <div style="font-size:13px;color:#77727b;margin-top:4px">${label} · ${source}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">
        ${entries.map(([e, l]) => `<span style="padding:8px 10px;border-radius:999px;background:#f5f1f7;font-size:12px">${e} ${Number(counts[e] || 0)} ${l}</span>`).join('')}
      </div>
      ${community?.available && sum ? `<div style="font-size:12px;color:#77727b;margin-top:11px">Live community activity is based on anonymous Vibe Check-ins.</div>` : ''}
      ${message ? `<div style="font-size:11px;color:#77727b;margin-top:10px">${message}</div>` : ''}
    `;
  };

  const getCommunity = async placeId => {
    try {
      const response = await fetch(`/api/checkin?placeId=${encodeURIComponent(placeId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Community data unavailable.');
      return data;
    } catch (error) {
      console.error('Vibe Check community read error:', error);
      return null;
    }
  };

  const postCheckin = async (placeId, vibe) => {
    const response = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, vibe })
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || 'Unable to record vibe.');
    return data;
  };

  const save = async () => {
    const key = placeKey();
    const vibe = window.selectedEmoji || '😍';
    const data = read();
    data[key] = data[key] || {};
    data[key][vibe] = Number(data[key][vibe] || 0) + 1;
    write(data);

    render(null, 'Saving your anonymous vibe check-in…');

    try {
      const result = await postCheckin(key, vibe);
      const community = await getCommunity(key);
      render(community || { available: true, counts: { [vibe]: Number(result.count || 1) }, total: Number(result.count || 1) }, 'Your vibe was recorded anonymously. 💜');
    } catch (error) {
      render(null, 'Saved on this device. Community totals will appear once server storage is connected.');
      console.error('Vibe Check check-in API error:', error);
    }

    const toast = document.querySelector('#toast');
    if (toast) {
      toast.textContent = 'Your vibe was added 💜';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  };

  const refreshCommunity = async () => {
    const key = placeKey();
    render();
    const community = await getCommunity(key);
    if (community) render(community);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const wait = setInterval(() => {
      if (typeof window.openModal === 'function') {
        clearInterval(wait);
        const originalOpen = window.openModal;
        window.openModal = async function(i) {
          await originalOpen(i);
          setTimeout(refreshCommunity, 100);
        };
        window.saveVibe = save;
      }
    }, 20);
    setTimeout(() => clearInterval(wait), 10000);
  });
})();
