// Vibe Check — live check-in UI polish.
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
      @media(max-width:850px){.live-signal{font-size:11px}}
    `;
    document.head.appendChild(style);
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
    const view=buttons[0];
    const onclick=view?.getAttribute('onclick')||'';
    const match=onclick.match(/openModal\((\d+)\)/);
    if(!match) return null;
    const index=Number(match[1]);
    return Array.isArray(window.places) && window.places[index]?.id ? window.places[index].id : null;
  }

  async function hydrateCard(card){
    if(card.dataset.liveLoaded==='1') return;
    const placeId=getPlaceId(card);
    if(!placeId) return;
    card.dataset.liveLoaded='1';

    let host=card.querySelector('.live-signal');
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

  function hydrateLiveSignals(){
    document.querySelectorAll('.place').forEach(hydrateCard);
  }

  function init(){
    addStyles();
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
