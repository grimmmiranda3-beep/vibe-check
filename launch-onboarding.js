// Vibe Check launch onboarding — first-visit experience.
(function(){
  'use strict';
  const KEY='vibe-check-onboarding-v1';
  if(localStorage.getItem(KEY)==='seen') return;

  function mount(){
    if(document.getElementById('vibeOnboarding')) return;
    const style=document.createElement('style');
    style.id='vibeOnboardingStyle';
    style.textContent=`
      #vibeOnboarding{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(23,16,28,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .vibe-onboard-card{width:min(680px,100%);background:#fff;border:1px solid #ece8ee;border-radius:28px;padding:30px;box-shadow:0 30px 90px rgba(18,10,28,.28);position:relative;overflow:hidden}
      .vibe-onboard-glow{position:absolute;width:220px;height:220px;border-radius:50%;background:linear-gradient(135deg,#7c3aed55,#ec489955);filter:blur(35px);right:-80px;top:-100px;pointer-events:none}
      .vibe-onboard-logo{width:54px;height:54px;border-radius:17px;background:linear-gradient(135deg,#7c3aed,#ec4899);display:grid;place-items:center;color:#fff;font-size:27px;font-weight:900;box-shadow:0 10px 25px #7c3aed30}
      .vibe-onboard-kicker{margin-top:20px;color:#7c3aed;font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .vibe-onboard-card h2{font-size:34px;line-height:1.08;margin:7px 0 9px;letter-spacing:-.03em}
      .vibe-onboard-card>p{margin:0;color:#77727b;font-size:16px;line-height:1.5;max-width:560px}
      .vibe-onboard-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0}
      .vibe-onboard-step{border:1px solid #ece8ee;background:#faf8fb;border-radius:18px;padding:15px}
      .vibe-onboard-icon{font-size:25px;margin-bottom:8px}
      .vibe-onboard-step b{display:block;font-size:14px;margin-bottom:4px}
      .vibe-onboard-step span{display:block;color:#77727b;font-size:12px;line-height:1.4}
      .vibe-onboard-cta{width:100%;border:0;border-radius:14px;padding:14px 18px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 10px 25px #7c3aed28}
      .vibe-onboard-note{text-align:center;color:#77727b;font-size:11px;margin-top:10px}
      @media(max-width:560px){#vibeOnboarding{padding:12px}.vibe-onboard-card{padding:22px;border-radius:24px}.vibe-onboard-card h2{font-size:29px}.vibe-onboard-card>p{font-size:15px}.vibe-onboard-steps{grid-template-columns:1fr;gap:8px;margin:19px 0}.vibe-onboard-step{display:grid;grid-template-columns:35px 1fr;column-gap:9px;padding:11px 12px}.vibe-onboard-icon{grid-row:1 / span 2;margin:2px 0 0}.vibe-onboard-step b{margin:0}.vibe-onboard-step span{font-size:11px}}
    `;
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.id='vibeOnboarding';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Welcome to Vibe Check');
    overlay.innerHTML=`
      <div class="vibe-onboard-card">
        <div class="vibe-onboard-glow"></div>
        <div class="vibe-onboard-logo">✦</div>
        <div class="vibe-onboard-kicker">Welcome to Vibe Check</div>
        <h2>Know the vibe before you go.</h2>
        <p>See what people are feeling at local places right now — then add your own anonymous vibe to help the next person.</p>
        <div class="vibe-onboard-steps">
          <div class="vibe-onboard-step"><div class="vibe-onboard-icon">🔎</div><div><b>Find a place</b><span>Search restaurants, coffee shops, bars and more.</span></div></div>
          <div class="vibe-onboard-step"><div class="vibe-onboard-icon">⚡</div><div><b>Check the live vibe</b><span>See the Vibe Check score and recent crowd energy.</span></div></div>
          <div class="vibe-onboard-step"><div class="vibe-onboard-icon">💜</div><div><b>Add your vibe</b><span>Check in anonymously. Your voice helps shape the live signal.</span></div></div>
        </div>
        <button class="vibe-onboard-cta" id="vibeOnboardingStart">Let's find a vibe →</button>
        <div class="vibe-onboard-note">No account required · Anonymous by design</div>
      </div>`;
    document.body.appendChild(overlay);

    // Keep the floating Ask Vibely launcher from covering the onboarding CTA.
    const askLauncher=document.getElementById('askVibelyLauncher');
    if(askLauncher) askLauncher.style.display='none';

    document.body.style.overflow='hidden';

    function close(){
      localStorage.setItem(KEY,'seen');
      overlay.remove();
      document.body.style.overflow='';
      if(askLauncher) askLauncher.style.display='';
      const search=document.getElementById('search');
      if(search) search.focus({preventScroll:true});
    }
    document.getElementById('vibeOnboardingStart').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey)}});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
