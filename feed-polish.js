// Vibe Check — live feed interaction polish.
(function(){
  'use strict';
  function addStyles(){
    if(document.getElementById('vc-feed-polish-styles'))return;
    const s=document.createElement('style');s.id='vc-feed-polish-styles';s.textContent=`
      .vc-feed-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:13px;border-top:1px solid #eee8f0}
      .vc-feed-cta-copy{font-size:11px;color:#77727b}.vc-feed-open{border:0;border-radius:12px;padding:10px 13px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:900;cursor:pointer;white-space:nowrap}.vc-feed-open:active{transform:scale(.98)}
      .place-card{transition:transform .16s ease,box-shadow .16s ease}.place-card:hover{transform:translateY(-2px);box-shadow:0 12px 30px #21142c12}
    `;document.head.appendChild(s);
  }
  function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function enhance(){
    document.querySelectorAll('.place-card').forEach(card=>{
      if(card.dataset.vcEnhanced==='1')return;
      const name=card.querySelector('.place')?.textContent?.trim();if(!name)return;
      card.dataset.vcEnhanced='1';
      const cta=document.createElement('div');cta.className='vc-feed-cta';
      cta.innerHTML=`<span class="vc-feed-cta-copy">Want the full vibe?</span><button type="button" class="vc-feed-open">View Vibe →</button>`;
      cta.querySelector('button').addEventListener('click',()=>{window.location.href='/?place='+encodeURIComponent(name)});
      card.appendChild(cta);
      card.addEventListener('click',e=>{if(e.target.closest('button'))return;window.location.href='/?place='+encodeURIComponent(name)});
      card.setAttribute('role','link');card.setAttribute('tabindex','0');card.setAttribute('aria-label','View vibe for '+name);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.location.href='/?place='+encodeURIComponent(name)}});
    });
  }
  function start(){addStyles();enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
