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
  function addMobileNav(){
    if(document.getElementById('vibeMobileNav')) return;
    const style=document.createElement('style');
    style.textContent=`
      #vibeMobileNav{display:none}
      @media(max-width:850px){
        #vibeMobileNav{position:fixed;left:0;right:0;bottom:0;z-index:45;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid #ece8ee;backdrop-filter:blur(14px);box-shadow:0 -8px 24px rgba(25,18,35,.08)}
        #vibeMobileNav button{border:0;background:transparent;border-radius:12px;padding:8px 3px;color:#77727b;font:700 11px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
        #vibeMobileNav button.active{background:#f2edf8;color:#7c3aed}
        body{padding-bottom:76px}
      }
    `;
    document.head.appendChild(style);
    const nav=document.createElement('nav');
    nav.id='vibeMobileNav';
    nav.setAttribute('aria-label','Mobile navigation');
    const items=[
      ['📍','Explore','/'],
      ['🔥','Trending','/feed.html'],
      ['🏪','Businesses','/business.html'],
      ['👤','Profile','/profile.html']
    ];
    items.forEach(([icon,label,url])=>{
      const button=document.createElement('button');
      button.type='button';
      button.innerHTML=`<span aria-hidden="true">${icon}</span><br>${label}`;
      const path=window.location.pathname.replace(/\\/$/,'')||'/';
      const target=url.replace(/\\/$/,'')||'/';
      if(path===target) button.classList.add('active');
      button.addEventListener('click',()=>{window.location.href=url;});
      nav.appendChild(button);
    });
    document.body.appendChild(nav);
  }
  function init(){
    loadAskVibely();
    document.addEventListener('click',hardBusinessRoute,true);
    addMobileNav();
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
