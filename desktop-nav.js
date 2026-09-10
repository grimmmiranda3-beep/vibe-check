// Vibely Check — navigation bridge
(function(){
  'use strict';
  function loadAskVibely(){
    if(document.getElementById('askVibelyLauncher')) return;
    if(document.querySelector('script[data-ask-vibely-loader="1"]')) return;
    const script=document.createElement('script');
    script.src='/ask-vibely-ui.js?v=desktop-mobile-safe';
    script.async=false;
    script.dataset.askVibelyLoader='1';
    document.head.appendChild(script);
  }
  function businessTarget(el){
    if(!el) return false;
    const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    return t.includes('for businesses') || el.id==='businessBtn';
  }
  function hardBusinessRoute(e){
    const btn=e.target && e.target.closest ? e.target.closest('button,a,[role="button"]') : null;
    if(!businessTarget(btn)) return;
    if(e.defaultPrevented) e.preventDefault();
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    window.location.assign('/business.html');
  }
  function init(){
    loadAskVibely();
    document.addEventListener('click',hardBusinessRoute,true);
    const nav=document.querySelector('.nav');
    if(!nav || nav.dataset.sharedDesktopNav==='1') return;
    nav.dataset.sharedDesktopNav='1';
    const existingBusiness=document.getElementById('businessBtn');
    if(existingBusiness){
      existingBusiness.textContent='🏪 For Businesses';
      existingBusiness.setAttribute('aria-label','For Businesses');
    }
    const trending=document.createElement('button');
    trending.id='desktopTrendingBtn'; trending.type='button'; trending.textContent='🔥 Trending';
    trending.addEventListener('click',()=>{window.location.href='/feed.html';});
    const profile=document.createElement('button');
    profile.id='desktopProfileBtn'; profile.type='button'; profile.textContent='👤 Profile'; profile.setAttribute('aria-label','My Profile');
    profile.addEventListener('click',()=>{window.location.href='/profile.html';});
    nav.appendChild(trending);
    if(existingBusiness) nav.appendChild(existingBusiness);
    nav.appendChild(profile);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
