// Vibe Check — protect the Nearby signal by attaching the user's real device location to every check-in.
// Business coordinates are never used as the user's location.
(function(){
  'use strict';
  if(window.__vcCheckinLocationPatched) return;

  function getDevicePosition(){
    return new Promise((resolve,reject)=>{
      if(!window.isSecureContext){
        reject(new Error('Location is required to check in. Please use the secure Vibe Check site.'));
        return;
      }
      if(!navigator.geolocation){
        reject(new Error('Location is not available in this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        p=>resolve(p),
        err=>{
          if(err?.code===1) reject(new Error('Location is required to check in so Nearby stays accurate. Please allow location and try again.'));
          else if(err?.code===2) reject(new Error('We could not determine your location. Please try again.'));
          else reject(new Error('Location timed out. Please try again.'));
        },
        {enableHighAccuracy:true,timeout:15000,maximumAge:30000}
      );
    });
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      const method=String(init?.method||input?.method||'GET').toUpperCase();
      if(method==='POST' && url.includes('/api/checkin')){
        let body=init?.body;
        if(typeof body==='string'){
          const payload=JSON.parse(body);
          const position=await getDevicePosition();
          payload.latitude=position.coords.latitude;
          payload.longitude=position.coords.longitude;
          payload.accuracy=position.coords.accuracy;
          init={...(init||{}),body:JSON.stringify(payload)};
        }
      }
    }catch(e){
      if(e instanceof Error && /Location|secure|browser|determine|timed out/i.test(e.message)) throw e;
    }
    return originalFetch(input,init);
  };

  window.__vcCheckinLocationPatched=true;
})();
