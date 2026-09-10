// Vibe Check — safe check-in helpers.
// Keeps exactly one 😕 option and adds a non-invasive fallback for View Vibe.
(function(){
  'use strict';

  function addStyles(){
    if(document.getElementById('not-my-vibe-fix-styles')) return;
    const style=document.createElement('style');
    style.id='not-my-vibe-fix-styles';
    style.textContent=`
      .not-my-vibe-fix{border-color:#e7dce9!important;background:#fff!important;color:#4b4650!important}
      .not-my-vibe-fix.selected{border:2px solid #7c3aed!important;background:#f7f1ff!important;color:#5b21b6!important}
    `;
    document.head.appendChild(style);
  }

  function cleanup(){
    document.querySelectorAll('.emoji-row').forEach(row=>{
      const matches=[...row.querySelectorAll('.emoji')].filter(btn=>btn.textContent.trim()==='😕');
      if(matches.length>1) matches.slice(1).forEach(btn=>btn.remove());
      const option=[...row.querySelectorAll('.emoji')].find(btn=>btn.textContent.trim()==='😕');
      if(option){
        option.classList.add('not-my-vibe-fix');
        option.title='Not my vibe';
        option.setAttribute('aria-label','Not my vibe');
      }
    });
  }

  // Non-invasive fallback: let the original View Vibe handler run first.
  // If it did not open the modal, open it from the clicked card after the event finishes.
  function bindViewVibeFallback(){
    if(window.__vcViewVibeFallbackBound) return;
    document.addEventListener('click',function(event){
      const button=event.target.closest?.('.place-actions .small-btn');
      if(!button || button.textContent.trim()!=='View Vibe') return;
      const card=button.closest('.place');
      if(!card) return;
      setTimeout(function(){
        const modal=document.getElementById('modal');
        if(modal?.classList.contains('show')) return;
        if(typeof window.openModal!=='function') return;
        const cards=[...document.querySelectorAll('.place')];
        const index=cards.indexOf(card);
        if(index>=0) window.openModal(index);
      },0);
    },false);
    window.__vcViewVibeFallbackBound=true;
  }

  function init(){
    addStyles();
    cleanup();
    bindViewVibeFallback();
    const modal=document.getElementById('modal');
    if(modal) new MutationObserver(cleanup).observe(modal,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
