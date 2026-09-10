// Vibe Check — live check-in UI polish + post-check-in experience + live nearby sync.
(function(){
  'use strict';
  const VIBES=['😍','😊','🔥','😌','🥳','😕'];
  const WORDS={'😍':'Loved','😊':'Good vibes','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};

  function addStyles(){
    if(document.getElementById('vibe-checkin-polish-styles')) return;
    const style=document.createElement('style');style.id='vibe-checkin-polish-styles';style.textContent=`
      .checkin-btn{background:linear-gradient(135deg,#7c3aed,#ec4899)!important;color:#fff!important;border-color:transparent!important}
      .checkin-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(124,58,237,.18)}
      .live-signal{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding:8px 10px;border:1px solid #eadcff;border-radius:12px;background:linear-gradient(90deg,#faf7ff,#fff8fc);font-size:12px}
      .live-signal-main{font-weight:850;color:#5b21b6;white-space:nowrap}.live-signal-meta{color:#77727b;text-align:right}.live-signal-empty{color:#77727b;font-size:11px;margin-top:10px}.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#16a34a;margin-right:5px;box-shadow:0 0 0 3px #16a34a18}
      .checkin-success{padding:4px 2px 2px;text-align:center}.checkin-success-icon{width:72px;height:72px;margin:4px auto 14px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#f0e7ff,#ffe5f2);font-size:38px;box-shadow:0 12px 30px rgba(124,58,237,.12)}.checkin-success h2{margin:0;font-size:30px}.checkin-success-sub{margin:8px 0 0;color:#77727b;font-size:14px;line-height:1.5}.checkin-vibe{display:inline-flex;align-items:center;gap:8px;margin:18px 0 8px;padding:10px 15px;border-radius:999px;background:#f7f1ff;color:#5b21b6;font-weight:900;font-size:16px}.checkin-live-box{margin-top:16px;padding:16px;border:1px solid #eadcff;border-radius:18px;background:linear-gradient(135deg,#faf8ff,#fff7fb);text-align:left}.checkin-live-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed}.checkin-live-main{display:flex;align-items:baseline;gap:8px;margin-top:6px}.checkin-live-emoji{font-size:24px}.checkin-live-word{font-size:18px;font-weight:900}.checkin-live-count{margin-left:auto;font-size:12px;color:#77727b}.checkin-vibes{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.checkin-vibe-stat{background:#fff;border:1px solid #eee7f1;border-radius:999px;padding:7px 9px;font-size:12px;font-weight:800}.checkin-success-actions{display:flex;gap:9px;margin-top:18px}.checkin-success-actions button{flex:1;border:1px solid #e9e2ec;background:#fff;padding:11px;border-radius:12px;font-weight:850;cursor:pointer}.checkin-success-actions .checkin-done{border:0;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff}
      .vibe-feed-link{display:inline-flex;align-items:center;gap:7px;margin:10px 0 2px;padding:10px 13px;border-radius:12px;border:1px solid #eadcff;background:linear-gradient(135deg,#faf8ff,#fff4fa);color:#6d28d9;font-weight:900;font-size:12px;cursor:pointer;text-decoration:none}.vibe-feed-link:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(124,58,237,.12)}
      .not-my-vibe{border-color:#e7dce9!important;background:#fff!important;color:#4b4650!important}.not-my-vibe.selected{border:2px solid #7c3aed!important;background:#f7f1ff!important;color:#5b21b6!important}.vibe-checkin-note{font-size:11px;color:#77727b;text-align:center;margin-top:8px}.live-nearby-highlight{border:1px solid #eadcff!important;background:linear-gradient(135deg,#faf8ff,#fff7fb)!important}
      @media(max-width:520px){.checkin-success h2{font-size:26px}.checkin-success-actions{flex-direction:column}.checkin-live-count{display:none}}
    `;document.head.appendChild(style);
  }

  function captureSearchResults(){
    if(window.__vibeCheckinFetchPatched)return;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      let nextInit=init;
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(init?.method||input?.method||'GET').toUpperCase();
        if(url.includes('/api/search?')){
          const response=await originalFetch(input,init);
          const copy=response.clone();copy.json().then(data=>{if(Array.isArray(data?.places))window.__vibePlaces=data.places}).catch(()=>{});
          return response;
        }
        if(url.includes('/api/checkin') && method==='POST'){
          let body=null;
          if(typeof init?.body==='string'){try{body=JSON.parse(init.body)}catch{}}
          if(body && typeof body==='object'){
            if((!Number.isFinite(Number(body.latitude))||!Number.isFinite(Number(body.longitude))) && body.placeId){
              const found=(Array.isArray(window.__vibePlaces)?window.__vibePlaces:[]).find(p=>p?.id===body.placeId);
              const lat=Number(found?.latitude),lng=Number(found?.longitude);
              if(Number.isFinite(lat)&&Math.abs(lat)<=90)body.latitude=lat;
              if(Number.isFinite(lng)&&Math.abs(lng)<=180)body.longitude=lng;
            }
            if(window.__vcSelectedVibeOverride && VIBES.includes(window.__vcSelectedVibeOverride)){
              body.vibe=window.__vcSelectedVibeOverride;
            }
            nextInit=Object.assign({},init,{body:JSON.stringify(body)});
          }
        }
      }catch(e){console.warn('Vibe Check request enhancement skipped:',e)}
      const response=await originalFetch(input,nextInit);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(init?.method||input?.method||'GET').toUpperCase();
        if(url.includes('/api/checkin') && method==='POST' && response.ok){
          const copy=response.clone();copy.json().then(data=>{if(data?.ok){window.__vcSelectedVibeOverride=null;setTimeout(refreshAfterCheckin,350)}}).catch(()=>{});
        }
      }catch(e){}
      return response;
    };
    window.__vibeCheckinFetchPatched=true;
  }

  function addButtons(){document.querySelectorAll('.place').forEach((card,index)=>{const actions=card.querySelector('.place-actions');if(actions&&!actions.querySelector('.checkin-btn')){const button=document.createElement('button');button.type='button';button.className='small-btn checkin-btn';button.textContent='💜 Check in';button.addEventListener('click',function(){if(typeof window.openModal==='function')window.openModal(index)});actions.appendChild(button)}})}

  function getPlaceId(card){const buttons=card.querySelectorAll('.place-actions button');const maps=buttons[1];const mapsUrl=maps?.getAttribute('onclick')||'';const match=mapsUrl.match(/window\.open\('([^']+)'/);const href=match?match[1]:'';const places=Array.isArray(window.__vibePlaces)?window.__vibePlaces:[];const found=places.find(p=>p?.url===href);if(found?.id)return found.id;const view=buttons[0];const onclick=view?.getAttribute('onclick')||'';const indexMatch=onclick.match(/openModal\((\d+)\)/);const index=indexMatch?Number(indexMatch[1]):-1;return places[index]?.id||null}

  async function hydrateCard(card){if(card.dataset.liveLoaded==='1')return;const placeId=getPlaceId(card);if(!placeId)return;card.dataset.liveLoaded='1';let host=card.querySelector('.live-signal,.live-signal-empty');if(!host){host=document.createElement('div');host.className='live-signal-empty';host.textContent='Checking live vibe…';const body=card.querySelector('.place-body');const actions=card.querySelector('.place-actions');if(body)body.insertBefore(host,actions||null)}try{const r=await fetch(`/api/checkin?placeId=${encodeURIComponent(placeId)}&_=${Date.now()}`,{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error('live unavailable');const total=Number(data.total||0),counts=data.counts||{};if(!total){host.className='live-signal-empty';host.textContent='Be the first to set the live vibe.';return}const ranked=Object.entries(counts).filter(([v])=>VIBES.includes(v)).sort((a,b)=>Number(b[1])-Number(a[1]));const dominant=ranked[0]?.[0]||data.dominant||'😊';const dominantCount=Number(ranked[0]?.[1]||0);const pct=Math.round(dominantCount/total*100);host.className='live-signal';host.innerHTML=`<span class="live-signal-main"><span class="live-dot"></span>${dominant} ${WORDS[dominant]||'Live vibe'}</span><span class="live-signal-meta">${total} live · ${pct}% leading</span>`}catch{host.className='live-signal-empty';host.textContent='Live vibe will appear as people check in.'}}

  function addFeedLink(){if(document.querySelector('.vibe-feed-link'))return;const host=document.querySelector('.section-title');if(!host)return;const link=document.createElement('a');link.className='vibe-feed-link';link.href='feed.html';link.innerHTML='⚡ See the live Vibe Feed';const side=host.parentElement;side.insertBefore(link,host.nextSibling)}
  function hydrateLiveSignals(){document.querySelectorAll('.place').forEach(hydrateCard)}
  function refreshAfterCheckin(){document.querySelectorAll('.place').forEach(card=>{delete card.dataset.liveLoaded});hydrateLiveSignals();window.dispatchEvent(new CustomEvent('vc:checkin-complete'))}

  // The main page already renders the complete six-vibe list, including 😕 Not my vibe.
  // Older polish code appended another 😕 button, and multiple enhancement passes could
  // leave several copies in the modal. Normalize the row instead of adding another option.
  function normalizeVibeOptions(){
    document.querySelectorAll('.emoji-row').forEach(row=>{
      const buttons=[...row.querySelectorAll('.emoji')];
      const notMyVibe=buttons.filter(btn=>btn.textContent.trim()==='😕');
      if(notMyVibe.length>1){
        // Prefer the original/core button and remove any duplicate enhancement buttons.
        const keep=notMyVibe.find(btn=>!btn.classList.contains('not-my-vibe'))||notMyVibe[0];
        notMyVibe.forEach(btn=>{if(btn!==keep)btn.remove()});
      }
      const remaining=[...row.querySelectorAll('.emoji')];
      if(!remaining.some(btn=>btn.textContent.trim()==='😕')){
        const button=document.createElement('button');
        button.type='button';button.className='emoji not-my-vibe';button.textContent='😕';button.title='Not my vibe';button.setAttribute('aria-label','Not my vibe');
        button.addEventListener('click',()=>{
          row.querySelectorAll('.emoji').forEach(x=>x.classList.remove('selected'));
          button.classList.add('selected');
          window.__vcSelectedVibeOverride='😕';
        });
        row.appendChild(button);
      }
      if(!row.parentElement.querySelector('.vibe-checkin-note')){
        const note=document.createElement('div');note.className='vibe-checkin-note';note.textContent='No stars. Just a feeling — your check-in stays anonymous.';row.parentElement.insertBefore(note,row.nextSibling);
      }
    });
  }

  function wrapSaveVibe(){
    if(window.__vibeSaveWrapped||typeof window.saveVibe!=='function')return;
    const originalSave=window.saveVibe;
    window.saveVibe=async function(){
      await originalSave.apply(this,arguments);
      setTimeout(refreshAfterCheckin,50);
    };
    window.__vibeSaveWrapped=true;
  }

  function init(){
    addStyles();captureSearchResults();addButtons();addFeedLink();hydrateLiveSignals();normalizeVibeOptions();wrapSaveVibe();
    const target=document.getElementById('places');
    if(target){new MutationObserver(function(){addButtons();addFeedLink();hydrateLiveSignals();wrapSaveVibe()}).observe(target,{childList:true,subtree:true})}
    const modal=document.getElementById('modal');
    if(modal){new MutationObserver(normalizeVibeOptions).observe(modal,{childList:true,subtree:true})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
