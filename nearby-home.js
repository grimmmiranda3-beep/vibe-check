// Vibe Check — location-aware home experience.
// Keeps the Explore page focused on live anonymous activity instead of Yelp-style reviews.
(function(){
  'use strict';
  const ID='vcNearbyHome';
  const esc=s=>String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const vibeWords={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party'};
  const style=document.createElement('style');
  style.textContent=`
  #${ID}{width:100%;margin:0 0 24px;background:linear-gradient(135deg,#fff,#faf7ff);border:1px solid #e9e1f0;border-radius:22px;box-shadow:0 10px 30px rgba(25,18,35,.06);overflow:hidden}
  #${ID} .vc-nearby-head{padding:18px 20px 12px;display:flex;justify-content:space-between;gap:18px;align-items:center}
  #${ID} .vc-kicker{font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#7c3aed}
  #${ID} h2{font-size:22px;margin:4px 0 3px;line-height:1.1}
  #${ID} .vc-copy{font-size:12px;color:#77727b;line-height:1.4;margin:0;max-width:720px}
  #${ID} .vc-loc{border:0;background:#17151a;color:#fff;border-radius:12px;padding:10px 14px;font-weight:900;white-space:nowrap;cursor:pointer;min-width:174px}
  #${ID} .vc-loc:hover{transform:translateY(-1px)}
  #${ID} .vc-loc:disabled{opacity:.65;cursor:wait;transform:none}
  #${ID} .vc-status{padding:0 20px 12px;font-size:11px;color:#77727b;min-height:16px}
  #${ID} .vc-status strong{color:#17151a}
  #${ID} .vc-help{display:none;margin:0 20px 14px;padding:12px 14px;background:#faf8ff;border:1px solid #e8defa;border-radius:14px;color:#6f6875;font-size:11px;line-height:1.45}
  #${ID} .vc-help.show{display:block}
  #${ID} .vc-help b{color:#17151a}
  #${ID} .vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 20px 18px}
  #${ID} .vc-card{background:#fff;border:1px solid #ece8ee;border-radius:16px;padding:13px;min-width:0}
  #${ID} .vc-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  #${ID} .vc-vibe{font-size:25px}
  #${ID} .vc-live{font-size:9px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:.05em}
  #${ID} .vc-name{font-weight:900;font-size:15px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #${ID} .vc-meta{font-size:10px;color:#77727b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #${ID} .vc-signal{margin-top:9px;font-size:11px;font-weight:850}
  #${ID} .vc-pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  #${ID} .vc-pill{background:#f5f1f7;border-radius:999px;padding:5px 7px;font-size:9px;font-weight:800}
  #${ID} .vc-empty{padding:0 20px 18px}
  #${ID} .vc-empty-inner{background:#fff;border:1px dashed #ddd5e2;border-radius:16px;padding:14px;text-align:center;color:#77727b;font-size:11px;line-height:1.45}
  #${ID} .vc-privacy{padding:0 20px 15px;font-size:9px;color:#8a858d}
  @media(max-width:850px){
    #${ID}{width:auto;max-width:100%;margin:0 0 18px;border-radius:20px}
    #${ID} .vc-nearby-head{align-items:flex-start;flex-direction:column;padding:16px 16px 11px}
    #${ID} h2{font-size:21px}
    #${ID} .vc-copy{font-size:12px}
    #${ID} .vc-status{padding:0 16px 11px}
    #${ID} .vc-help{margin-left:16px;margin-right:16px}
    #${ID} .vc-loc{width:100%;min-width:0;padding:12px 14px}
    #${ID} .vc-cards{grid-template-columns:1fr;padding-left:16px;padding-right:16px}
    #${ID} .vc-empty{padding-left:16px;padding-right:16px}
    #${ID} .vc-privacy{padding-left:16px;padding-right:16px}
  }
  `;
  document.head.appendChild(style);

  function mount(){
    const content=document.getElementById('exploreContent');
    if(document.getElementById(ID)||!content) return;
    const host=document.createElement('section');
    host.id=ID;
    host.innerHTML=`<div class="vc-nearby-head"><div><div class="vc-kicker">⚡ Live nearby</div><h2>What's happening around you?</h2><p class="vc-copy">This is not Yelp. Places appear here because people are actually checking in right now.</p></div><button class="vc-loc" id="vcLocate">📍 Use my location</button></div><div class="vc-status" id="vcStatus">Turn on location to see the live pulse around you.</div><div class="vc-help" id="vcHelp"><b>Location is blocked.</b> Safari may have previously denied access. In Safari, open <b>Settings for This Website → Location → Allow</b>, then return here and tap <b>Try location again</b>.</div><div class="vc-empty" id="vcEmpty"><div class="vc-empty-inner">🔒 Your precise location stays in your browser. We only use it to find nearby anonymous Vibe Check activity.</div></div><div class="vc-cards" id="vcCards" style="display:none"></div><div class="vc-privacy">Live activity comes from recent anonymous check-ins, not old review history.</div>`;
    content.prepend(host);
    document.getElementById('vcLocate').addEventListener('click',locate);
  }

  async function locationState(){
    try{
      if(navigator.permissions?.query){
        const p=await navigator.permissions.query({name:'geolocation'});
        return p.state;
      }
    }catch(e){}
    return 'unknown';
  }

  async function locate(){
    const btn=document.getElementById('vcLocate'),status=document.getElementById('vcStatus'),empty=document.getElementById('vcEmpty'),help=document.getElementById('vcHelp');
    if(!navigator.geolocation){status.textContent='Location is not available in this browser.';return;}
    help.classList.remove('show');
    const state=await locationState();
    if(state==='denied'){
      btn.textContent='📍 Try location again';
      help.classList.add('show');
      status.textContent='Vibe Check cannot access your location yet.';
      return;
    }
    btn.disabled=true;btn.textContent='📍 Finding you…';status.textContent='Finding the live pulse around you…';
    navigator.geolocation.getCurrentPosition(async p=>{
      status.innerHTML='📍 <strong>Nearby mode is on</strong> · within 5 miles';
      btn.disabled=false;btn.textContent='↻ Refresh nearby';
      await load(p.coords.latitude,p.coords.longitude);
    },async err=>{
      btn.disabled=false;btn.textContent='📍 Try location again';
      if(err?.code===1){
        help.classList.add('show');
        status.textContent='Vibe Check needs location permission to show what is happening nearby.';
      }else if(err?.code===2){
        status.textContent='Your location could not be determined. Try again in a moment.';
      }else{
        status.textContent='Location timed out. Try again.';
      }
      empty.style.display='block';
    },{enableHighAccuracy:false,timeout:15000,maximumAge:300000});
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
      cards.innerHTML=places.slice(0,6).map(p=>{
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
