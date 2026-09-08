(() => {
  const KEY = 'vibeCheck.checkins.v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const placeKey = () => {
    const title = document.querySelector('#modalBody h2')?.textContent?.trim() || 'Unknown place';
    const address = document.querySelector('#modalBody .meta')?.textContent?.trim() || '';
    return `${title}|${address}`;
  };
  const countsFor = key => read()[key] || {};
  const total = counts => Object.values(counts).reduce((a,b) => a + b, 0);
  const render = () => {
    const key = placeKey();
    const counts = countsFor(key);
    let box = document.querySelector('#checkinBox');
    if (!box) {
      const label = [...document.querySelectorAll('#modalBody .label')].find(x => x.textContent.includes('What vibe'));
      if (!label) return;
      box = document.createElement('div');
      box.id = 'checkinBox';
      box.style.cssText = 'margin:16px 0;padding:15px;border:1px solid #ece8ee;border-radius:18px;background:#fff';
      label.parentNode.insertBefore(box, label);
    }
    const entries = [['😍','Love it'],['😊','Good'],['🔥','Lively'],['😌','Chill'],['🥳','Fun']];
    const sum = total(counts);
    box.innerHTML = `<div style="font-weight:900;font-size:15px">People here right now</div><div style="font-size:12px;color:#77727b;margin-top:4px">${sum ? `${sum} vibe check${sum === 1 ? '' : 's'} from this device` : 'Be the first to add a vibe.'}</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">${entries.map(([e,l]) => `<span style="padding:7px 9px;border-radius:999px;background:#f5f1f7;font-size:12px">${e} ${counts[e] || 0} ${l}</span>`).join('')}</div>`;
  };
  const save = () => {
    const key = placeKey();
    const data = read();
    data[key] = data[key] || {};
    data[key][window.selectedEmoji || '😍'] = (data[key][window.selectedEmoji || '😍'] || 0) + 1;
    write(data);
    render();
    const toast = document.querySelector('#toast');
    if (toast) { toast.textContent = 'Your vibe was added 💜'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
  };
  window.addEventListener('DOMContentLoaded', () => {
    const wait = setInterval(() => {
      if (typeof window.openModal === 'function') {
        clearInterval(wait);
        const originalOpen = window.openModal;
        window.openModal = async function(i) {
          await originalOpen(i);
          setTimeout(render, 80);
        };
        window.saveVibe = save;
      }
    }, 20);
    setTimeout(() => clearInterval(wait), 10000);
  });
})();
