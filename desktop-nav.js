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

  function init(){
    loadAskVibely();

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
