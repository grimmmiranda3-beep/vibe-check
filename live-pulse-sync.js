// Vibe Check — keep the Nearby pulse in sync after a successful check-in.
// Also guarantees that check-ins carry the user's current location so the
// live Nearby query has coordinates to work with.
(function(){
  'use strict';
  if(window.__vcLivePulseSyncV3) return;
  window.__vcLivePulseSyncV3=true;

  const getPosition=()=>new Promise(resolve=>{
    if(!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude}),
      ()=>resolve(null),
      {enableHighAccuracy:true,maximumAge:60000,timeout:3500}
    );
  });

  function refreshNearby(){
    const host=document.getElementById('vcNearbyHome');
    const btn=document.getElementById('vcLocate');
    if(!host||!btn) return;
    if(btn.textContent.includes('Refresh nearby')) btn.click();
  }

  // The original page already includes 😕 in its six core vibes. Older
  // polish code also injected a second "Not my vibe" button, which could
  // create duplicate choices and inconsistent payloads. Keep one copy.
  function dedupeNotMyVibe(){
    document.querySelectorAll('.emoji-row').forEach(row=>{
      const buttons=[...row.querySelectorAll('.emoji')];
      const notMy=buttons.filter(b=>b.textContent.trim()==='😕');
      if(notMy.length>1) notMy.slice(1).forEach(b=>b.remove());
    });
  }

  async function prepareCheckin(input,init){
    const method=(init?.method||input?.method||'GET').toUpperCase();
    const url=typeof input==='string'?input:(input?.url||'');
    if(method!=='POST'||!url.includes('/api/checkin')||!init?.body) return {input,init};
    let body;
    try{body=JSON.parse(init.body)}catch{return {input,init};}
    if(!body||typeof body!=='object') return {input,init};
    const lat=Number(body.latitude),lng=Number(body.longitude);
    if(Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lng)&&Math.abs(lng)<=180) return {input,init};
    const pos=await getPosition();
    if(pos){
      body.latitude=pos.latitude;
      body.longitude=pos.longitude;
      return {input,init:{...init,body:JSON.stringify(body)}};
    }
    return {input,init};
  }

  function watchFetch(){
    if(window.__vcLivePulseFetchPatchedV3) return;
    const original=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const prepared=await prepareCheckin(input,init);
      const response=await original(prepared.input,prepared.init);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(prepared.init?.method||input?.method||'GET').toUpperCase();
        if(url.includes('/api/checkin')&&method==='POST'&&response.ok){
          const copy=response.clone();
          copy.json().then(data=>{if(data?.ok)setTimeout(refreshNearby,500)}).catch(()=>{});
        }
      }catch(e){}
      return response;
    };
    window.__vcLivePulseFetchPatchedV3=true;
  }

  function init(){
    watchFetch();
    dedupeNotMyVibe();
    const modal=document.getElementById('modal');
    if(modal) new MutationObserver(dedupeNotMyVibe).observe(modal,{childList:true,subtree:true});
    window.addEventListener('vc:checkin-complete',()=>setTimeout(refreshNearby,500));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
