// Vibe Check — resilient browser Google sign-in
(function(){
  'use strict';
  const GOOGLE_CLIENT_ID='968914547854-13iam4osfucttrm6scmgsvld9udnav6.apps.googleusercontent.com';

  function getClient(){
    try{return typeof sb!=='undefined'&&sb?.auth?sb:null}catch{return null}
  }
  function showMessage(text){
    const el=document.getElementById('message');
    if(el){el.textContent=text;el.classList.add('show')}
  }

  let gsiReady=null;
  let googleButtonRendered=false;

  const loadGoogle=()=>{
    if(gsiReady)return gsiReady;
    gsiReady=new Promise((resolve,reject)=>{
      if(window.google?.accounts?.id){resolve();return}
      const existing=document.querySelector('script[data-vibe-google-gsi]');
      if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true;
      s.defer=true;
      s.dataset.vibeGoogleGsi='1';
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
    return gsiReady;
  };

  async function setupGoogleIdTokenFallback(){
    const button=document.getElementById('googleBtn');
    if(!button)return;
    const client=getClient();
    if(!client)return;

    // Replace the legacy Supabase OAuth onclick immediately. The old handler
    // sent the browser to auth.vibelycheck.com and produced invalid_client.
    button.onclick=function(event){
      if(event)event.preventDefault();
      return startGoogleSignIn();
    };

    try{
      await loadGoogle();
      const rawNonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      const hashBuffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(rawNonce));
      const hashedNonce=Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');

      window.handleVibeGoogleCredential=async function(response){
        try{
          const {data,error}=await client.auth.signInWithIdToken({
            provider:'google',
            token:response.credential,
            nonce:rawNonce
          });
          if(error)throw error;
          if(typeof renderSession==='function')renderSession(data.session);
          if(typeof loadHistory==='function')setTimeout(loadHistory,0);
        }catch(e){
          showMessage(e?.message||'Google sign-in could not be completed. Please try again.');
        }finally{
          button.disabled=false;
        }
      };

      const wrap=document.createElement('div');
      wrap.id='googleGsiWrap';
      wrap.style.cssText='position:relative;width:100%;height:48px;margin-top:9px;overflow:hidden;border-radius:13px;';
      button.parentNode.insertBefore(wrap,button);
      button.style.display='none';
      window.google.accounts.id.initialize({
        client_id:GOOGLE_CLIENT_ID,
        callback:window.handleVibeGoogleCredential,
        nonce:hashedNonce,
        ux_mode:'popup'
      });
      window.google.accounts.id.renderButton(wrap,{
        type:'standard',
        theme:'outline',
        size:'large',
        text:'signin_with',
        shape:'rectangular',
        logo_alignment:'left',
        width:wrap.clientWidth||640
      });
      googleButtonRendered=true;
    }catch(e){
      // Never restore the legacy OAuth handler.
      button.disabled=false;
      showMessage('Google sign-in could not load. Please refresh and try again.');
    }
  }

  async function startGoogleSignIn(){
    const button=document.getElementById('googleBtn');
    if(!button)return false;
    const client=getClient();
    if(!client){showMessage('Google sign-in is not connected yet.');return false}
    if(googleButtonRendered)return false;
    button.disabled=true;
    await setupGoogleIdTokenFallback();
    if(!googleButtonRendered)button.disabled=false;
    return false;
  }

  function boot(){
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    const error=params.get('error')||params.get('error_description');
    if(code||error){
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

    const started=Date.now();
    const wait=()=>{
      const button=document.getElementById('googleBtn');
      if(getClient()&&button){
        // Override the inline legacy handler before the user can click it.
        button.onclick=function(event){
          if(event)event.preventDefault();
          return startGoogleSignIn();
        };
        setupGoogleIdTokenFallback();
        return;
      }
      if(Date.now()-started<8000){setTimeout(wait,100);return}
    };
    wait();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
