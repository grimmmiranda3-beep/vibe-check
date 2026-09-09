// Vibe Check — live check-in UI polish + post-check-in experience.
(function(){
  'use strict';

  const VIBES = ['😍','😊','🔥','😌','🥳'];
  const WORDS = { '😍':'Loved', '😊':'Chill', '🔥':'Energetic', '😌':'Relaxed', '🥳':'Party' };

  function addStyles(){
    if(document.getElementById('vibe-checkin-polish-styles')) return;
    const style=document.createElement('style');
    style.id='vibe-checkin-polish-styles';
    style.textContent=`
      .checkin-btn{background:linear-gradient(135deg,#7c3aed,#ec4899)!important;color:#fff!important;border-color:transparent!important}
      .checkin-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(124,58,237,.18)}
      .live-signal{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding:8px 10px;border:1px solid #eadcff;border-radius:12px;background:linear-gradient(90deg,#faf7ff,#fff8fc);font-size:12px}
      .live-signal-main{font-weight:850;color:#5b21b6;white-space:nowrap}
      .live-signal-meta{color:#77727b;text-align:right}
      .live-signal-empty{color:#77727b;font-size:11px;margin-top:10px}
      .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#16a34a;margin-right:5px;box-shadow:0 0 0 3px #16a34a18}
      .checkin-success{padding:4px 2px 2px;text-align:center}
      .checkin-success-icon{width:72px;height:72px;margin:4px auto 14px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#f0e7ff,#ffe5f2);font-size:38px;box-shadow:0 12px 30px rgba(124,58,237,.12)}
      .checkin-success h2{margin:0;font-size:30px}
      .checkin-success-sub{margin:8px 0 0;color:#77727b;font-size:14px;line-height:1.5}
      .checkin-vibe{display:inline-flex;align-items:center;gap:8px;margin:18px 0 8px;padding:10px 15px;border-radius:999px;background:#f7f1ff;color:#5b21b6;font-weight:900;font-size:16px}
      .checkin-live-box{margin-top:16px;padding:16px;border:1px solid #eadcff;border-radius:18px;background:linear-gradient(135deg,#faf8ff,#fff7fb);text-align:left}
      .checkin-live-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed}
      .checkin-live-main{display:flex;align-items:baseline;gap:8px;margin-top:6px}
      .checkin-live-emoji{font-size:24px}.checkin-live-word{font-size:18px;font-weight:900}.checkin-live-count{margin-left:auto;font-size:12px;color:#77727b}
      .checkin-vibes{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
      .checkin-vibe-stat{background:#fff;border:1px solid #eee7f1;border-radius:999px;padding:7px 9px;font-size:12px;font-weight:800}
      .checkin-success-actions{display:flex;gap:9px;margin-top:18px}
      .checkin-success-actions button{flex:1;border:1px solid #e9e2ec;background:#fff;padding:11px;border-radius:12px;font-weight:850;cursor:pointer}
      .checkin-success-actions .checkin-done{border:0;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff}
      @media(max-width:520px){.checkin-success h2{font-size:26px}.checkin-success-actions{flex-direction:column}.checkin-live-count{display:none}}
    `;
    document.head.appendChild(style);
  }

  function captureSearchResults(){
    if(window.__vibeCheckinFetchPatched) return;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await originalFetch(input,init);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        if(url.includes('/api/search?')){
          const copy=response.clone();
          copy.json().then(data=>{if(Array.isArray(data?.places)) window.__vibePlaces=data.places}).catch(()=>{});
        }
        if(url.includes('/api/checkin') && (init?.method||'GET').toUpperCase()==='POST'){
          const copy=response.clone();
          copy.json().then(data=>{
            if(response.ok && data?.ok) showCheckinSuccess(data);
          }).catch(()=>{});
        }
      }catch{}
      return response;
    };
    window.__vibeCheckinFetchPatched=true;
  }

  function addButtons(){
    const cards=document.querySelectorAll('.place');
    cards.forEach((card,index)=>{
      const actions=card.querySelector('.place-actions');
      if(actions && !actions.querySelector('.checkin-btn')){
        const button=document.createElement('button');
        button.type='button';
        button.className='small-btn checkin-btn';
        button.textContent='💜 Check in';
        button.addEventListener('click',function(){
          if(typeof window.openModal==='function') window.openModal(index);
        });
        actions.appendChild(button);
      }
    });
  }

  function getPlaceId(card){
    const buttons=card.querySelectorAll('.place-actions button');
    const maps=buttons[1];
    const mapsUrl=maps?.getAttribute('onclick')||'';
    const match=mapsUrl.match(/window\.open\('([^']+)'/);
    const href=match?match[1]:'';
    const places=Array.isArray(window.__vibePlaces)?window.__vibePlaces:[];
    const found=places.find(p=>p?.url===href);
    if(found?.id) return found.id;
    const view=buttons[0];
    const onclick=view?.getAttribute('onclick')||'';
    const indexMatch=onclick.match(/openModal\((\d+)\)/);
    const index=indexMatch?Number(indexMatch[1]):-1;
    return places[index]?.id||null;
  }

  async function hydrateCard(card){
    if(card.dataset.liveLoaded==='1') return;
    const placeId=getPlaceId(card);
    if(!placeId) return;
    card.dataset.liveLoaded='1';

    let host=card.querySelector('.live-signal,.live-signal-empty');
    if(!host){
      host=document.createElement('div');
      host.className='live-signal-empty';
      host.textContent='Checking live vibe…';
      const body=card.querySelector('.place-body');
      const actions=card.querySelector('.place-actions');
      if(body) body.insertBefore(host,actions||null);
    }

    try{
      const r=await fetch(`/api/checkin?placeId=${encodeURIComponent(placeId)}&_=${Date.now()}`,{cache:'no-store'});
      const data=await r.json();
      if(!r.ok) throw new Error('live unavailable');
      const total=Number(data.total||0);
      const counts=data.counts||{};
      if(!total){
        host.className='live-signal-empty';
        host.textContent='Be the first to set the live vibe.';
        return;
      }
      const ranked=Object.entries(counts).filter(([v])=>VIBES.includes(v)).sort((a,b)=>Number(b[1])-Number(a[1]));
      const dominant=ranked[0]?.[0]||data.dominant||'😊';
      const dominantCount=Number(ranked[0]?.[1]||0);
      const pct=Math.round(dominantCount/total*100);
      host.className='live-signal';
      host.innerHTML=`<span class="live-signal-main"><span class="live-dot"></span>${dominant} ${WORDS[dominant]||'Live vibe'}</span><span class="live-signal-meta">${total} live · ${pct}% leading</span>`;
    }catch{
      host.className='live-signal-empty';
      host.textContent='Live vibe will appear as people check in.';
    }
  }

  function showCheckinSuccess(data){
    const body=document.getElementById('modalBody');
    const modal=document.getElementById('modal');
    if(!body || !modal) return;
    const vibe=data.vibe||'😊';
    const word=WORDS[vibe]||'Checked in';
    const total=Number(data.total||0);
    const counts=data.counts||{};
    const dominant=data.dominant||Object.entries(counts).filter(([v])=>VIBES.includes(v)).sort((a,b)=>Number(b[1])-Number(a[1]))[0]?.[0]||vibe;
    const dominantWord=WORDS[dominant]||'Live vibe';
    const pills=VIBES.filter(v=>Number(counts[v]||0)>0).map(v=>`<span class="checkin-vibe-stat">${v} ${Number(counts[v])}</span>`).join('');
    body.innerHTML=`
      <div class="checkin-success">
        <div class="checkin-success-icon">${vibe}</div>
        <h2>You're in the vibe! ✨</h2>
        <p class="checkin-success-sub">Your check-in is live anonymously and helps everyone see what this place feels like right now.</p>
        <div class="checkin-vibe">${vibe} ${escapeText(word)}</div>
        <div class="checkin-live-box">
          <div class="checkin-live-title">Live vibe right now</div>
          <div class="checkin-live-main"><span class="checkin-live-emoji">${dominant}</span><span class="checkin-live-word">${escapeText(dominantWord)}</span><span class="checkin-live-count">${total} check-in${total===1?'':'s'}</span></div>
          ${pills?`<div class="checkin-vibes">${pills}</div>`:''}
        </div>
        <div class="checkin-success-actions">
          <button type="button" onclick="closeModal()">Done</button>
          <button type="button" class="checkin-done" onclick="closeModal(); window.location.href='profile.html'">View my check-ins</button>
        </div>
      </div>`;
    modal.classList.add('show');
  }

  function escapeText(value){
    return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function hydrateLiveSignals(){
    document.querySelectorAll('.place').forEach(hydrateCard);
  }

  function init(){
    addStyles();
    captureSearchResults();
    addButtons();
    hydrateLiveSignals();
    const target=document.getElementById('places');
    if(target){
      new MutationObserver(function(){
        addButtons();
        hydrateLiveSignals();
      }).observe(target,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
