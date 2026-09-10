// Vibe Check — safe "Not my vibe" option cleanup.
// This script intentionally does NOT wrap openModal().
// The core page already owns modal opening; this helper only removes duplicate
// 😕 options and preserves the core option's click handler.
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
      const buttons=[...row.querySelectorAll('.emoji')];
      const matches=buttons.filter(btn=>btn.textContent.trim()==='😕');
      if(matches.length>1){
        // Keep the first/core button so its original selectEmoji listener survives.
        matches.slice(1).forEach(btn=>btn.remove());
      }
      const option=[...row.querySelectorAll('.emoji')].find(btn=>btn.textContent.trim()==='😕');
      if(option){
        option.classList.add('not-my-vibe-fix');
        option.title='Not my vibe';
        option.setAttribute('aria-label','Not my vibe');
      }
    });
  }

  function init(){
    addStyles();
    cleanup();
    const modal=document.getElementById('modal');
    if(modal) new MutationObserver(cleanup).observe(modal,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
