// Vibe Check — live social discovery layer.
// Keeps the product vibe-first: no stars, no review ranking, no Yelp-style language.
(function(){
  'use strict';
  const LABELS={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};
  const LABEL_EMOJIS=['😍','😊','🔥','😌','🥳','😕'];
  let observer;

  function injectStyles(){
    if(document.getElementById('vibe-wow-styles')) return;
    const s=document.createElement('style'); s.id='vibe-wow-styles';
    s.textContent=`
      .wow-strip{margin:14px 0 0;padding:15px 16px;border:1px solid #eadff4;border-radius:20px;background:linear-gradient(100deg,#fff,#faf5ff 52%,#fff5fb);display:flex;align-items:center;gap:12px;overflow:auto;scrollbar-width:none}.wow-strip::-webkit-scrollbar{display:none}
      .wow-title{font-size:12px;font-weight:950;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;color:#7c3aed}.wow-chip{border:1px solid #e9e2ed;background:#fff;border-radius:999px;padding:8px 12px;white-space:nowrap;font-size:12px;font-weight:850;cursor:pointer;transition:.16s}.wow-chip:hover{transform:translateY(-1px);border-color:#cdb5e8}.wow-chip b{margin-left:4px}.wow-chip.hot{background:#17151a;color:#fff;border-color:#17151a}
      .wow-kicker{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:.06em}.wow-dot{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 5px #16a34a18;animation:wowPulse 1.8s infinite}@keyframes wowPulse{50%{box-shadow:0 0 0 9px #16a34a05}}
      .trend-card.wow-hot{position:relative;overflow:hidden}.trend-card.wow-hot:after{content:'LIVE';position:absolute;right:12px;top:12px;font-size:9px;font-weight:950;letter-spacing:.08em;color:#16a34a;background:#ecfdf3;border-radius:999px;padding:5px 7px}
      .trend-pulse{display:flex;align-items:center;gap:5px}.wow-bar{height:5px;border-radius:99px;background:#eeeaf0;overflow:hidden;margin-top:9px}.wow-bar span{display:block;height:100%;width:var(--w);background:linear-gradient(90deg,#7c3aed,#ec4899);border-radius:99px}
      .wow-note{margin-top:12px;font-size:11px;color:var(--muted);line-height:1.45}.wow-empty{padding:16px;border-radius:16px;background:#faf8fb;border:1px dashed #ddd2e7;color:var(--muted);font-size:13px;line-height:1.5}
      @media(max-width:850px){.wow-strip{margin-top:10px;padding:12px}.wow-title{display:none}}
    `;
    document.head.appendChild(s);
  }

  function panel(){return document.getElementById('vibelyTrending');}

  function buildStrip(active){
    const counts={}; LABEL_EMOJIS.forEach(e=>counts[e]=0);
    active.forEach(p=>Object.entries(p.counts||{}).forEach(([v,n])=>{if(v in counts) counts[v]+=Number(n||0)}));
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    if(!total) return '<div class="wow-strip"><span class="wow-title">Vibe radar</span><span class="wow-empty" style="padding:8px 11px;border:0">No live pulse yet — someone has to set the vibe.</span></div>';
    const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const top=ranked[0]?.[0];
    return '<div class="wow-strip"><span class="wow-title">Vibe radar</span>'+ranked.filter(([,n])=>n>0).map(([v,n])=>`<button class="wow-chip ${v===top?'hot':''}" data-vibe-filter="${v}">${v} ${LABELS[v]} <b>${n}</b></button>`).join('')+'</div>';
  }

  function decorate(){
    injectStyles(); const p=panel(); if(!p) return;
    const cards=[...p.querySelectorAll('.trend-card')];
    if(!cards.length) return;
    cards.forEach((card,i)=>{
      if(i===0) card.classList.add('wow-hot');
      const pulse=card.querySelector('.trend-pulse');
      const match=pulse?.textContent.match(/(\d+)/); const n=match?Number(match[1]):0;
      if(pulse && !card.querySelector('.wow-bar')) pulse.insertAdjacentHTML('afterend',`<div class="wow-bar" aria-label="Live activity strength"><span style="--w:${Math.min(100,30+n*20)}%"></span></div>`);
    });
    let strip=p.querySelector('.wow-strip');
    if(!strip){
      const all=window.__vibeWowPlaces||[];
      strip=document.createElement('div'); strip.innerHTML=buildStrip(all);
      p.appendChild(strip.firstElementChild);
      p.querySelectorAll('[data-vibe-filter]').forEach(btn=>btn.addEventListener('click',()=>{
        const vibe=btn.dataset.vibeFilter;
        const matching=all.filter(x=>String(x.dominant||'')===vibe || Number((x.counts||{})[vibe]||0)>0);
        if(matching[0]){
          const target=p.querySelector(`[data-id="${CSS.escape(String(matching[0].id))}"]`);
          target?.scrollIntoView({behavior:'smooth',block:'center'});
          target?.classList.add('wow-hot');
        }
      }));
    }
    if(!p.querySelector('.wow-note')){
      const note=document.createElement('div'); note.className='wow-note'; note.innerHTML='<span class="wow-kicker"><span class="wow-dot"></span>Live pulse</span> Activity is based on anonymous check-ins from the last 3 hours. Vibe Check does not rank places by old reviews.'; p.appendChild(note);
    }
  }

  async function collect(){
    const panel=window.__vibeWowPlaces;
    if(!Array.isArray(panel)||!panel.length) return;
    // The trending module owns the activity fetch. We only mirror its rendered cards.
    setTimeout(decorate,350);
  }

  function watch(){
    if(observer) return;
    const host=document.getElementById('exploreContent'); if(!host) return;
    observer=new MutationObserver(()=>{if(panel()) collect()});
    observer.observe(host,{childList:true,subtree:true});
  }

  // Patch the trending module's search interception without replacing its behavior.
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(...args){
    const response=await originalFetch(...args);
    try{
      const url=typeof args[0]==='string'?args[0]:args[0]?.url||'';
      if(/\/api\/search\?/.test(url)){
        const clone=response.clone(); const data=await clone.json();
        if(Array.isArray(data?.places)) window.__vibeWowPlaces=data.places.slice(0,12);
      }
    }catch{}
    return response;
  };

  function start(){watch(); setTimeout(collect,700);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
