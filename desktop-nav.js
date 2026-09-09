// Vibely Check — shared desktop navigation.
(function(){
  'use strict';
  function init(){
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

    // Keep the same destination order on desktop as mobile: Explore, Trending, Businesses, Profile.
    nav.appendChild(trending);
    nav.appendChild(existingBusiness || document.createElement('span'));
    if(existingBusiness && existingBusiness.parentNode===nav) nav.appendChild(profile);
    else nav.appendChild(profile);

    const updateActive=()=>{
      const businessVisible=document.getElementById('business')?.classList.contains('show');
      const trendingPanel=document.getElementById('vibelyTrending');
      const nearTrending=trendingPanel && Math.abs(trendingPanel.getBoundingClientRect().top)<160;
      if(businessVisible){trending.classList.remove('active');profile.classList.remove('active');}
      else if(nearTrending){trending.classList.add('active');}
    };
    window.addEventListener('scroll',updateActive,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
