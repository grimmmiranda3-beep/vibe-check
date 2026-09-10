// Vibe Check — keep the Nearby pulse in sync after a successful check-in.
// This script deliberately does NOT modify the check-in request itself.
// The core saveVibe() flow and checkin-polish.js own the submission payload.
(function(){
  'use strict';
  if(window.__vcLivePulseSyncV4) return;
  window.__vcLivePulseSyncV4=true;

  function refreshNearby(){
    const btn=document.getElementById('vcLocate');
    if(!btn) return;
    if(btn.textContent.includes('Refresh nearby')) btn.click();
  }

  function watchFetch(){
    if(window.__vcLivePulseFetchPatchedV4) return;
    const original=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await original(input,init);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(init?.method||input?.method||'GET').toUpperCase();
        if(url.includes('/api/checkin')&&method==='POST'&&response.ok){
          const copy=response.clone();
          copy.json().then(data=>{
            if(data?.ok) setTimeout(refreshNearby,500);
          }).catch(()=>{});
        }
      }catch(e){}
      return response;
    };
    window.__vcLivePulseFetchPatchedV4=true;
  }

  function init(){
    watchFetch();
    window.addEventListener('vc:checkin-complete',()=>setTimeout(refreshNearby,500));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
