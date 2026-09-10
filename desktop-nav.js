// Vibely Check — shared navigation, business routing, and Ask Vibely loader.
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

  function showBusiness(){
    const old=document.getElementById('vibelyBusinessNavPage');
    if(old){ old.style.display='block'; window.scrollTo(0,0); return; }
    const explore=document.getElementById('explore');
    const content=document.getElementById('exploreContent');
    const legacy=document.getElementById('business');
    if(explore) explore.style.display='none';
    if(content) content.style.display='none';
    if(legacy) legacy.style.display='none';

    const page=document.createElement('section');
    page.id='vibelyBusinessNavPage';
    page.innerHTML=`
      <div class="vbn-wrap">
        <button class="vbn-back" type="button">← Explore</button>
        <div class="vbn-hero">
          <div class="vbn-kicker">VIBE CHECK FOR BUSINESS</div>
          <h1>Know what your<br>customers feel.</h1>
          <p>Real-time vibes. Deeper insights. A stronger business.</p>
          <div class="vbn-hero-actions"><button class="vbn-claim" type="button">🏪 Claim Your Business for Free →</button><span>Already have a business? <b>Log in</b></span></div>
        </div>
        <div class="vbn-metrics">
          <div><small>Vibe Score</small><strong>9.4 🔥</strong><em>↑ +0.6</em></div>
          <div><small>Google Rating</small><strong>4.7 ⭐</strong><em>↑ +0.3</em></div>
          <div><small>Top Vibe</small><strong>😊 Chill</strong></div>
          <div><small>Check-ins</small><strong>128</strong><em>↑ +24%</em></div>
        </div>
        <div class="vbn-plans">
          <article><label>FREE</label><h2>Get Discovered</h2><p>Build trust and attract customers with your basic vibe insights.</p><ul><li>✓ Claimed business badge</li><li>✓ Basic Vibe Score</li><li>✓ Customer vibe overview</li></ul><button class="vbn-free" type="button">Claim for Free</button></article>
          <article class="vbn-pro"><label>♛ PRO</label><h2>Turn Vibes Into Growth</h2><p>Get deeper insights, smarter decisions, and more repeat customers.</p><ul><li>✓ Everything in Free</li><li>✓ Weekly vibe trends</li><li>✓ Peak vibe times</li><li>✓ Detailed customer vibe breakdown</li><li>✓ Business insights & recommendations</li></ul><button class="vbn-pro-btn" type="button">♛ Join the Pro Waitlist</button></article>
        </div>
        <div class="vbn-power"><div><div class="vbn-kicker">REAL BUSINESS INSIGHTS</div><h2>See the Power of Vibe Check</h2><p>Real data. Real customers. Real impact.</p><div class="vbn-stats"><b>+32%<small>More positive reviews</small></b><b>+28%<small>Repeat visits</small></b><b>9.4<small>Average vibe score</small></b></div></div><div class="vbn-chart"><strong>Vibe Trends</strong><span>7 days</span><div>╱╲╱╱╱╱╱╱</div><b>9.4 🔥</b></div></div>
        <p class="vbn-note">No payment required today · Pro pricing will be shown before launch</p>
      </div>`;
    const style=document.createElement('style');
    style.id='vibelyBusinessNavStyle';
    style.textContent=`#vibelyBusinessNavPage{display:block;background:#f8f6f9;min-height:calc(100vh - 72px)}.vbn-wrap{max-width:980px;margin:auto;padding:22px 18px 50px}.vbn-back{border:1px solid #e8e1ed;background:#fff;color:#7137e8;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer;margin-bottom:16px}.vbn-hero{padding:32px;border-radius:30px;background:linear-gradient(135deg,#fff1f7,#fff9fc 55%,#f7efff);border:1px solid #eee2f1}.vbn-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;color:#7b3ff1}.vbn-hero h1{font-size:48px;line-height:1.02;letter-spacing:-.04em;margin:9px 0 12px}.vbn-hero p{font-size:18px;color:#686273;margin:0}.vbn-hero-actions{margin-top:25px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}.vbn-claim{border:0;border-radius:999px;padding:15px 22px;background:linear-gradient(90deg,#783ef0,#e43b9c);color:#fff;font-weight:900;font-size:15px;cursor:pointer}.vbn-hero-actions span{font-size:12px;color:#77717f}.vbn-hero-actions b{color:#7137e8}.vbn-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.vbn-metrics>div{background:#fff;border:1px solid #e9e2ec;border-radius:20px;padding:17px}.vbn-metrics small,.vbn-metrics strong,.vbn-metrics em{display:block}.vbn-metrics small{color:#716b79;font-size:11px}.vbn-metrics strong{font-size:23px;margin:5px 0}.vbn-metrics em{color:#15944e;font-size:10px;font-style:normal;font-weight:800}.vbn-plans{display:grid;grid-template-columns:1fr 1fr;gap:14px}.vbn-plans article{background:#fff;border:1px solid #e8def4;border-radius:24px;padding:23px}.vbn-plans .vbn-pro{background:linear-gradient(145deg,#fbf4ff,#fff0f8);border:2px solid #db62d0}.vbn-plans label{display:inline-block;padding:5px 12px;border-radius:999px;background:#f1e8ff;color:#743cf0;font-size:10px;font-weight:900;letter-spacing:.08em}.vbn-pro label{background:linear-gradient(90deg,#843eea,#df42a0);color:#fff}.vbn-plans h2{font-size:23px;margin:10px 0 6px}.vbn-plans p{color:#676273;font-size:13px;line-height:1.45}.vbn-plans ul{list-style:none;padding:0;margin:16px 0;display:grid;gap:8px;font-size:12px}.vbn-free,.vbn-pro-btn{width:100%;border-radius:999px;padding:13px;font-weight:900;cursor:pointer}.vbn-free{background:#fff;border:1px solid #7b42ed;color:#7b42ed}.vbn-pro-btn{border:0;background:linear-gradient(90deg,#783ef0,#e43b9c);color:#fff}.vbn-power{margin-top:14px;padding:23px;border-radius:24px;background:#fff;border:1px solid #eee8f1;display:grid;grid-template-columns:1fr 1fr;gap:18px}.vbn-power h2{font-size:20px;margin:7px 0 3px}.vbn-power p{font-size:12px;color:#777180}.vbn-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.vbn-stats b{background:#faf8fc;border-radius:14px;padding:13px;font-size:18px}.vbn-stats small{display:block;font-size:9px;color:#777180;margin-top:4px}.vbn-chart{border:1px solid #eee8f1;border-radius:16px;padding:15px;position:relative}.vbn-chart strong{font-size:12px}.vbn-chart>span{float:right;font-size:10px;color:#777}.vbn-chart>div{margin-top:35px;font-size:31px;color:#8a43ed;letter-spacing:2px}.vbn-chart>b{position:absolute;right:14px;top:42px;background:#9d49ef;color:#fff;padding:5px 8px;border-radius:999px;font-size:10px}.vbn-note{text-align:center;color:#817b88;font-size:9px;margin:12px 0}.vbn-back{font-size:13px}@media(max-width:700px){.vbn-wrap{padding:14px 12px 35px}.vbn-hero{padding:23px}.vbn-hero h1{font-size:35px}.vbn-hero p{font-size:16px}.vbn-metrics,.vbn-plans,.vbn-power{grid-template-columns:1fr 1fr}.vbn-power{grid-template-columns:1fr}.vbn-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:480px){.vbn-metrics,.vbn-plans{grid-template-columns:1fr}.vbn-hero-actions{display:block}.vbn-claim{width:100%;margin-bottom:10px}}`;
    document.head.appendChild(style); document.body.appendChild(page); window.scrollTo(0,0);
    const back=()=>{page.remove();style.remove();if(explore)explore.style.display='block';if(content)content.style.display='block';if(legacy)legacy.style.display='none';};
    page.querySelector('.vbn-back').onclick=back;
    page.querySelector('.vbn-claim').onclick=()=>window.VibelyClaim?.show?.((window.__vibelyPlaces&&window.__vibelyPlaces[0])||{});
    page.querySelector('.vbn-free').onclick=()=>window.VibelyClaim?.show?.((window.__vibelyPlaces&&window.__vibelyPlaces[0])||{});
    page.querySelector('.vbn-pro-btn').onclick=()=>window.VibelyClaim?.show?.((window.__vibelyPlaces&&window.__vibelyPlaces[0])||{},'pro');
  }

  function init(){
    loadAskVibely();
    const nav=document.querySelector('.nav'); if(!nav || nav.dataset.sharedDesktopNav==='1') return;
    nav.dataset.sharedDesktopNav='1';
    const existingBusiness=document.getElementById('businessBtn');
    if(existingBusiness){existingBusiness.textContent='🏪 For Businesses';existingBusiness.setAttribute('aria-label','For Businesses');existingBusiness.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showBusiness();},true);}
    const trending=document.createElement('button');trending.id='desktopTrendingBtn';trending.type='button';trending.textContent='🔥 Trending';trending.addEventListener('click',()=>{window.location.href='/feed.html';});
    const profile=document.createElement('button');profile.id='desktopProfileBtn';profile.type='button';profile.textContent='👤 Profile';profile.addEventListener('click',()=>{window.location.href='/profile.html';});
    nav.appendChild(trending);if(existingBusiness) nav.appendChild(existingBusiness);nav.appendChild(profile);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();