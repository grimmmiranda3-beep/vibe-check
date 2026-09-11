// Vibe Check — mobile navigation polish
(function(){'use strict';
function init(){
 if(document.getElementById('vibelyMobilePolish')) return;
 const style=document.createElement('style'); style.id='vibelyMobilePolish'; style.textContent=`
@media(max-width:850px){
 body{padding-bottom:calc(108px + env(safe-area-inset-bottom));overflow-x:hidden}
 .top{height:76px;padding:0 18px;position:sticky;top:0}
 .brand{font-size:22px}
 .brand .logo{width:42px;height:42px;border-radius:14px}
 .hero{padding:28px 18px 16px}
 .hero h1{font-size:36px;line-height:1.03}
 .hero p{font-size:16px}
 .search{min-height:50px;border-radius:18px;padding:8px 12px}
 .search button{display:none}
 .content{padding:4px 18px 48px}
 .filters{margin-left:-2px;margin-right:-2px}
 .layout{gap:14px}
 .map{display:none}
 .side{gap:12px}
 .section-title{margin-top:4px}
 .business{padding:26px 18px 130px;max-width:none}
 .business h1{font-size:38px;margin:8px 0 10px}
 .business>p{font-size:16px}
 .business .dashboard{grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
 .business .stat{padding:15px;border-radius:17px}
 .business .stat strong{font-size:25px}
 .business .barbox{border-radius:20px;padding:17px}
 .business .bars{height:150px;gap:8px}
 #mobileBusinessBar{position:fixed;left:0;right:0;bottom:0;z-index:100;display:flex;align-items:stretch;gap:2px;padding:8px 6px calc(8px + env(safe-area-inset-bottom));min-height:108px;background:rgba(255,255,255,.98);border:0;border-top:1px solid #e8e0ee;border-radius:20px 20px 0 0;box-shadow:0 -8px 24px rgba(35,20,50,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
 #mobileBusinessBar button{flex:1;min-width:0;border:0;border-radius:14px;background:transparent;padding:8px 3px;font-size:12px;line-height:1.15;font-weight:850;color:#5f5963;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
 #mobileBusinessBar button.active{background:#f2eaff;color:#6d28d9}
 #mobileBusinessBar .biz-icon{font-size:20px;line-height:1;display:block;margin-bottom:4px}
 #mobileBusinessBar #mBusiness{font-size:11px}
 #mobileBusinessCta{display:block;margin:14px 0 0;width:100%;border:0;border-radius:999px;padding:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:17px;font-weight:900;box-shadow:0 10px 22px rgba(124,58,237,.2)}
 #mobileBusinessBenefits{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;text-align:center;color:#5d5270}
 #mobileBusinessBenefits div{font-size:11px;line-height:1.3}
 #mobileBusinessBenefits b{display:block;font-size:23px;margin-bottom:5px}
 .vibely-profile-panel{margin:22px 0;background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 28px #21142c08}
 .vibely-profile-panel h2{margin:0 0 7px;font-size:22px}
 .vibely-profile-panel p{margin:0;color:var(--muted);font-size:14px;line-height:1.5}
 .vibely-profile-actions{display:grid;gap:9px;margin-top:15px}
 .vibely-profile-actions button{border:1px solid var(--line);background:#fff;border-radius:13px;padding:12px;text-align:left;font-weight:800;cursor:pointer}
 .ask-launch{bottom:calc(116px + env(safe-area-inset-bottom)) !important;right:14px;max-width:calc(100vw - 28px)}
 .ask-panel{bottom:calc(174px + env(safe-area-inset-bottom)) !important;right:14px;width:calc(100vw - 28px);max-height:calc(100vh - 196px - env(safe-area-inset-bottom))}
 body{scroll-padding-bottom:calc(120px + env(safe-area-inset-bottom))}
}
@media(max-width:380px){
 .hero h1{font-size:32px}
 .emoji{font-size:21px}
 .emoji-row{gap:4px}
 .small-btn{font-size:13px}
}
@media(min-width:851px){#mobileBusinessBar,#mobileBusinessCta,#mobileBusinessBenefits,.vibely-profile-panel{display:none!important}}
`;
 document.head.appendChild(style);
 const bar=document.createElement('div');bar.id='mobileBusinessBar';bar.innerHTML='<button id="mExplore" type="button" class="active"><span class="biz-icon">📍</span>Explore</button><button id="mTrending" type="button"><span class="biz-icon">🔥</span>Trending</button><button id="mBusiness" type="button"><span class="biz-icon">🏪</span>For Businesses</button><button id="mProfile" type="button"><span class="biz-icon">●</span>Profile</button>';document.body.appendChild(bar);
 const section=document.getElementById('business');
 if(section){
  const cta=document.createElement('button');cta.id='mobileBusinessCta';cta.textContent='🏪  I own this business  →';section.querySelector('.barbox')?.before(cta);
  const benefits=document.createElement('div');benefits.id='mobileBusinessBenefits';benefits.innerHTML='<div><b>📊</b>See your<br>reviews</div><div><b>👥</b>Understand<br>customers</div><div><b>♥</b>Grow your<br>business</div>';section.appendChild(benefits);
  cta.onclick=()=>window.VibelyClaim?.show(window.__vibelyPlaces?.[0]||{});
 }
 const exploreContent=document.getElementById('exploreContent');
 if(exploreContent && !document.getElementById('vibelyProfilePanel')){
  const profile=document.createElement('section');profile.id='vibelyProfilePanel';profile.className='vibely-profile-panel';profile.innerHTML='<h2>👤 Your Vibe Check</h2><p>Your profile is anonymous. Your check-ins stay private to this device while the community signal remains anonymous.</p><div class="vibely-profile-actions"><button id="profileScrollCheckins">💜 View my recent check-ins</button><button id="profilePrivacy">🔒 Privacy & anonymous check-ins</button></div>';exploreContent.appendChild(profile);
  document.getElementById('profileScrollCheckins').onclick=()=>{document.getElementById('places')?.scrollIntoView({behavior:'smooth',block:'start'})};
  document.getElementById('profilePrivacy').onclick=()=>{window.location.href='/privacy.html'};
 }
 function setActive(id){document.querySelectorAll('#mobileBusinessBar button').forEach(b=>b.classList.toggle('active',b.id===id));}
 function business(){window.location.assign('/business.html');}
 function explore(){window.location.assign('/');}
 document.getElementById('mBusiness').onclick=business;
 document.getElementById('mExplore').onclick=explore;
 document.getElementById('mTrending').onclick=function(){ window.location.assign('/feed.html'); };
 document.getElementById('mProfile').onclick=()=>{window.location.href='/profile.html'};
 document.getElementById('businessBtn')?.addEventListener('click',business);
 document.getElementById('exploreBtn')?.addEventListener('click',explore);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
