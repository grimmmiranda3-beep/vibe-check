// Vibely Check — mobile business experience polish
(function(){'use strict';
function init(){
 if(document.getElementById('vibelyMobilePolish')) return;
 const style=document.createElement('style'); style.id='vibelyMobilePolish'; style.textContent=`
@media(max-width:850px){
 body{padding-bottom:96px}
 .top{height:76px;padding:0 18px;position:sticky;top:0}
 .brand{font-size:22px}
 .brand .logo{width:42px;height:42px;border-radius:14px}
 .hero{padding:28px 18px 16px}
 .hero h1{font-size:36px;line-height:1.03}
 .hero p{font-size:16px}
 .search{min-height:50px;border-radius:18px;padding:8px 12px}
 .search button{display:none}
 .content{padding:4px 18px 36px}
 .filters{margin-left:-2px;margin-right:-2px}
 .layout{gap:14px}
 .map{display:none}
 .side{gap:12px}
 .section-title{margin-top:4px}
 .business{padding:26px 18px 110px;max-width:none}
 .business h1{font-size:38px;margin:8px 0 10px}
 .business>p{font-size:16px}
 .business .dashboard{grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
 .business .stat{padding:15px;border-radius:17px}
 .business .stat strong{font-size:25px}
 .business .barbox{border-radius:20px;padding:17px}
 .business .bars{height:150px;gap:8px}
 #mobileBusinessBar{position:fixed;left:0;right:0;bottom:0;z-index:100;display:flex;align-items:stretch;gap:2px;padding:8px 6px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.98);border:0;border-top:1px solid #e8e0ee;border-radius:20px 20px 0 0;box-shadow:0 -8px 24px rgba(35,20,50,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
 #mobileBusinessBar button{flex:1;min-width:0;border:0;border-radius:14px;background:transparent;padding:8px 3px;font-size:12px;line-height:1.15;font-weight:850;color:#5f5963;white-space:nowrap}
 #mobileBusinessBar button.active{background:#f2eaff;color:#6d28d9}
 #mobileBusinessBar .biz-icon{font-size:20px;line-height:1;display:block;margin-bottom:4px}
 #mobileBusinessBar #mBusiness{font-size:11px}
 #mobileBusinessCta{display:block;margin:14px 0 0;width:100%;border:0;border-radius:999px;padding:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:17px;font-weight:900;box-shadow:0 10px 22px rgba(124,58,237,.2)}
 #mobileBusinessBenefits{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;text-align:center;color:#5d5270}
 #mobileBusinessBenefits div{font-size:11px;line-height:1.3}
 #mobileBusinessBenefits b{display:block;font-size:23px;margin-bottom:5px}
}
@media(min-width:851px){#mobileBusinessBar,#mobileBusinessCta,#mobileBusinessBenefits{display:none!important}}
`;
 document.head.appendChild(style);
 const bar=document.createElement('div');bar.id='mobileBusinessBar';bar.innerHTML='<button id="mExplore"><span class="biz-icon">📍</span>Explore</button><button id="mTrending"><span class="biz-icon">🔥</span>Trending</button><button id="mBusiness" class="active"><span class="biz-icon">🏪</span>For Businesses</button><button id="mProfile"><span class="biz-icon">●</span>Profile</button>';document.body.appendChild(bar);
 const section=document.getElementById('business');
 if(section){
  const cta=document.createElement('button');cta.id='mobileBusinessCta';cta.textContent='🏪  I own this business  →';section.querySelector('.barbox')?.before(cta);
  const benefits=document.createElement('div');benefits.id='mobileBusinessBenefits';benefits.innerHTML='<div><b>📊</b>See your<br>reviews</div><div><b>👥</b>Understand<br>customers</div><div><b>♥</b>Grow your<br>business</div>';section.appendChild(benefits);
  cta.onclick=()=>window.VibelyClaim?.show(window.__vibelyPlaces?.[0]||{});
 }
 function business(){document.getElementById('explore')?.style.setProperty('display','none','important');document.getElementById('exploreContent')?.style.setProperty('display','none','important');section?.classList.add('show');document.getElementById('mBusiness')?.classList.add('active');}
 function explore(){section?.classList.remove('show');document.getElementById('explore')?.style.removeProperty('display');document.getElementById('exploreContent')?.style.removeProperty('display');document.getElementById('mBusiness')?.classList.remove('active');}
 document.getElementById('mBusiness').onclick=business;document.getElementById('mExplore').onclick=explore;document.getElementById('mTrending').onclick=()=>{explore();document.getElementById('places')?.scrollIntoView({behavior:'smooth'})};document.getElementById('mProfile').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
 document.getElementById('businessBtn')?.addEventListener('click',business);document.getElementById('exploreBtn')?.addEventListener('click',explore);document.getElementById('mobileBusinessCta')?.addEventListener('click',()=>window.VibelyClaim?.show(window.__vibelyPlaces?.[0]||{}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
