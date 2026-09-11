// Vibe Check — resilient browser OAuth callback handler
(function(){
  'use strict';
  function getClient(){
    try{return typeof sb!=='undefined'&&sb?.auth?sb:null}catch{return null}
  }
  function showMessage(text){
    const el=document.getElementById('message');
    if(el){el.textContent=text;el.classList.add('show')}
  }
  function boot(){
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    const error=params.get('error')||params.get('error_description');
    if(!code&&!error)return;
    const cleanUrl=window.location.origin+window.location.pathname;
    const started=Date.now();
    const finish=()=>{
      const client=getClient();
      if(!client){
        if(Date.now()-started<8000){setTimeout(finish,100);return}
        showMessage('Google sign-in could not connect to Vibe Check. Please try again.');
        return;
      }
      (async()=>{
        if(error){
          showMessage(decodeURIComponent(error.replace(/\+/g,' ')));
          history.replaceState({},document.title,cleanUrl);
          return;
        }
        try{
          const {data,error:exchangeError}=await client.auth.exchangeCodeForSession(code);
          if(exchangeError)throw exchangeError;
          history.replaceState({},document.title,cleanUrl);
          if(typeof renderSession==='function')renderSession(data.session);
          if(typeof loadHistory==='function')setTimeout(loadHistory,0);
        }catch(e){
          showMessage(e?.message||'Google sign-in could not be completed. Please try again.');
          history.replaceState({},document.title,cleanUrl);
        }
      })();
    };
    finish();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
