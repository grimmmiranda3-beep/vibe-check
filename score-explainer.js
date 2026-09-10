// Vibe Check — transparent score explainer.
(function(){
  'use strict';

  function addStyles(){
    if(document.getElementById('vibe-score-explainer-styles')) return;
    const s=document.createElement('style');s.id='vibe-score-explainer-styles';s.textContent=`
      .vibe-why{margin-top:12px;border:1px solid #ece5f2;border-radius:16px;background:linear-gradient(135deg,#fbf9ff,#fff8fc);overflow:hidden}
      .vibe-why-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:transparent;padding:12px 14px;color:#5b21b6;font-size:12px;font-weight:900;cursor:pointer;text-align:left}
      .vibe-why-toggle span:last-child{font-size:16px;transition:transform .18s ease}.vibe-why.open .vibe-why-toggle span:last-child{transform:rotate(180deg)}
      .vibe-why-body{display:none;padding:0 14px 14px}.vibe-why.open .vibe-why-body{display:block}
      .vibe-why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .vibe-why-item{background:#fff;border:1px solid #eee8f2;border-radius:12px;padding:10px}
      .vibe-why-item b{display:block;font-size:12px}.vibe-why-item small{display:block;color:#77727b;font-size:10px;line-height:1.35;margin-top:3px}
      .vibe-why-note{margin-top:9px;color:#77727b;font-size:10px;line-height:1.4}
      .vibe-why-modal{margin-top:14px}
      @media(max-width:520px){.vibe-why-grid{grid-template-columns:1fr 1fr}.vibe-why-toggle{padding:11px 12px}}
    `;document.head.appendChild(s);
  }

  function scoreFrom(el){const n=parseFloat(String(el?.textContent||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:null}
  function addExplainer(host,score,opts){
    if(!host||host.querySelector('.vibe-why'))return;
    const wrap=document.createElement('div');wrap.className='vibe-why'+(opts?.open?' open':'');
    const rating=opts?.rating??null,reviews=opts?.reviews??null,open=opts?.openNow;
    const context=opts?.context||'Place type & local context';
    const live=opts?.live||'Community signal';
    wrap.innerHTML=`<button type="button" class="vibe-why-toggle" aria-expanded="${opts?.open?'true':'false'}"><span>✨ Why this vibe score?</span><span>⌄</span></button><div class="vibe-why-body"><div class="vibe-why-grid"><div class="vibe-why-item"><b>${rating!=null?'⭐ '+rating.toFixed(1)+' Google rating':'⭐ Google rating'}</b><small>${reviews!=null?reviews.toLocaleString()+' reviews help establish confidence':'Business rating provides the baseline.'}</small></div><div class="vibe-why-item"><b>${open===true?'🟢 Open now':open===false?'🔴 Closed':'🕐 Current availability'}</b><small>Availability adds a small live-context signal.</small></div><div class="vibe-why-item"><b>📍 ${context}</b><small>Place type and relevant tags help shape the score.</small></div><div class="vibe-why-item"><b>💜 ${live}</b><small>Anonymous check-ins can influence the score gradually as activity grows.</small></div></div><div class="vibe-why-note">Vibe Check combines public place signals with anonymous community activity. Community activity is bounded so a small number of check-ins cannot overwhelm the baseline.</div></div>`;
    wrap.querySelector('.vibe-why-toggle').addEventListener('click',()=>{const openNow=wrap.classList.toggle('open');wrap.querySelector('.vibe-why-toggle').setAttribute('aria-expanded',String(openNow))});
    host.appendChild(wrap);
  }

  function cardExplainers(){
    document.querySelectorAll('.place').forEach(card=>{
      const body=card.querySelector('.place-body');if(!body||body.querySelector('.vibe-why'))return;
      const score=scoreFrom(card.querySelector('.score'));if(score==null)return;
      const meta=card.querySelector('.meta')?.textContent||'';
      const ratingMatch=card.textContent.match(/([0-5]\.\d)\s*\((\d[\d,]*)\)/);
      addExplainer(body,score,{rating:ratingMatch?parseFloat(ratingMatch[1]):null,reviews:ratingMatch?parseInt(ratingMatch[2].replace(/,/g,''),10):null,context:meta.split('·')[0]?.trim()||'Local place context'});
    });
  }

  function modalExplainer(){
    const body=document.getElementById('modalBody');if(!body||body.querySelector('.vibe-why-modal'))return;
    const score=scoreFrom(body.querySelector('.bigscore'));if(score==null)return;
    const text=body.textContent||'';
    const ratingMatch=text.match(/([0-5]\.\d)\s*\((\d[\d,]*)\)/);
    const status=body.querySelector('.status');
    addExplainer(body,score,{rating:ratingMatch?parseFloat(ratingMatch[1]):null,reviews:ratingMatch?parseInt(ratingMatch[2].replace(/,/g,''),10):null,openNow:status?.classList.contains('closed')?false:status?true:null,context:'Place type & context',live:'Live community signal',open:false});
    const x=body.querySelector('.vibe-why');if(x)x.classList.add('vibe-why-modal');
  }

  function init(){
    addStyles();cardExplainers();modalExplainer();
    const places=document.getElementById('places');if(places)new MutationObserver(()=>cardExplainers()).observe(places,{childList:true,subtree:true});
    const modal=document.getElementById('modal');if(modal)new MutationObserver(()=>modalExplainer()).observe(modal,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
