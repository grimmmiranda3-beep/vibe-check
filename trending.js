// Vibe Check — live discovery / Trending experience.
// IMPORTANT: trend by recent anonymous check-ins, never lifetime star ratings.
(function () {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const LABELS = {'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};
  const TYPE_FILTERS = [['All','✨ All'],['Coffee','☕ Coffee'],['Food','🍽️ Food'],['Nightlife','🌙 Nightlife'],['Family','👨‍👩‍👧 Family']];
  let latestPlaces = [];
  let timer = null;
  let activeType = 'All';

  function styles(){
    if(document.getElementById('vibe-discovery-styles')) return;
    const s=document.createElement('style'); s.id='vibe-discovery-styles';
    s.textContent=`
      .trending-panel{margin:22px 0 0;background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 28px #21142c08}
      .trending-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}
      .trending-head h2{margin:0;font-size:21px}.trending-head p{margin:4px 0 0;color:var(--muted);font-size:13px}.trending-live{font-size:11px;font-weight:900;color:var(--accent)}
      .trending-controls{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
      .trend-filter{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;cursor:pointer;color:var(--ink)}
      .trend-filter.selected{background:var(--ink);color:#fff;border-color:var(--ink)}
      .trending-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .trend-card{border:1px solid var(--line);border-radius:18px;padding:16px;background:linear-gradient(180deg,#fff,#faf8fb);cursor:pointer;transition:.18s}
      .trend-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px #21142c12}
      .trend-rank{font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase;letter-spacing:.06em}
      .trend-name{font-size:16px;font-weight:900;margin:7px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .trend-vibe{font-size:34px;margin:8px 0 2px}.trend-label{font-weight:900}.trend-meta{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.45}
      .trend-pulse{margin-top:12px;font-size:12px;font-weight:850}.trend-breakdown{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.trend-chip{background:#f5f1f7;border-radius:999px;padding:5px 8px;font-size:11px}
      .trend-empty{padding:16px;border-radius:15px;background:#faf8fb;color:var(--muted);font-size:13px;line-height:1.45}
      .trend-footer{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:11px;color:var(--muted)}
      .trend-refresh{border:0;background:#f5f1f7;color:var(--ink);border-radius:10px;padding:7px 10px;font-weight:800;cursor:pointer}
      @media(max-width:850px){.trending-grid{grid-template-columns:1fr}.trending-panel{padding:16px}}
    `;
    document.head.appendChild(s);
  }

  function panel(){
    const host=document.getElementById('exploreContent');
    if(!host)return null;
    let p=document.getElementById('vibelyTrending');
    if(!p){p=document.createElement('section');p.id='vibelyTrending';p.className='trending-panel';host.appendChild(p)}
    return p;
  }

  function capture(){
    if(window.__vibeDiscoveryFetchPatched)return;
    window.__vibeDiscoveryFetchPatched=true;
    const original=window.fetch.bind(window);
    window.fetch=async function(...args){
      const response=await original(...args);
      try{
        const url=typeof args[0]==='string'?args[0]:args[0]?.url||'';
        const method=(args[1]?.method||args[0]?.method||'GET').toUpperCase();
        if(/\/api\/search\?/.test(url)){
          const clone=response.clone();const data=await clone.json();
          if(Array.isArray(data?.places)){latestPlaces=data.places.slice(0,20);schedule()}
        }
        if(/\/api\/checkin/.test(url) && method==='POST' && response.ok)setTimeout(schedule,450);
      }catch{}
      return response;
    };
  }

  async function activity(place){
    if(!place?.id)return {...place,total:0,counts:{},dominant:null};
    try{
      const r=await fetch(`/api/checkin?placeId=${encodeURIComponent(place.id)}&_=${Date.now()}`,{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw Error();
      return {...place,total:Number(d.total||0),counts:d.counts||{},dominant:d.dominant||null};
    }catch{return {...place,total:0,counts:{},dominant:null}}
  }

  function fallback(p){
    const text=`${p.name||''} ${p.type||''}`.toLowerCase();
    if(/bar|club|nightlife|brew|lounge/.test(text))return'🔥';
    if(/coffee|cafe/.test(text))return'😊';
    if(/restaurant|food|dining|pizza|thai|mexican|burger/.test(text))return'😍';
    return'😌';
  }

  function matchesType(place){
    if(activeType==='All')return true;
    const text=`${place.name||''} ${place.type||''} ${(place.tags||[]).join(' ')}`.toLowerCase();
    if(activeType==='Coffee')return /coffee|cafe|bakery/.test(text);
    if(activeType==='Food')return /restaurant|food|dining|pizza|thai|mexican|burger|bakery/.test(text);
    if(activeType==='Nightlife')return /bar|club|nightlife|brew|lounge|music/.test(text);
    if(activeType==='Family')return /family|park|playground|recreation|kids/.test(text);
    return true;
  }

  function openPlace(place){
    // Use the rendered place card so Trending stays correct even when a filter is active.
    const cards=[...document.querySelectorAll('.place')];
    const card=cards.find(el=>el.querySelector('h3')?.textContent?.trim()===String(place.name||'').trim());
    const button=card?.querySelector('.small-btn');
    if(button){button.click();return;}
    if(typeof window.openModal==='function'){
      const index=latestPlaces.findIndex(x=>String(x.id)===String(place.id));
      if(index>=0)window.openModal(index);
    }
  }

  async function render(){
    styles();
    const p=panel();
    if(!p)return;
    if(!latestPlaces.length){
      p.innerHTML='<div class="trending-head"><div><h2>🔥 Happening right now</h2><p>Search a place type and city to see live community energy.</p></div><span class="trending-live">LIVE</span></div>';
      return;
    }

    p.innerHTML='<div class="trending-head"><div><h2>🔥 Happening right now</h2><p>Not reviews. Not stars. Just what people are feeling right now.</p></div><span class="trending-live">LIVE</span></div><div class="trend-empty">Reading the current vibe pulse…</div>';
    const all=await Promise.all(latestPlaces.map(activity));
    const filtered=all.filter(matchesType);
    const active=filtered.filter(x=>x.total>0).sort((a,b)=>Number(b.total)-Number(a.total)).slice(0,6);
    const controls=TYPE_FILTERS.map(([key,label])=>`<button type="button" class="trend-filter ${activeType===key?'selected':''}" data-trend-filter="${key}">${label}</button>`).join('');

    if(!active.length){
      p.innerHTML=`<div class="trending-head"><div><h2>🔥 Happening right now</h2><p>${activeType==='All'?'Your search has no recent check-ins yet.':'No live check-ins match this category yet.'}</p></div><span class="trending-live">LIVE</span></div><div class="trending-controls">${controls}</div><div class="trend-empty"><b>Someone has to start the pulse.</b><br>Check in at a place and your anonymous vibe can become the first signal.</div><div class="trend-footer"><span>Live anonymous activity · last 3 hours</span><button type="button" class="trend-refresh" id="trendRefresh">↻ Refresh</button></div>`;
    }else{
      p.innerHTML=`<div class="trending-head"><div><h2>🔥 Happening right now</h2><p>Live activity—not lifetime ratings.</p></div><span class="trending-live">LIVE</span></div><div class="trending-controls">${controls}</div><div class="trending-grid">${active.map((x,i)=>{
        const vibe=x.dominant||fallback(x);
        const entries=Object.entries(x.counts||{}).filter(([v])=>LABELS[v]).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3);
        return `<article class="trend-card" data-id="${esc(x.id)}"><div class="trend-rank">#${i+1} Active now</div><div class="trend-name">${esc(x.name||'Local place')}</div><div class="trend-vibe">${esc(vibe)}</div><div class="trend-label">${esc(LABELS[vibe]||'Current vibe')}</div><div class="trend-meta">${esc(x.type||'Place')} · anonymous community signal</div><div class="trend-pulse">⚡ ${x.total} recent check-in${x.total===1?'':'s'}</div><div class="trend-breakdown">${entries.map(([v,n])=>`<span class="trend-chip">${esc(v)} ${Number(n)}</span>`).join('')}</div></article>`
      }).join('')}</div><div class="trend-footer"><span>Live anonymous activity · last 3 hours</span><button type="button" class="trend-refresh" id="trendRefresh">↻ Refresh</button></div>`;
    }

    p.querySelectorAll('[data-trend-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeType=btn.dataset.trendFilter;render()}));
    p.querySelectorAll('.trend-card').forEach(card=>card.addEventListener('click',()=>{
      const place=latestPlaces.find(x=>String(x.id)===String(card.dataset.id));
      if(place)openPlace(place);
    }));
    p.querySelector('#trendRefresh')?.addEventListener('click',()=>render());
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(render,250)}
  window.VibeDiscovery={refresh:schedule,render,openPlace};
  window.VibelyTrending=window.VibeDiscovery;
  capture();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  setInterval(render,60000);
})();
