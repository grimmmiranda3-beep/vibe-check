// Vibe Check — resilient browser OAuth callback handler
// Ensures PKCE callbacks finish cleanly even if the automatic URL detection
// completes before the profile page's auth-state listener is attached.
(function(){
  'use strict';
  function boot(){
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    const error=params.get('error')||params.get('error_description');
    if(!code&&!error)return;

    const cleanUrl=window.location.origin+window.location.pathname;
    const wait=()=>window.sb?.auth ? Promise.resolve(window.sb) : new Promise(resolve=>{
      const started=Date.now();
      const timer=setInterval(()=>{
        if(window.sb?.auth){clearInterval(timer);resolve(window.sb);}
        else if(Date.now()-started>8000){clearInterval(timer);resolve(null);}
      },100);
    });

    wait().then(async(client)=>{
      if(!client)return;
      if(error){
        const message=document.getElementById('message');
        if(message){message.textContent=decodeURIComponent(error.replace(/\+/g,' '));message.classList.add('show');}
        history.replaceState({},document.title,cleanUrl);
        return;
      }
      try{
        const {data,error:exchangeError}=await client.auth.exchangeCodeForSession(code);
        if(exchangeError)throw exchangeError;
        history.replaceState({},document.title,cleanUrl);
        if(typeof window.renderSession==='function')window.renderSession(data.session);
        if(typeof window.loadHistory==='function')setTimeout(window.loadHistory,0);
      }catch(e){
        const message=document.getElementById('message');
        if(message){message.textContent=e?.message||'Google sign-in could not be completed. Please try again.';message.classList.add('show');}
        history.replaceState({},document.title,cleanUrl);
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
