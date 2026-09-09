// Vibe Check — location-aware home experience.
// Keeps the Explore page focused on live anonymous activity instead of Yelp-style reviews.
(function(){
  'use strict';
  const ID='vcNearbyHome';
  const esc=s=>String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const vibeWords={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party'};
  const style=document.createElement('style');
  style.textContent=`
  #${ID}{margin:6px 0 22px;background:linear-gradient(135deg,#fff,#faf7ff);border:1px solid #e9e1f0;border-radius:24px;box-shadow:0 14px 40px rgba(25,18,35,.07);overflow:hidden}
  #${ID} .vc-nearby-head{padding:22px 22px 16px;display:flex;justify-content:space-between;gap:18px;align-items:center}
  #${ID} .vc-kicker{font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#7c3aed}
  #${ID} h2{font-size:24px;margin:5px 0 4px;line-height:1.1}
  #${ID} .vc-copy{font-size:13px;color:#77727b;line-height:1.45;margin:0;max-width:650px}
  #${ID} .vc-loc{border:0;background:#17151a;color:#fff;border-radius:13px;padding:11px 15px;font-weight:900;white-space:nowrap;cursor:pointer}
  #${ID} .vc-loc:disabled{opacity:.65;cursor:wait}
  #${ID} .vc-status{padding:0 22px 14px;font-size:12px;color:#77727b;min-height:18px}
  #${ID} .vc-status strong{color:#17151a}
  #${ID} .vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 22px 22px}
  #${ID} .vc-card{background:#fff;border:1px solid #ece8ee;border-radius:18px;padding:15px;min-width:0}
  #${ID} .vc-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  #${ID} .vc-vibe{font-size:28px}
  #${ID} .vc-live{font-size:10px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:.05em}
  #${ID} .vc-name{font-weight:900;font-size:16px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #${ID} .vc-meta{font-size:11px;color:#77727b;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #${ID} .vc-signal{margin-top:11px;font-size:12px;font-weight:850}
  #${ID} .vc-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  #${ID} .vc-pill{background:#f5f1f7;border-radius:999px;padding:6px 8px;font-size:10px;font-weight:800}
  #${ID} .vc-empty{padding:0 22px 22px}
  #${ID} .vc-empty-inner{background:#fff;border:1px dashed #ddd5e2;border-radius:18px;padding:18px;text-align:center;color:#77727b;font-size:13px;line-height:1.5}
  #${ID} .vc-privacy{padding:0 22px 18px;font-size:10px;color:#8a858d}
  @media(max-width:850px){#${ID} .vc-nearby-head{align-items:flex-start;flex-direction:column}#${ID} .vc-loc{width:100%}#${ID} .vc-cards{grid-template-columns:1fr} }
  `;
  document.head.appendChild(style);

  function mount(){
    if(document.getElementById(ID)||!document.getElementById('exploreContent')) return;
    const host=document.createElement('section');
    host.id=ID;
    host.innerHTML=`<div class="vc-nearby-head"><div><div class="vc-kicker">⚡ Live nearby</div><h2>What's happening around you?</h2><p class="vc-copy">Vibe Check is different: this isn't a review list. Places show up here because people are actually checking in right now.</p></div><button class="vc-loc" id="vcLocate">📍 Use my location</button></div><div class="vc-status" id="vcStatus">Turn on location to see the live pulse around you.</div><div class="vc-empty" id="vcEmpty"><div class="vc-empty-inner">🔒 Your precise location stays in your browser. We only use it to find nearby anonymous Vibe Check activity.</div></div><div class="vc-cards" id="vcCards" style="display:none"></div><div class="vc-privacy">Live activity is based on recent anonymous check-ins. A place does not appear here just because it has lots of old reviews.</div>`;
    const hero=document.getElementById('explore');
    hero.insertAdjacentElement('afterend',host);
    document.getElementById('vcLocate').addEventListener('click',locate);
  }

  function locate(){
    const btn=document.getElementById('vcLocate'),status=document.getElementById('vcStatus'),empty=document.getElementById('vcEmpty');
    if(!navigator.geolocation){status.innerHTML='Location is not available in this browser.';return;}
    btn.disabled=true;btn.textContent='📍 Finding you…';status.textContent='Finding the live pulse around you…';
    navigator.geolocation.getCurrentPosition(async p=>{
      status.innerHTML='📍 <strong>Nearby mode is on</strong> · within 5 miles';
      btn.disabled=false;btn.textContent='↻ Refresh nearby';
      await load(p.coords.latitude,p.coords.longitude);
    },()=>{
      btn.disabled=false;btn.textContent='📍 Try location again';
      status.textContent='Location permission was not granted. Tap the button to try again.';
    },{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
  }

  async function load(lat,lng){
    const cards=document.getElementById('vcCards'),empty=document.getElementById('vcEmpty'),status=document.getElementById('vcStatus');
    try{
      const r=await fetch(`/api/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=5&_=${Date.now()}`,{cache:'no-store'});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||'Nearby pulse unavailable');
      const places=Array.isArray(data.places)?data.places:[];
      if(!places.length){cards.style.display='none';empty.style.display='block';empty.innerHTML='<div class="vc-empty-inner">💜 Nothing is buzzing nearby yet.<br><b>Be the first to set the vibe.</b></div>';status.innerHTML='📍 <strong>Nearby mode is on</strong> · no live activity within 5 miles';return;}
      empty.style.display='none';cards.style.display='grid';status.innerHTML=`📍 <strong>${places.length} live ${places.length===1?'place':'places'}</strong> nearby · activity from the last 3 hours`;
      cards.innerHTML=places.slice(0,6).map((p,i)=>{
        const emoji=p.dominant||'💜',label=vibeWords[emoji]||'Live vibe';
        const total=Number(p.total||0),pct=Number(p.dominant_percent||0),distance=p.distance_miles!=null?`${p.distance_miles} mi`:'Nearby';
        return `<article class="vc-card"><div class="vc-card-top"><div><div class="vc-live">● Live signal</div><div class="vc-name" title="${esc(p.place_name||'Local place')}">${esc(p.place_name||'Local place')}</div><div class="vc-meta" title="${esc(p.place_address||'Nearby')}">${esc(p.place_address||'Nearby')}</div></div><div class="vc-vibe">${esc(emoji)}</div></div><div class="vc-signal">${esc(label)}${pct?` · ${pct}%`:''}</div><div class="vc-pills"><span class="vc-pill">⚡ ${total} check-in${total===1?'':'s'}</span><span class="vc-pill">📍 ${esc(distance)}</span></div></article>`;
      }).join('');
    }catch(e){
      cards.style.display='none';empty.style.display='block';empty.innerHTML='<div class="vc-empty-inner">Nearby activity is temporarily unavailable.<br>Please try again in a moment.</div>';status.textContent='We could not load the live nearby pulse.';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
