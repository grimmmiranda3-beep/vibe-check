// Vibely Check — shared navigation and Ask Vibely loader.
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

  function showTrending(){
    const hero=document.getElementById('explore');
    const content=document.getElementById('exploreContent');
    const business=document.getElementById('business');
    const filters=content?.querySelector('.filters');
    const layout=content?.querySelector('.layout');
    const credit=content?.querySelector('.google-credit');
    const help=hero?.querySelector('.search-help');

    document.body.classList.add('vc-trending-mode');
    hero?.style.setProperty('display','none');
    content?.style.setProperty('display','block');
    filters?.style.setProperty('display','none');
    layout?.style.setProperty('display','none');
    credit?.style.setProperty('display','none');
    help?.style.setProperty('display','none');
    business?.classList.remove('show');

    if(window.VibelyTrending?.render){
      window.VibelyTrending.render();
      setTimeout(()=>document.getElementById('vibelyTrending')?.scrollIntoView({behavior:'smooth',block:'start'}),100);
    }
  }

  function showExplore(){
    const hero=document.getElementById('explore');
    const content=document.getElementById('exploreContent');
    const filters=content?.querySelector('.filters');
    const layout=content?.querySelector('.layout');
    const credit=content?.querySelector('.google-credit');
    const help=hero?.querySelector('.search-help');
    document.body.classList.remove('vc-trending-mode');
    hero?.style.setProperty('display','block');
    content?.style.setProperty('display','block');
    filters?.style.removeProperty('display');
    layout?.style.removeProperty('display');
    credit?.style.removeProperty('display');
    help?.style.removeProperty('display');
    document.getElementById('business')?.classList.remove('show');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function bindMobileNav(){
    if(document.documentElement.dataset.vcMobileNavBound==='1') return;
    document.documentElement.dataset.vcMobileNavBound='1';

    // The mobile bottom navigation is rendered by the main app. Intercept its
    // Trending action before the generic Explore handler can reset the view.
    document.addEventListener('click',function(e){
      const target=e.target?.closest?.('button,a');
      if(!target) return;
      const text=(target.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(text.includes('trending')){
        e.preventDefault();
        e.stopImmediatePropagation();
        showTrending();
        return;
      }
      if(text.includes('explore') && document.body.classList.contains('vc-trending-mode')){
        e.preventDefault();
        e.stopImmediatePropagation();
        showExplore();
      }
    },true);
  }

  function init(){
    loadAskVibely();
    bindMobileNav();

    const nav=document.querySelector('.nav');
    if(!nav || nav.dataset.sharedDesktopNav==='1') return;
    nav.dataset.sharedDesktopNav='1';

    const existingBusiness=document.getElementById('businessBtn');
    if(existingBusiness){
      existingBusiness.textContent='🏪 For Businesses';
      existingBusiness.setAttribute('aria-label','For Businesses');
    }

    const trending=document.createElement('button');
    trending.id='desktopTrendingBtn';
    trending.type='button';
    trending.textContent='🔥 Trending';
    trending.addEventListener('click',function(){
      document.getElementById('explore')?.style.setProperty('display','block');
      document.getElementById('exploreContent')?.style.setProperty('display','block');
      document.getElementById('business')?.classList.remove('show');
      document.getElementById('exploreBtn')?.classList.remove('active');
      existingBusiness?.classList.remove('active');
      trending.classList.add('active');
      const panel=document.getElementById('vibelyTrending');
      if(panel){panel.scrollIntoView({behavior:'smooth',block:'start'});}
      else if(window.VibelyTrending?.render){
        window.VibelyTrending.render();
        setTimeout(()=>document.getElementById('vibelyTrending')?.scrollIntoView({behavior:'smooth',block:'start'}),300);
      }
    });

    const profile=document.createElement('button');
    profile.id='desktopProfileBtn';
    profile.type='button';
    profile.textContent='👤 Profile';
    profile.setAttribute('aria-label','My Profile');
    profile.addEventListener('click',()=>{window.location.href='/profile.html';});

    nav.appendChild(trending);
    if(existingBusiness) nav.appendChild(existingBusiness);
    nav.appendChild(profile);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
