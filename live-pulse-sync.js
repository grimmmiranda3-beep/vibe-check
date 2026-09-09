// Vibe Check — keep the Nearby pulse in sync after a successful check-in.
// This reinforces the product loop: check in -> immediately see your place in the live neighborhood pulse.
(function(){
  'use strict';
  const ID='vcLivePulseSync';
  if(window.__vcLivePulseSync) return;
  window.__vcLivePulseSync=true;

  function refreshNearby(){
    const host=document.getElementById('vcNearbyHome');
    const btn=document.getElementById('vcLocate');
    if(!host||!btn) return;
    // Only refresh when the app already has a granted/active location session.
    if(btn.textContent.includes('Refresh nearby')){
      btn.click();
    }
  }

  function watchFetch(){
    if(window.__vcLivePulseFetchPatched) return;
    const original=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await original(input,init);
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(init?.method||input?.method||'GET').toUpperCase();
        if(url.includes('/api/checkin') && method==='POST' && response.ok){
          const copy=response.clone();
          copy.json().then(data=>{
            if(data?.ok){
              // Let the success UI finish rendering before the nearby cards refresh.
              setTimeout(refreshNearby,350);
            }
          }).catch(()=>{});
        }
      }catch(e){}
      return response;
    };
    window.__vcLivePulseFetchPatched=true;
  }

  function init(){
    watchFetch();
    window.addEventListener('vc:checkin-complete',()=>setTimeout(refreshNearby,350));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
