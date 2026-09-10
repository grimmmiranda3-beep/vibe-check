// Vibe Check — live nearby pulse, strictly based on the user's device location.
// Search/exploration never changes this feed. The selected radius only changes
// how far we look from the device coordinates.
(function(){
  'use strict';
  const ID='vcNearbyHome';
  const RADII=[1,5,10,25,50];
  const DEFAULT_RADIUS=5;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const vibeWords={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};
  let radius=DEFAULT_RADIUS;
  let lastPosition=null;

  function readRadius(){
    try{
      const saved=Number(localStorage.getItem('vc_nearby_radius'));
      if(RADII.includes(saved)) radius=saved;
    }catch(e){}
  }

  function addStyles(){
    if(document.getElementById(ID+'Styles')) return;
    const style=document.createElement('style');
    style.id=ID+'Styles';
    style.textContent=`
      #${ID}{width:100%;margin:0 0 20px;background:#fff;border:1px solid #e9e1f0;border-radius:24px;box-shadow:0 12px 34px rgba(25,18,35,.06);overflow:hidden}
      #${ID} .vc-nearby-head{padding:18px 20px 10px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
      #${ID} .vc-head-left{min-width:0}
      #${ID} .vc-kicker{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;color:#7c3aed}
      #${ID} .vc-live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px #22c55e18}
      #${ID} h2{font-size:22px;margin:5px 0 3px;line-height:1.1}
      #${ID} .vc-copy{font-size:12px;color:#77727b;line-height:1.45;margin:0;max-width:720px}
      #${ID} .vc-loc{border:0;background:#17151a;color:#fff;border-radius:13px;padding:10px 14px;font-weight:900;white-space:nowrap;cursor:pointer;min-width:174px;transition:.15s}
      #${ID} .vc-loc:hover{transform:translateY(-1px)}
      #${ID} .vc-loc:disabled{opacity:.65;cursor:wait;transform:none}
      #${ID} .vc-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 20px 12px}
      #${ID} .vc-status{font-size:11px;color:#77727b;min-width:0}
      #${ID} .vc-status strong{color:#17151a}
      #${ID} .vc-radius-wrap{display:flex;align-items:center;gap:7px;flex-shrink:0}
      #${ID} .vc-radius-label{font-size:10px;color:#77727b;font-weight:800}
      #${ID} .vc-radius{border:1px solid #e9e1f0;background:#f8f5fb;color:#6d28d9;border-radius:999px;padding:7px 10px;font-weight:900;font-size:11px;cursor:pointer;outline:0}
      #${ID} .vc-help{display:none;margin:0 20px 14px;padding:12px 14px;background:#faf8ff;border:1px solid #e8defa;border-radius:14px;color:#6f6875;font-size:11px;line-height:1.5}
      #${ID} .vc-help.show{display:block}
      #${ID} .vc-help b{color:#17151a}
      #${ID} .vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 20px 18px}
      #${ID} .vc-card{background:linear-gradient(180deg,#fff,#fcf9ff);border:1px solid #ece8ee;border-radius:17px;padding:13px;min-width:0}
      #${ID} .vc-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      #${ID} .vc-vibe{font-size:25px;line-height:1}
      #${ID} .vc-live{font-size:9px;font-weight:950;color:#16a34a;text-transform:uppercase;letter-spacing:.05em}
      #${ID} .vc-name{font-weight:900;font-size:15px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${ID} .vc-meta{font-size:10px;color:#77727b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${ID} .vc-signal{margin-top:9px;font-size:11px;font-weight:850}
      #${ID} .vc-pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      #${ID} .vc-pill{background:#f5f1f7;border-radius:999px;padding:5px 7px;font-size:9px;font-weight:800}
      #${ID} .vc-empty{padding:0 20px 18px}
      #${ID} .vc-empty-inner{background:linear-gradient(135deg,#faf8ff,#fff7fb);border:1px dashed #dcd2e6;border-radius:17px;padding:18px;text-align:center;color:#77727b;font-size:12px;line-height:1.5}
      #${ID} .vc-empty-title{font-size:15px;font-weight:900;color:#17151a;margin-bottom:4px}
      #${ID} .vc-empty-btn{margin-top:11px;border:0;border-radius:11px;background:#17151a;color:#fff;padding:9px 13px;font-size:11px;font-weight:900;cursor:pointer}
      #${ID} .vc-privacy{padding:0 20px 15px;font-size:9px;color:#8a858d}
      @media(max-width:850px){
        #${ID}{width:100%;max-width:100%;margin:0 0 18px;border-radius:20px}
        #${ID} .vc-nearby-head{padding:16px 16px 10px;gap:12px}
        #${ID} h2{font-size:21px}
        #${ID} .vc-copy{font-size:12px}
        #${ID} .vc-loc{width:auto;min-width:0;padding:10px 12px}
        #${ID} .vc-controls{padding:0 16px 11px;align-items:flex-start}
        #${ID} .vc-cards{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 16px 16px}
        #${ID} .vc-card{flex:0 0 82%;scroll-snap-align:start}
        #${ID} .vc-empty{padding-left:16px;padding-right:16px}
        #${ID} .vc-privacy{padding-left:16px;padding-right:16px}
      }
      @media(max-width:520px){
        #${ID} .vc-nearby-head{display:block;padding:16px}
        #${ID} .vc-head-left{width:100%}
        #${ID} .vc-loc{display:block;width:100%;min-width:0;margin-top:13px;padding:12px 14px;font-size:13px}
        #${ID} .vc-controls{flex-direction:column;gap:9px}
        #${ID} .vc-radius-wrap{width:100%;justify-content:space-between}
        #${ID} .vc-radius{flex:1}
      }
    `;
    document.head.appendChild(style);
  }

  function mount(){
    const content=document.getElementById('exploreContent');
    if(document.getElementById(ID)||!content) return;
    readRadius();
    const host=document.createElement('section');
    host.id=ID;
    host.innerHTML=`<div class="vc-nearby-head"><div class="vc-head-left"><div class="vc-kicker"><span class="vc-live-dot"></span>Live nearby</div><h2>What's happening around you?</h2><p class="vc-copy">Only places with recent anonymous check-ins appear here. Your search does not change Nearby — this is always based on your device location.</p></div><button class="vc-loc" id="vcLocate" type="button">📍 Use my location</button></div><div class="vc-controls"><span class="vc-status" id="vcStatus">Turn on location to see the live pulse around you.</span><label class="vc-radius-wrap"><span class="vc-radius-label">Search radius</span><select class="vc-radius" id="vcRadius" aria-label="Nearby search radius">${RADII.map(r=>`<option value="${r}" ${r===radius?'selected':''}>📍 Within ${r} mile${r===1?'':'s'}</option>`).join('')}</select></label></div><div class="vc-help" id="vcHelp"><b>Location access is blocked.</b> If Safari previously denied access, open this site's settings and set <b>Location → Allow</b>, then return and tap <b>Try location again</b>.</div><div class="vc-empty" id="vcEmpty"><div class="vc-empty-inner"><div class="vc-empty-title">Your live neighborhood pulse</div>Allow location to see where people are checking in right now.</div></div><div class="vc-cards" id="vcCards" style="display:none"></div><div class="vc-privacy">🔒 Your precise location stays in your browser. We use it only to find nearby anonymous Vibe Check activity.</div>`;
    content.prepend(host);
    document.getElementById('vcLocate').addEventListener('click',locate);
    document.getElementById('vcRadius').addEventListener('change',async e=>{
      const next=Number(e.target.value); if(!RADII.includes(next)) return;
      radius=next;
      try{localStorage.setItem('vc_nearby_radius',String(radius))}catch(err){}
      if(lastPosition) await load(lastPosition.latitude,lastPosition.longitude);
      else document.getElementById('vcStatus').innerHTML=`Choose <strong>${radius} miles</strong> and turn on location to see the live pulse.`;
    });
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

  function setRadiusText(){
    const s=document.getElementById('vcStatus');
    if(s) s.innerHTML=`📍 <strong>Nearby mode is on</strong> · live activity within ${radius} mile${radius===1?'':'s'}`;
  }

  async function locate(){
    const btn=document.getElementById('vcLocate'),status=document.getElementById('vcStatus'),empty=document.getElementById('vcEmpty'),help=document.getElementById('vcHelp');
    if(!btn||!status||!empty||!help) return;
    if(!window.isSecureContext){status.textContent='Location requires a secure connection. Please use the HTTPS Vibe Check site.';return}
    if(!navigator.geolocation){status.textContent='Location is not available in this browser.';return}
    help.classList.remove('show');
    const state=await locationState();
    if(state==='denied'){
      btn.textContent='📍 Try location again';
      help.classList.add('show');
      status.innerHTML='Vibe Check cannot access your location yet.';
      return;
    }
    btn.disabled=true;btn.textContent='📍 Finding you…';status.textContent='Finding the live pulse around you…';
    navigator.geolocation.getCurrentPosition(async p=>{
      lastPosition={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy};
      btn.disabled=false;btn.textContent='↻ Refresh nearby';
      await load(lastPosition.latitude,lastPosition.longitude);
    },err=>{
      btn.disabled=false;btn.textContent='📍 Try location again';
      if(err?.code===1){help.classList.add('show');status.textContent='Vibe Check needs location permission to show what is happening nearby.';}
      else if(err?.code===2)status.textContent='Your location could not be determined. Try again in a moment.';
      else status.textContent='Location timed out. Try again.';
      empty.style.display='block';
    },{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
  }

  async function load(lat,lng){
    const cards=document.getElementById('vcCards'),empty=document.getElementById('vcEmpty'),status=document.getElementById('vcStatus');
    try{
      const r=await fetch(`/api/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}&_=${Date.now()}`,{cache:'no-store'});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||'Nearby pulse unavailable');
      const places=Array.isArray(data.places)?data.places:[];
      if(!places.length){
        cards.style.display='none';empty.style.display='block';
        const next=RADII.find(r=>r>radius);
        empty.innerHTML=`<div class="vc-empty-inner"><div class="vc-empty-title">Nothing is buzzing within ${radius} mile${radius===1?'':'s'} yet. 💜</div><div>Vibe Check only shows recent anonymous check-ins. No old reviews. No popularity contest.</div>${next?`<button class="vc-empty-btn" type="button" data-expand="${next}">Expand to ${next} miles</button>`:'<div style="margin-top:10px;font-weight:800;color:#17151a">Be the first to set the vibe.</div>'}</div>`;
        status.innerHTML=`📍 <strong>Nearby mode is on</strong> · no live activity within ${radius} mile${radius===1?'':'s'}`;
        const expand=empty.querySelector('[data-expand]');
        if(expand)expand.addEventListener('click',()=>{radius=Number(expand.dataset.expand);const select=document.getElementById('vcRadius');if(select)select.value=String(radius);try{localStorage.setItem('vc_nearby_radius',String(radius))}catch(e){}load(lat,lng)});
        return;
      }
      empty.style.display='none';cards.style.display='grid';
      status.innerHTML=`📍 <strong>${places.length} live ${places.length===1?'place':'places'}</strong> within ${radius} mile${radius===1?'':'s'}`;
      cards.innerHTML=places.slice(0,6).map(p=>{
        const emoji=p.dominant||'💜',label=vibeWords[emoji]||'Live vibe';
        const total=Number(p.total||0),pct=Number(p.dominant_percent||0),distance=p.distance_miles!=null?`${p.distance_miles} mi`:'Nearby';
        return `<article class="vc-card"><div class="vc-card-top"><div><div class="vc-live">● Live signal</div><div class="vc-name" title="${esc(p.place_name||'Local place')}">${esc(p.place_name||'Local place')}</div><div class="vc-meta" title="${esc(p.place_address||'Nearby')}">${esc(p.place_address||'Nearby')}</div></div><div class="vc-vibe">${esc(emoji)}</div></div><div class="vc-signal">${esc(label)}${pct?` · ${pct}%`:''}</div><div class="vc-pills"><span class="vc-pill">⚡ ${total} check-in${total===1?'':'s'}</span><span class="vc-pill">📍 ${esc(distance)}</span></div></article>`;
      }).join('');
    }catch(e){
      cards.style.display='none';empty.style.display='block';
      empty.innerHTML='<div class="vc-empty-inner"><div class="vc-empty-title">We lost the live pulse for a moment.</div><div>Please try again — your location is never stored here.</div><button class="vc-empty-btn" type="button" data-retry>Try again</button></div>';
      empty.querySelector('[data-retry]')?.addEventListener('click',()=>load(lat,lng));
      status.textContent='We could not load the live nearby pulse.';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addStyles();mount()});else{addStyles();mount()}
})();
