// Vibe Check — one-tap check-in from the live Nearby pulse.
// This is intentionally a pulse interaction, not a review/rating flow.
(function(){
  'use strict';
  const ID='vcNearbyCheckin';
  const VIBES=[['😍','Loved'],['😊','Chill'],['🔥','Energetic'],['😌','Relaxed'],['🥳','Party']];
  const esc=s=>String(s??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

  let nearbyPlaces=[];
  let coords=null;

  function styles(){
    if(document.getElementById(ID+'Styles')) return;
    const s=document.createElement('style'); s.id=ID+'Styles';
    s.textContent=`
      #${ID} .vc-ci-btn{margin-top:10px;width:100%;border:0;border-radius:11px;padding:10px 12px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:900;font-size:12px;cursor:pointer}
      #${ID} .vc-ci-btn:hover{transform:translateY(-1px);box-shadow:0 6px 15px rgba(124,58,237,.18)}
      .vc-ci-overlay{position:fixed;inset:0;background:rgba(23,16,28,.58);display:none;place-items:center;z-index:90;padding:18px}
      .vc-ci-overlay.show{display:grid}
      .vc-ci-card{width:min(520px,100%);background:#fff;border-radius:24px;padding:22px;box-shadow:0 30px 80px rgba(18,10,28,.28)}
      .vc-ci-close{float:right;border:0;background:#f3eff5;border-radius:50%;width:34px;height:34px;font-size:20px;cursor:pointer}
      .vc-ci-kicker{color:#7c3aed;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .vc-ci-card h2{margin:5px 0 4px;font-size:25px}
      .vc-ci-place{color:#77727b;font-size:12px;line-height:1.4;margin-bottom:16px}
      .vc-ci-prompt{font-size:14px;font-weight:850;margin:15px 0 9px}
      .vc-ci-vibes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .vc-ci-vibe{border:1px solid #ece8ee;background:#fff;border-radius:15px;padding:12px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px}
      .vc-ci-vibe:hover{background:#faf7ff;border-color:#d9c7f5}
      .vc-ci-vibe span:first-child{font-size:25px}.vc-ci-vibe strong{font-size:13px}
      .vc-ci-note{margin-top:15px;padding:11px 12px;border-radius:13px;background:#faf8ff;border:1px solid #eadcff;color:#77727b;font-size:11px;line-height:1.45}
      .vc-ci-status{min-height:18px;margin-top:12px;font-size:12px;color:#6d28d9;font-weight:800}
      .vc-ci-result{text-align:center;padding:8px 0 2px}.vc-ci-result-emoji{font-size:48px;margin:8px}.vc-ci-result h3{font-size:24px;margin:5px 0}.vc-ci-result p{color:#77727b;font-size:13px;line-height:1.5}
      .vc-ci-live{margin-top:14px;padding:14px;border:1px solid #eadcff;border-radius:16px;background:linear-gradient(135deg,#faf8ff,#fff7fb);text-align:left}
      .vc-ci-live strong{display:block;font-size:11px;color:#7c3aed;text-transform:uppercase;letter-spacing:.06em}.vc-ci-live-main{font-size:17px;font-weight:900;margin-top:5px}.vc-ci-live-sub{font-size:11px;color:#77727b;margin-top:3px}
      @media(max-width:520px){.vc-ci-vibes{grid-template-columns:1fr}.vc-ci-card{padding:18px}}
    `; document.head.appendChild(s);
  }

  function patchFetch(){
    if(window.__vcNearbyCheckinFetchPatched) return;
    const original=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await original(input,init);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        if(url.includes('/api/nearby?')){
          const copy=response.clone();
          copy.json().then(data=>{
            if(Array.isArray(data?.places)) nearbyPlaces=data.places;
          }).catch(()=>{});
        }
      }catch(e){}
      return response;
    };
    window.__vcNearbyCheckinFetchPatched=true;
  }

  function ensureModal(){
    if(document.getElementById(ID+'Modal')) return;
    const overlay=document.createElement('div');overlay.className='vc-ci-overlay';overlay.id=ID+'Modal';
    overlay.innerHTML=`<div class="vc-ci-card"><button class="vc-ci-close" type="button" aria-label="Close">×</button><div id="${ID}Body"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.querySelector('.vc-ci-close').addEventListener('click',close);
  }

  function close(){document.getElementById(ID+'Modal')?.classList.remove('show')}

  function open(place){
    ensureModal();
    const body=document.getElementById(ID+'Body'), modal=document.getElementById(ID+'Modal');
    body.innerHTML=`<div class="vc-ci-kicker">⚡ Live check-in</div><h2>Set the vibe.</h2><div class="vc-ci-place">${esc(place.place_name||'Local place')}<br>${esc(place.place_address||'')}</div><div class="vc-ci-prompt">How does it feel right now?</div><div class="vc-ci-vibes">${VIBES.map(([e,l])=>`<button class="vc-ci-vibe" data-vibe="${e}" type="button"><span>${e}</span><strong>${l}</strong></button>`).join('')}</div><div class="vc-ci-note">🔒 Anonymous by design. Your profile does not appear to other people. Your vibe simply joins the live pulse for this place.</div><div class="vc-ci-status" id="${ID}Status"></div>`;
    body.querySelectorAll('.vc-ci-vibe').forEach(b=>b.addEventListener('click',()=>submit(place,b.dataset.vibe)));
    modal.classList.add('show');
  }

  async function submit(place,vibe){
    const status=document.getElementById(ID+'Status');
    if(!status) return;
    document.querySelectorAll('.vc-ci-vibe').forEach(b=>b.disabled=true);
    status.textContent='Adding your vibe…';
    try{
      const r=await fetch('/api/checkin',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({placeId:place.place_id||place.placeId,vibe,placeName:place.place_name,placeAddress:place.place_address,latitude:place.latitude,longitude:place.longitude})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Unable to check in.');
      const dominant=data.dominant||vibe, total=Number(data.total||0), label=VIBES.find(x=>x[0]===dominant)?.[1]||'Live vibe';
      document.getElementById(ID+'Body').innerHTML=`<div class="vc-ci-result"><div class="vc-ci-result-emoji">${esc(vibe)}</div><div class="vc-ci-kicker">You're part of the pulse</div><h3>Vibe set. ✨</h3><p>Your check-in is live anonymously and helps the next person know what this place feels like right now.</p><div class="vc-ci-live"><strong>Live here now</strong><div class="vc-ci-live-main">${esc(dominant)} ${esc(label)}</div><div class="vc-ci-live-sub">${total} live check-in${total===1?'':'s'} · updates as people check in</div></div></div>`;
      setTimeout(close,1700);
      window.dispatchEvent(new CustomEvent('vc:checkin-complete',{detail:{placeId:place.place_id||place.placeId,vibe}}));
    }catch(e){
      status.textContent='Could not save that vibe. Please try again.';
      document.querySelectorAll('.vc-ci-vibe').forEach(b=>b.disabled=false);
    }
  }

  function attach(){
    const cards=document.querySelectorAll('#vcNearbyHome .vc-card');
    cards.forEach(card=>{
      if(card.dataset.vcCiAttached==='1') return;
      const name=card.querySelector('.vc-name')?.textContent?.trim()||'';
      const address=card.querySelector('.vc-meta')?.textContent?.trim()||'';
      const place=nearbyPlaces.find(p=>String(p?.place_name||'').trim()===name && String(p?.place_address||'').trim()===address) || nearbyPlaces.find(p=>String(p?.place_name||'').trim()===name);
      if(!place?.place_id) return;
      card.dataset.vcCiAttached='1';
      const wrap=card.querySelector('.vc-card-top')?.parentElement||card;
      const btn=document.createElement('button');btn.type='button';btn.className='vc-ci-btn';btn.textContent='💜 Check in right now';
      btn.addEventListener('click',()=>open(place));
      wrap.appendChild(btn);
    });
  }

  function init(){
    styles();patchFetch();ensureModal();
    const root=document.getElementById('vcNearbyHome');
    if(root) new MutationObserver(attach).observe(root,{childList:true,subtree:true});
    attach();
    window.addEventListener('vc:checkin-complete',()=>setTimeout(attach,50));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
