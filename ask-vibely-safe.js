// Vibely Check — resilient Ask Vibely fallback loader.
// Creates the launcher/panel only if the primary Ask Vibely module did not mount.
(function(){
  'use strict';
  function boot(){
    if(document.getElementById('askVibelyLauncher') || document.getElementById('askVibelySafeLauncher')) return;

    const style=document.createElement('style');
    style.id='askVibelySafeStyles';
    style.textContent=`
      #askVibelySafeLauncher{position:fixed!important;right:20px!important;bottom:20px!important;z-index:9999!important;border:0!important;border-radius:999px!important;padding:13px 18px!important;background:linear-gradient(135deg,#7c3aed,#ec4899)!important;color:#fff!important;font-weight:900!important;box-shadow:0 14px 35px #3b1b5533!important;cursor:pointer!important;display:block!important;visibility:visible!important;opacity:1!important}
      #askVibelySafeLauncher small{display:block;font-size:10px;font-weight:700;opacity:.9;margin-top:2px}
      #askVibelySafePanel{position:fixed!important;right:20px!important;bottom:78px!important;width:min(420px,calc(100vw - 28px))!important;max-height:min(650px,calc(100vh - 105px))!important;overflow:auto!important;background:#fff!important;border:1px solid #ece8ee!important;border-radius:24px!important;box-shadow:0 25px 80px #17101c33!important;z-index:10000!important;display:none}
      #askVibelySafePanel.show{display:block!important}
      #askVibelySafePanel .safe-head{padding:18px;border-bottom:1px solid #ece8ee;display:flex;justify-content:space-between;gap:12px}
      #askVibelySafePanel h3{margin:0;font-size:19px}.safe-head p{margin:5px 0 0;color:#77727b;font-size:12px;line-height:1.4}
      #askVibelySafePanel .safe-close{border:0;background:#f3eff5;border-radius:50%;width:32px;height:32px;cursor:pointer}
      #askVibelySafePanel .safe-body{padding:16px}.safe-prompts{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
      #askVibelySafePanel .safe-prompt{border:1px solid #e6dff0;background:#faf8ff;color:#5b21b6;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:750;cursor:pointer}
      #askVibelySafePanel textarea{width:100%;min-height:90px;border:1px solid #ddd7e4;border-radius:15px;padding:12px;resize:vertical;outline:none;box-sizing:border-box}
      .safe-row{display:flex;gap:8px;margin-top:9px}.safe-row input{flex:1;border:1px solid #e6dfe8;border-radius:11px;padding:9px;min-width:0}.safe-ask{border:0;background:#17151a;color:#fff;border-radius:11px;padding:9px 14px;font-weight:850;cursor:pointer}.safe-ask:disabled{opacity:.6}
      .safe-result{margin-top:14px}.safe-message{padding:12px 13px;background:#faf8fb;border-radius:15px;font-size:14px;line-height:1.5}.safe-empty{font-size:12px;color:#77727b;margin-top:9px}
      .safe-rec{margin-top:9px;border:1px solid #ece8ee;border-radius:16px;padding:13px}.safe-rec-top{display:flex;justify-content:space-between;gap:8px}.safe-name{font-weight:900}.safe-match{font-weight:950;color:#7c3aed}.safe-reason{font-size:12px;color:#625d65;line-height:1.45;margin:6px 0 10px}.safe-actions{display:flex;gap:7px}.safe-actions button,.safe-actions a{flex:1;text-align:center;text-decoration:none;border:1px solid #e8e2eb;background:#fff;color:#29252d;border-radius:9px;padding:8px;font-size:12px;font-weight:800}
      @media(max-width:700px){#askVibelySafeLauncher{right:14px!important;bottom:calc(92px + env(safe-area-inset-bottom))!important}#askVibelySafePanel{right:14px!important;bottom:calc(145px + env(safe-area-inset-bottom))!important;max-height:calc(100dvh - 175px)!important}}
    `;
    document.head.appendChild(style);

    const launcher=document.createElement('button');
    launcher.id='askVibelySafeLauncher';
    launcher.type='button';
    launcher.innerHTML='✨ Ask Vibely<small>Find a place that matches your vibe</small>';
    document.body.appendChild(launcher);

    const panel=document.createElement('section');
    panel.id='askVibelySafePanel';
    panel.innerHTML=`<div class="safe-head"><div><h3>✨ Ask Vibely</h3><p>Tell Vibely what you're looking for and I'll recommend local matches.</p></div><button class="safe-close" aria-label="Close">×</button></div><div class="safe-body"><div class="safe-prompts"><button class="safe-prompt">💕 Cute first date</button><button class="safe-prompt">👯 Girls night</button><button class="safe-prompt">😌 Quiet coffee</button><button class="safe-prompt">🔥 Fun tonight</button></div><textarea placeholder="Try: Find me somewhere fun but not too loud for a girls night."></textarea><div class="safe-row"><input placeholder="City or area"><button class="safe-ask">Ask</button></div><div class="safe-result"></div></div>`;
    document.body.appendChild(panel);

    const input=panel.querySelector('textarea'),loc=panel.querySelector('input'),ask=panel.querySelector('.safe-ask'),result=panel.querySelector('.safe-result');
    launcher.onclick=()=>{panel.classList.toggle('show');if(panel.classList.contains('show'))input.focus()};
    panel.querySelector('.safe-close').onclick=()=>panel.classList.remove('show');
    panel.querySelectorAll('.safe-prompt').forEach(b=>b.onclick=()=>{input.value=b.textContent.replace(/^\S+\s/,'');input.focus()});

    function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
    function url(s){try{const u=new URL(s,location.origin);return ['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
    function places(){return Array.isArray(window.places)?window.places:[]}
    ask.onclick=async()=>{
      const prompt=input.value.trim();if(!prompt){result.innerHTML='<div class="safe-empty">Tell me what vibe you want first.</div>';return}
      ask.disabled=true;ask.textContent='Thinking…';result.innerHTML='<div class="safe-message">Finding your vibe… ✨</div>';
      try{
        const r=await fetch('/api/ask-vibely',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,location:loc.value.trim(),places:places().slice(0,12),passport:window.VibelyPassport?.derive?.()||null}),cache:'no-store'});
        const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Ask Vibely is unavailable right now.');
        result.innerHTML='<div class="safe-message">'+esc(data.message||'I found a few possibilities for you.')+'</div>'+(data.recommendations||[]).map(x=>'<div class="safe-rec"><div class="safe-rec-top"><span class="safe-name">'+esc(x.name)+'</span><span class="safe-match">'+esc(x.confidenceTier==='forming'?'Potential match':(x.match==null?'Potential match':x.match+'% match'))+'</span></div><div class="safe-reason">'+esc(x.reason||'')+'</div><div class="safe-actions"><button class="safe-view" data-name="'+esc(x.name)+'">View Vibe</button>'+(x.mapsUrl?'<a href="'+url(x.mapsUrl)+'" target="_blank" rel="noopener">Directions</a>':'')+'</div></div>').join('')||'<div class="safe-empty">I couldn’t find a strong match. Try another vibe or nearby area.</div>';
        panel.querySelectorAll('.safe-view').forEach(b=>b.onclick=()=>{const ps=places(),i=ps.findIndex(p=>p.name===b.dataset.name);if(i>=0&&typeof window.openModal==='function'){panel.classList.remove('show');window.openModal(i)}});
      }catch(e){result.innerHTML='<div class="safe-message">'+esc(e.message)+'</div>'}finally{ask.disabled=false;ask.textContent='Ask'}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
