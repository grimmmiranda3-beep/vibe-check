// Vibe Check — safe check-in helpers.
// Keeps exactly one 😕 option and provides a defensive View Vibe click path.
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

  // The recent vibe-option helper must never interfere with the existing View Vibe action.
  // If an older inline handler is unavailable, route the click directly to openModal using
  // the card's current DOM position. Capture-phase handling prevents duplicate opens.
  function bindViewVibeGuard(){
    if(window.__vcViewVibeGuardBound) return;
    document.addEventListener('click',function(event){
      const button=event.target.closest?.('.place-actions .small-btn');
      if(!button) return;
      const actions=button.parentElement;
      if(!actions || actions.querySelector('.checkin-btn')===button) return;
      const buttons=[...actions.querySelectorAll('.small-btn')];
      if(buttons.indexOf(button)!==0) return;
      if(typeof window.openModal!=='function') return;
      const card=button.closest('.place');
      if(!card) return;
      const cards=[...document.querySelectorAll('.place')];
      const index=cards.indexOf(card);
      if(index<0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.openModal(index);
    },true);
    window.__vcViewVibeGuardBound=true;
  }

  function init(){
    addStyles();
    cleanup();
    bindViewVibeGuard();
    const modal=document.getElementById('modal');
    if(modal) new MutationObserver(cleanup).observe(modal,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
